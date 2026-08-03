import {
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { OrgTier } from '../api/types'
import {
  AuthContext,
  type AuthContextValue,
} from './AuthContext'

/**
 * 로그인 성공 정보를 메모리에 저장하는 인증 Provider.
 *
 * localStorage는 사용하지 않으므로 새로고침하면
 * 인증 상태와 토큰이 사라지고 다시 로그인해야 한다.
 */
export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [orgTier, setOrgTier] =
    useState<OrgTier | null>(null)

  const [email, setEmail] =
    useState<string | null>(null)

  const [accessToken, setAccessToken] =
    useState<string | null>(null)

  const value = useMemo<AuthContextValue>(
    () => ({
      orgTier,
      email,
      accessToken,

      signIn: (
        tier: OrgTier,
        userEmail: string,
        token: string,
      ) => {
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
    [
      orgTier,
      email,
      accessToken,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}