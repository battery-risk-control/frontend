import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, logoutApi, requestTokenRefresh } from '../api/auth.api'
import type { OrgTier } from '../api/types'
import { AuthContext, type AuthContextValue } from './AuthContext'
import { clearSession, registerAuthBridge, startSession } from './authSession'

/** 실백엔드 모드 여부. mock(①단계)에서는 쿠키·refresh가 없어 부트스트랩/로그아웃 API를 건너뛴다. */
const API_CONFIGURED = Boolean(import.meta.env.VITE_API_BASE_URL)

/**
 * 로그인 상태(org_tier·email·access_token)를 메모리에 두는 전역 상태(React Context).
 *
 * refresh 토큰은 **HttpOnly 쿠키**에 있어 새로고침(F5) 후에도 남는다. 그래서 앱 로드 시 쿠키로
 * 세션을 복원한다(부트스트랩: refresh → /auth/me). 세션 도중 access token이 만료되면 {@link ./authSession}가
 * 자동 갱신한다. 순환 import를 피하려 실제 refresh 호출·상태 반영은 여기서 브리지로 주입한다.
 *
 * 사용 예:
 *   <AuthProvider><AppRoutes /></AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [orgTier, setOrgTier] = useState<OrgTier | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  // 부트스트랩 동안 라우트 가드가 /auth로 튕기지 않게 대기. mock 모드는 복원할 게 없어 바로 false.
  const [initializing, setInitializing] = useState<boolean>(API_CONFIGURED)

  const resetState = useCallback(() => {
    setOrgTier(null)
    setEmail(null)
    setAccessToken(null)
  }, [])

  // authSession(모듈) ↔ React 상태 브리지. refresh 성공 시 새 토큰 반영, 실패/로그아웃 시 상태 초기화.
  // refresh 토큰은 쿠키가 실어 보내므로 requestRefresh는 인자가 없다.
  useEffect(() => {
    registerAuthBridge({
      onAccessTokenRefreshed: (token) => setAccessToken(token),
      onSessionCleared: () => resetState(),
      requestRefresh: () => requestTokenRefresh(),
    })
  }, [resetState])

  // 부트스트랩(F5 대응): 앱 로드 시 HttpOnly 쿠키로 세션 복원. refresh(쿠키) → 새 access token →
  // /auth/me로 org_tier·email 복원. 쿠키가 없으면(미로그인/만료) 조용히 로그아웃 상태로 둔다.
  useEffect(() => {
    // mock 모드는 initializing 초기값이 이미 false라(복원할 세션 없음) 아무것도 하지 않는다.
    if (!API_CONFIGURED) {
      return
    }
    let cancelled = false
    void (async () => {
      const refreshed = await requestTokenRefresh()
      if (cancelled) return
      if (!('error' in refreshed)) {
        // 신버전 백엔드는 refresh 응답에 org_tier·username을 함께 내린다 — 이 경우 /auth/me
        // 왕복 없이 부트스트랩이 끝나 F5 복원이 요청 한 번으로 완료된다. 필드가 없으면
        // (구버전 백엔드와 섞이는 배포 순서) 기존처럼 /auth/me로 폴백해 동작을 보존한다.
        if (refreshed.org_tier && refreshed.username) {
          startSession({ accessToken: refreshed.access_token, expiresInSeconds: refreshed.expires_in })
          setOrgTier(refreshed.org_tier)
          // 헤더 표시는 로그인 계정 아이디(username)를 쓴다 — 개인 email(gmail) 노출을 피한다.
          setEmail(refreshed.username)
          setAccessToken(refreshed.access_token)
        } else {
          const me = await fetchMe(refreshed.access_token)
          if (cancelled) return
          if (!('error' in me)) {
            startSession({ accessToken: refreshed.access_token, expiresInSeconds: refreshed.expires_in })
            setOrgTier(me.org_tier)
            // 헤더 표시는 로그인 계정 아이디(username)를 쓴다 — 개인 email(gmail) 노출을 피한다.
            // (로그인 직후 경로도 AuthPage에서 입력한 아이디를 넣으므로 F5 전후 표시가 일치한다.)
            setEmail(me.username)
            setAccessToken(refreshed.access_token)
          }
        }
      }
      setInitializing(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      orgTier,
      email,
      accessToken,
      initializing,
      signIn: (tier, userEmail, tokens) => {
        setOrgTier(tier)
        setEmail(userEmail)
        setAccessToken(tokens.accessToken)
        startSession({ accessToken: tokens.accessToken, expiresInSeconds: tokens.expiresInSeconds })
      },
      signOut: () => {
        const token = accessToken
        resetState()
        clearSession()
        // 서버 세션·refresh 쿠키까지 무효화(best-effort) — 안 하면 F5 때 쿠키로 세션이 되살아난다.
        if (API_CONFIGURED && token) {
          void logoutApi(token).catch(() => {})
        }
      },
    }),
    [orgTier, email, accessToken, initializing, resetState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
