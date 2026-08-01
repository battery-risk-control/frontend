import { createContext } from 'react'
import type { OrgTier } from '../api/types'

export interface AuthContextValue {
  orgTier: OrgTier | null
  email: string | null
  accessToken: string | null
  signIn: (orgTier: OrgTier, email: string, accessToken: string) => void
  signOut: () => void
}

/** Context 객체만 정의 — Provider(AuthProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AuthContext = createContext<AuthContextValue | null>(null)
