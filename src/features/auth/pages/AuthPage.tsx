import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
  useNavigate,
} from 'react-router-dom'
import {
  login,
  signup,
} from '../../../api/auth.api'
import type {
  LoginFormValues,
  SignupFormValues,
} from '../../../api/types'
import { useAuthState } from '../../../lib/useAuthState'
import {
  DASHBOARD_PATH_BY_TIER,
} from '../../../lib/dashboardPaths'
import {
  AuthTabs,
  type AuthTabKey,
} from '../components/AuthTabs'
import {
  LoginForm,
} from '../components/LoginForm'
import {
  SignupForm,
} from '../components/SignupForm'
import {
  PendingApprovalScreen,
} from '../components/PendingApprovalScreen'
import {
  SecurityBadge,
} from '../components/SecurityBadge'
import styles from './AuthPage.module.css'

/**
 * 로그인과 회원가입을 제공하는 통합 인증 페이지.
 *
 * 승인 대기 응답은 별도 화면으로 표시하고,
 * 로그인 성공 후 인증 Context가 갱신되면
 * 사용자 계층에 맞는 대시보드로 이동한다.
 */
export function AuthPage() {
  const navigate = useNavigate()

  const {
    orgTier,
    signIn,
  } = useAuthState()

  const [
    activeTab,
    setActiveTab,
  ] = useState<AuthTabKey>('login')

  const [
    pendingMessage,
    setPendingMessage,
  ] = useState<string | null>(null)

  const [
    authError,
    setAuthError,
  ] = useState<string | null>(null)

  /**
   * signIn과 navigate를 같은 이벤트에서 실행하지 않고,
   * 인증 Context에 orgTier가 반영된 다음 이동한다.
   */
  useEffect(() => {
    if (orgTier) {
      navigate(
        DASHBOARD_PATH_BY_TIER[orgTier],
        {
          replace: true,
        },
      )
    }
  }, [
    orgTier,
    navigate,
  ])

  async function handleLogin(
    values: LoginFormValues,
  ) {
    setAuthError(null)

    try {
      const result = await login(values)

      if ('error' in result) {
        setPendingMessage(result.message)
        return
      }

      signIn(
        result.org_tier,
        values.email,
        result.access_token,
      )
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : '로그인에 실패했습니다.',
      )
    }
  }

  async function handleSignup(
    values: SignupFormValues,
  ) {
    setAuthError(null)

    try {
      const result = await signup(values)
      setPendingMessage(result.message)
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : '회원가입에 실패했습니다.',
      )
    }
  }

  function handleGoHome() {
    setPendingMessage(null)
    setActiveTab('login')
  }

  if (pendingMessage) {
    return (
      <PendingApprovalScreen
        message={pendingMessage}
        onGoHome={handleGoHome}
      />
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.placeholderPanel}>
        <span>
          플랫폼 소개 영역 (준비 중)
        </span>
      </div>

      <div className={styles.formPanel}>
        <Link
          to="/"
          className={styles.homeLink}
        >
          ← 홈으로
        </Link>

        <AuthTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {authError && (
          <p className={styles.authError}>
            {authError}
          </p>
        )}

        {activeTab === 'login' ? (
          <LoginForm
            onSubmit={handleLogin}
          />
        ) : (
          <SignupForm
            onSubmit={handleSignup}
          />
        )}

        <SecurityBadge />
      </div>
    </div>
  )
}