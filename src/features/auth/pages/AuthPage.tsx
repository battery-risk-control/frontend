import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, signup } from '../../../api/auth.api'
import type { LoginFormValues, SignupFormValues } from '../../../api/types'
import { useAuthState } from '../../../lib/useAuthState'
import { DASHBOARD_PATH_BY_TIER } from '../../../lib/dashboardPaths'
import { AuthTabs, type AuthTabKey } from '../components/AuthTabs'
import { LoginForm } from '../components/LoginForm'
import { SignupForm } from '../components/SignupForm'
import { PendingApprovalScreen } from '../components/PendingApprovalScreen'
import { SecurityBadge } from '../components/SecurityBadge'
import styles from './AuthPage.module.css'

/**
 * 로그인/회원가입 통합 페이지 (Seq 32). 좌:우 5:6 스플릿 스크린 — 좌측은 아직 플레이스홀더 영역만 둔다.
 * 로그인/회원가입 응답이 PENDING이면 승인 대기 락 화면(Seq 35)으로 전환한다.
 */
export function AuthPage() {
  const navigate = useNavigate()
  const { orgTier, signIn } = useAuthState()
  const [activeTab, setActiveTab] = useState<AuthTabKey>('login')
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // signIn()과 navigate()를 같은 이벤트 핸들러에서 함께 호출하면(로그아웃에서 실측된 것과 같은 원인으로)
  // react-router의 history 갱신과 인증 Context 갱신이 서로 다른 타이밍에 처리되면서, 목적지 라우트의
  // RequireAuth가 아직 반영되지 않은 orgTier를 읽어 다시 /auth로 돌려보낼 위험이 있다. orgTier가 실제로
  // 커밋된 뒤(useEffect)에만 navigate해 이 경쟁을 원천 차단한다 — 이미 로그인된 채 /auth로 오면
  // 자동으로 대시보드로 보내는 부수 효과도 있다.
  useEffect(() => {
    if (orgTier) {
      navigate(DASHBOARD_PATH_BY_TIER[orgTier], { replace: true })
    }
  }, [orgTier, navigate])

  async function handleLogin(values: LoginFormValues) {
    setAuthError(null)
    try {
      const result = await login(values)
      if ('error' in result) {
        setPendingMessage(result.message)
        return
      }
      signIn(result.org_tier, values.email)
    } catch (err) {
      // 백엔드 연동(②단계) 시 mock에는 없던 실패(예: 비밀번호 오류)가 여기로 들어온다.
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
        <AuthTabs activeTab={activeTab} onChange={setActiveTab} />
        {authError && <p className={styles.authError}>{authError}</p>}
        {activeTab === 'login' ? <LoginForm onSubmit={handleLogin} /> : <SignupForm onSubmit={handleSignup} />}
        <SecurityBadge />
      </div>
    </div>
  )
}
