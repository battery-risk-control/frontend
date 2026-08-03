import { createContext } from 'react'
import type { OrgTier } from '../api/types'

export interface AuthContextValue {
  orgTier: OrgTier | null
  email: string | null
  accessToken: string | null
  signIn: (
    orgTier: OrgTier,
    email: string,
    accessToken: string,
  ) => void
  signOut: () => void
}

/**
 * Context 객체만 정의한다.
 *
 * Provider와 파일을 분리해 react-refresh 규칙을
 * 비활성화하지 않고 사용할 수 있도록 한다.
 */
export const AuthContext =
  createContext<AuthContextValue | null>(null)