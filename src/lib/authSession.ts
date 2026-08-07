/**
 * 인증 세션(토큰) 모듈 싱글턴 + access token 갱신 코디네이터.
 *
 * refresh 토큰은 **HttpOnly 쿠키**에 있어 JS가 값을 볼 수 없다. 그래서 이 모듈은 refresh 토큰을
 * 저장하지 않고, 로그인/부트스트랩 성공 여부(`authenticated`)와 현재 access token만 든다. refresh가
 * 필요하면 브리지의 requestRefresh()가 body 없이 POST /auth/refresh를 호출하고(쿠키가 자동 전송됨)
 * 새 access token을 받아온다.
 *
 * http.ts는 모듈 함수라 React 훅을 쓸 수 없어, 토큰 소스와 "동시 401에도 refresh는 한 번만"을 여기서
 * 관리한다. 순환 import를 피하려 실제 refresh 호출·상태 반영은 AuthProvider가 registerAuthBridge로
 * 주입한다(이 모듈은 auth.api/http를 런타임 import하지 않는다).
 */
import type { RefreshResult } from '../api/auth.api'
import type { FetchJsonError } from '../api/http'

interface AuthBridge {
  /** refresh 성공 시 새 access token을 React 상태에 반영한다. */
  onAccessTokenRefreshed: (accessToken: string) => void
  /** 세션이 비워질 때(로그아웃/refresh 실패) React 상태를 초기화한다. 라우트 가드가 /auth로 보낸다. */
  onSessionCleared: () => void
  /** POST /auth/refresh. refresh 토큰은 HttpOnly 쿠키가 실어 보내므로 인자가 없다. */
  requestRefresh: () => Promise<RefreshResult | FetchJsonError>
}

const session = {
  accessToken: null as string | null,
  accessTokenExpiresAt: null as number | null, // epoch ms
  authenticated: false,
}

let bridge: AuthBridge | null = null
let inFlightRefresh: Promise<string | null> | null = null

export function registerAuthBridge(next: AuthBridge): void {
  bridge = next
}

/** 로그인/부트스트랩 성공 시 호출. access token과 만료(epoch ms)를 적재하고 세션을 활성으로 표시한다. */
export function startSession(tokens: { accessToken: string; expiresInSeconds?: number | null }): void {
  session.accessToken = tokens.accessToken
  session.accessTokenExpiresAt =
    tokens.expiresInSeconds != null ? Date.now() + tokens.expiresInSeconds * 1000 : null
  session.authenticated = true
}

export function clearSession(): void {
  session.accessToken = null
  session.accessTokenExpiresAt = null
  session.authenticated = false
  inFlightRefresh = null
}

export function getAccessToken(): string | null {
  return session.accessToken
}

/** 로그인 세션이 있는지(= 로그인/부트스트랩에 성공했는지). 401에 refresh를 걸지 판단하는 데 쓴다. */
export function hasSession(): boolean {
  return session.authenticated
}

/** access token 만료 임박(기본 30초 이내) 여부. 로그인 세션이 있어야 의미가 있다. */
export function isAccessTokenExpiringSoon(thresholdMs = 30_000): boolean {
  return (
    session.authenticated &&
    session.accessTokenExpiresAt != null &&
    session.accessTokenExpiresAt - Date.now() <= thresholdMs
  )
}

/**
 * 새 access token을 발급받는다(refresh 토큰은 HttpOnly 쿠키가 실어 보낸다). 동시에 여러 요청이 불러도
 * refresh는 한 번만 나가고(진행 중 Promise 공유), 성공하면 세션과 React 상태를 갱신해 새 토큰을 반환한다.
 * 쿠키가 없거나(만료·미로그인) 실패하면 세션을 비우고 로그아웃 브리지를 호출한 뒤 null을 반환한다.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inFlightRefresh) return inFlightRefresh

  const activeBridge = bridge
  if (!activeBridge) {
    forceLogout()
    return Promise.resolve(null)
  }

  inFlightRefresh = (async () => {
    try {
      const result = await activeBridge.requestRefresh()
      if ('error' in result) {
        forceLogout()
        return null
      }
      session.accessToken = result.access_token
      session.accessTokenExpiresAt =
        result.expires_in != null ? Date.now() + result.expires_in * 1000 : null
      session.authenticated = true
      activeBridge.onAccessTokenRefreshed(result.access_token)
      return result.access_token
    } catch {
      forceLogout()
      return null
    } finally {
      inFlightRefresh = null
    }
  })()
  return inFlightRefresh
}

function forceLogout(): void {
  const cleared = bridge?.onSessionCleared
  clearSession()
  cleared?.()
}
