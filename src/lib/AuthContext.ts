import { createContext } from 'react'
import type { OrgTier } from '../api/types'

export interface AuthContextValue {
  orgTier: OrgTier | null
  email: string | null
  /**
   * 백엔드 JWT. 인증이 필요한 API(`/public/*` 4개 화면의 실 백엔드 연동 등)가
   * `Authorization: Bearer`로 쓴다. ①단계(mock)에서는 `'mock.jwt.token'` 문자열이 들어오지만
   * 호출 자체가 mock으로 폴백하므로 문제되지 않는다.
   */
  accessToken: string | null
  signIn: (orgTier: OrgTier, email: string, accessToken: string) => void
  signOut: () => void
}

/** Context 객체만 정의 — Provider(AuthProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AuthContext = createContext<AuthContextValue | null>(null)
