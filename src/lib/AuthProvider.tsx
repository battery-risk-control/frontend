import { useMemo, useState, type ReactNode } from 'react'
import type { OrgTier } from '../api/types'
import { AuthContext, type AuthContextValue } from './AuthContext'

/**
 * 로그인 성공 시 org_tier·email·access_token을 메모리에만 저장하는 간단한 전역 상태
 * (React Context). 의도적으로 localStorage를 쓰지 않는다 — 새로고침 시 상태가 사라지고
 * 라우트 가드가 다시 /auth로 돌려보내는 것이 이번 범위의 의도된 동작이다.
 * `accessToken`은 2026-08-03 추가 — 그 전까진 로그인 응답의 JWT를 아예 버리고 있어
 * 인증이 필요한 실 API(fetchWithAuth)를 하나도 호출할 수 없었다.
 *
 * 사용 예:
 *   <AuthProvider><AppRoutes /></AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [orgTier, setOrgTier] = useState<OrgTier | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      orgTier,
      email,
      accessToken,
      signIn: (tier: OrgTier, userEmail: string, token: string) => {
        setOrgTier(tier)
        setEmail(userEmail)
        setAccessToken(token)
      },
      signOut: () => {
        setOrgTier(null)
        setEmail(null)
        setAccessToken(null)
      },
    }),
    [orgTier, email, accessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
