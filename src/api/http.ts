/**
 * 백엔드(Spring Boot) 공용 fetch 헬퍼. 모든 응답이 `{success, data, timestamp}`(성공) /
 * `{success:false, error:{code, message, details}, timestamp}`(실패) 봉투로 감싸여 오므로,
 * 이 봉투를 벗겨 프론트엔드 타입이 기대하는 모양으로 맞춰준다
 * (`backend/docs/auth-integration-handoff.md` §2-1 실제 응답 전문 기준).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

interface ApiSuccessEnvelope<T> {
  success: true
  data: T
  timestamp: string
}

interface ApiErrorEnvelope {
  success: false
  error: { code: string; message: string; details?: unknown }
  timestamp: string
}

/** 실패 시 반환 모양 — 기존 프론트엔드 에러 타입(예: `LoginPendingErrorResponse`)과 필드명을 맞췄다. */
export interface FetchJsonError {
  error: string
  message: string
}

/**
 * `VITE_API_BASE_URL`을 prefix로 붙여 호출하고, 성공 시 `data`만, 실패 시
 * `{error: body.error.code, message: body.error.message}`를 반환한다.
 *
 * 사용 예:
 *   const result = await fetchJson<LoginSuccessResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) })
 *   if ('error' in result) { ... }
 */
export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T | FetchJsonError> {
  const res = await fetch(`${API_BASE_URL ?? ''}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body: ApiSuccessEnvelope<T> | ApiErrorEnvelope = await res.json()
  if (!res.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope
    return { error: errorBody.error.code, message: errorBody.error.message }
  }
  return body.data
}

/**
 * `fetchJson`에 `Authorization: Bearer {token}` 헤더를 자동으로 붙인다. 인증이 필요한
 * 후속 API(브리핑·ERP 등) 연동 대비 — 현재 auth 쪽(`login`/`signup`)에서는 쓰지 않는다.
 *
 * 사용 예:
 *   const result = await fetchWithAuth<UserSummary>('/api/v1/auth/me', accessToken)
 */
export async function fetchWithAuth<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T | FetchJsonError> {
  return fetchJson<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  })
}
