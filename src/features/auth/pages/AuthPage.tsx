import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (orgTier) {
      navigate(DASHBOARD_PATH_BY_TIER[orgTier], { replace: true })
    }
  }, [orgTier, navigate])

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
      <div className={styles.placeholderPanel}>
        <span>플랫폼 소개 영역 (준비 중)</span>
      </div>
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
