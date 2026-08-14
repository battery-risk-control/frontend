import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AuthApiError,
  fetchCaptcha,
  login,
  resetExpiredPassword,
  signup,
  type CaptchaData,
} from '../../../api/auth.api'
import type { LoginFormValues, SignupFormValues } from '../../../api/types'
import { useAuthState } from '../../../lib/useAuthState'
import { DASHBOARD_PATH_BY_TIER } from '../../../lib/dashboardPaths'
import { AuthTabs, type AuthTabKey } from '../components/AuthTabs'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { PasswordExpiredResetForm } from '../components/PasswordExpiredResetForm'
import { PendingApprovalScreen } from '../components/PendingApprovalScreen'
import { SecurityBadge } from '../components/SecurityBadge'
import { PrivacyPolicyModal } from '../../../components/layout/PrivacyPolicyModal'
import styles from './AuthPage.module.css'

// three.js 로그인 히어로 연출은 무겁고(three 청크) 로그인 폼과 무관하므로 lazy로 뗀다 —
// 폼이 먼저 그려지고 입력 가능해진 뒤 배경 연출이 채워진다.
// [ROLLBACK] 되돌리려면 이 lazy 선언을 지우고 위에서 `import { AuthPrismScene } from
// '../components/AuthPrismScene'` 정적 import를 복원한다.
const AuthPrismScene = lazy(() =>
  import('../components/AuthPrismScene').then((m) => ({ default: m.AuthPrismScene })),
)

/**
 * 로그인/회원가입 통합 페이지 (Seq 32). 좌:우 5:6 스플릿 스크린.
 * 로그인/회원가입 응답이 PENDING이면 승인 대기 락 화면(Seq 35)으로 전환한다.
 * 규제 가이드 대응: 로그인 실패 누적 시 캡챠(⑥), 비밀번호 만료 시 재설정 화면(⑥),
 * 개인정보 처리방침 모달 접근(④)을 제공한다.
 */
export function AuthPage() {
  const navigate = useNavigate()
  const { orgTier, signIn } = useAuthState()
  const [activeTab, setActiveTab] = useState<AuthTabKey>('login')
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null)
  // 비밀번호 만료로 재설정이 필요한 계정의 로그인 아이디(이메일). 설정되면 재설정 화면으로 전환한다.
  const [expiredEmail, setExpiredEmail] = useState<string | null>(null)
  const [policyOpen, setPolicyOpen] = useState(false)
  const showPrismExperiment = import.meta.env.VITE_AUTH_PRISM_EXPERIMENT !== 'off'

  useEffect(() => {
    if (orgTier) {
      navigate(DASHBOARD_PATH_BY_TIER[orgTier], { replace: true })
    }
  }, [orgTier, navigate])

  // [성능] 사용자가 자격증명을 입력하는 동안(수 초) 유휴 시점에 각 계층 대시보드 청크를 미리
  // 받아 둔다. 로그인 성공 직후의 화면 전환이 청크 다운로드를 기다리지 않아 체감상 즉시 열린다.
  // routes.tsx의 lazy와 같은 import 지정자라 청크를 공유한다(중복 다운로드 없음). 유휴 실행이라
  // 폼 상호작용을 막지 않고, 실패는 그냥 나중에 정식 lazy 로드로 재시도되므로 삼킨다.
  useEffect(() => {
    const preload = () => {
      void import('../../purchasing/pages/PurchasingDashboardPage').catch(() => {})
      void import('../../planning/pages/PlanningDashboardPage').catch(() => {})
      void import('../../executive/pages/ExecutiveDashboardPage').catch(() => {})
    }
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }).requestIdleCallback
    if (ric) {
      const id = ric(preload, { timeout: 2000 })
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback?.(id)
    }
    const t = window.setTimeout(preload, 400)
    return () => window.clearTimeout(t)
  }, [])

  async function refreshCaptcha() {
    try {
      setCaptcha(await fetchCaptcha())
    } catch {
      setCaptcha(null)
    }
  }

  async function handleLogin(values: LoginFormValues) {
    setAuthError(null)
    try {
      const result = await login(values)
      if ('error' in result) {
        setPendingMessage(result.message)
        return
      }
      setCaptcha(null)
      signIn(result.org_tier, values.email, {
        accessToken: result.access_token,
        expiresInSeconds: result.expires_in,
      })
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.code === 'PASSWORD_EXPIRED') {
          setExpiredEmail(values.email)
          setCaptcha(null)
          return
        }
        if (err.code === 'CAPTCHA_REQUIRED' || err.code === 'CAPTCHA_INVALID') {
          await refreshCaptcha()
          setAuthError(err.message)
          return
        }
        // ACCOUNT_LOCKED / INVALID_CREDENTIALS 등 — 안내 문구만 표시. 잠금이면 캡챠는 감춘다.
        if (err.code === 'ACCOUNT_LOCKED') {
          setCaptcha(null)
        }
        setAuthError(err.message)
        return
      }
      setAuthError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    }
  }

  async function handleSignup(values: SignupFormValues) {
    setAuthError(null)
    try {
      const result = await signup(values)
      setPendingMessage(result.message)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    }
  }

  async function handlePasswordReset(input: { currentPassword: string; newPassword: string }) {
    if (!expiredEmail) return
    setAuthError(null)
    try {
      await resetExpiredPassword({ email: expiredEmail, ...input })
      setExpiredEmail(null)
      setActiveTab('login')
      setAuthError('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.')
    }
  }

  function handleGoHome() {
    setPendingMessage(null)
    setActiveTab('login')
  }

  if (pendingMessage) {
    return <PendingApprovalScreen message={pendingMessage} onGoHome={handleGoHome} />
  }

  return (
    <div className={styles.page}>
      {showPrismExperiment ? (
        <Suspense fallback={<div className={styles.placeholderPanel} aria-hidden="true" />}>
          <AuthPrismScene />
        </Suspense>
      ) : (
        <div className={styles.placeholderPanel}>
          <span>플랫폼 소개 영역 (준비 중)</span>
        </div>
      )}
      <div className={styles.formPanel}>
        <Link to="/" className={styles.homeLink}>
          ← 홈으로
        </Link>
        {expiredEmail ? (
          <PasswordExpiredResetForm
            email={expiredEmail}
            onSubmit={handlePasswordReset}
            onCancel={() => {
              setExpiredEmail(null)
              setAuthError(null)
            }}
          />
        ) : (
          <>
            <AuthTabs activeTab={activeTab} onChange={setActiveTab} />
            {authError && <p className={styles.authError}>{authError}</p>}
            {activeTab === 'login' ? (
              <LoginForm
                onSubmit={handleLogin}
                captcha={captcha ? { id: captcha.captcha_id, image: captcha.image } : null}
                onRefreshCaptcha={refreshCaptcha}
              />
            ) : (
              <SignupForm onSubmit={handleSignup} onOpenPolicy={() => setPolicyOpen(true)} />
            )}
          </>
        )}
        <SecurityBadge />
        <button type="button" className={styles.policyLink} onClick={() => setPolicyOpen(true)}>
          개인정보 처리방침
        </button>
      </div>
      {policyOpen && <PrivacyPolicyModal onClose={() => setPolicyOpen(false)} />}
    </div>
  )
}
