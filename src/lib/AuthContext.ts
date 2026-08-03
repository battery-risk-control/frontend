import { createContext } from 'react'
import type { OrgTier } from '../api/types'

export interface AuthContextValue {
  orgTier: OrgTier | null
  email: string | null
  /** 로그인 응답의 access_token. 인증이 필요한 실 API 호출(fetchWithAuth)에 쓴다. */
  accessToken: string | null
  signIn: (orgTier: OrgTier, email: string, accessToken: string) => void
  signOut: () => void
}

/** Context 객체만 정의 — Provider(AuthProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AuthContext = createContext<AuthContextValue | null>(null)
