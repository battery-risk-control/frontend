import { useMemo, useState, type ReactNode } from 'react'
import type { OrgTier } from '../api/types'
import { AuthContext, type AuthContextValue } from './AuthContext'

/**
 * 로그인 성공 시 org_tier와 email을 메모리에만 저장하는 간단한 전역 상태(React Context).
 * 의도적으로 localStorage를 쓰지 않는다 — 새로고침 시 상태가 사라지고 라우트 가드가
 * 다시 /auth로 돌려보내는 것이 이번 범위의 의도된 동작이다.
 *
 * 사용 예:
 *   <AuthProvider><AppRoutes /></AuthProvider>
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [orgTier, setOrgTier] = useState<OrgTier | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      orgTier,
      email,
      signIn: (tier: OrgTier, userEmail: string) => {
        setOrgTier(tier)
        setEmail(userEmail)
      },
      signOut: () => {
        setOrgTier(null)
        setEmail(null)
      },
    }),
    [orgTier, email],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
