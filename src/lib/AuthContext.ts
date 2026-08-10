import { createContext } from 'react'
import type { OrgTier } from '../api/types'

export interface AuthContextValue {
  orgTier: OrgTier | null
  email: string | null
  /**
   * 백엔드 JWT. 인증이 필요한 API(리스크 모니터링 등)가 `Authorization: Bearer`로 쓴다.
   * ①단계(mock)에서는 `'mock.jwt.token'` 문자열이 들어오지만 호출 자체가 없어 문제되지 않는다.
   */
  accessToken: string | null
  /**
   * 앱 로드 직후 쿠키로 세션 복원(부트스트랩)을 시도하는 동안 true. 이 동안 라우트 가드는 /auth로
   * 튕기지 않고 대기해야, 로그인 상태인데 잠깐 로그인 화면이 번쩍이는 것을 막는다.
   */
  initializing: boolean
  /**
   * 로그인 성공 시 호출. accessToken은 렌더링/헤더용으로 컨텍스트에, 만료는 {@link ../lib/authSession}에
   * 적재해 access token 만료 시 자동 갱신에 쓴다. refresh 토큰은 HttpOnly 쿠키라 여기서 다루지 않는다.
   */
  signIn: (
    orgTier: OrgTier,
    email: string,
    tokens: { accessToken: string; expiresInSeconds?: number },
  ) => void
  signOut: () => void
}

/** Context 객체만 정의 — Provider(AuthProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AuthContext = createContext<AuthContextValue | null>(null)
