/**
 * 백엔드(Spring Boot) 공용 fetch 헬퍼. 모든 응답이 `{success, data, timestamp}`(성공) /
 * `{success:false, error:{code, message, details}, timestamp}`(실패) 봉투로 감싸여 오므로,
 * 이 봉투를 벗겨 프론트엔드 타입이 기대하는 모양으로 맞춰준다
 * (`backend/docs/auth-integration-handoff.md` §2-1 실제 응답 전문 기준).
 */

import { getAccessToken, hasSession, isAccessTokenExpiringSoon, refreshAccessToken } from '../lib/authSession'

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
/** 봉투를 벗기되 HTTP 상태 코드도 함께 돌려준다 — fetchWithAuth가 401을 판별해 refresh를 걸 수 있게. */
async function requestEnvelope<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; result: T | FetchJsonError }> {
  const res = await fetch(`${API_BASE_URL ?? ''}${path}`, {
    ...options,
    // refresh 토큰 HttpOnly 쿠키가 /auth/* 요청에 실려 가도록 자격증명을 포함한다. 다른 경로엔
    // 쿠키 Path(/api/v1/auth) 때문에 전송되지 않으므로 전역으로 켜도 무해하다.
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body: ApiSuccessEnvelope<T> | ApiErrorEnvelope = await res.json()
  if (!res.ok || !body.success) {
    const errorBody = body as ApiErrorEnvelope
    return { status: res.status, result: { error: errorBody.error.code, message: errorBody.error.message } }
  }
  return { status: res.status, result: body.data }
}

export async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T | FetchJsonError> {
  return (await requestEnvelope<T>(path, options)).result
}

/**
 * `Authorization: Bearer {token}` 헤더를 붙여 호출하고, **access token 만료를 자동으로 처리**한다.
 *
 * <p>동작: ① 만료가 임박했으면 요청 전에 선제 갱신(확실한 401 왕복 절약). ② 그래도 401이 오면
 * refresh 토큰으로 새 access token을 발급받아 **원 요청을 1회 재시도**한다. ③ 동시에 여러 요청이
 * 401을 받아도 refresh는 한 번만 나가고(진행 중 Promise 공유, {@link ../lib/authSession}), refresh가
 * 실패하면 세션을 비워 라우트 가드가 /auth로 보낸다.
 *
 * <p>토큰은 authSession의 현재 값을 우선 쓴다({@code getAccessToken() ?? token}) — 한 번 갱신되면
 * 호출부가 넘긴 낡은 토큰 대신 새 토큰으로 나가 불필요한 재-refresh를 줄인다. 미로그인(refresh 토큰
 * 없음)일 때는 refresh를 시도하지 않고 기존처럼 오류를 그대로 돌려준다.
 *
 * 사용 예:
 *   const result = await fetchWithAuth<UserSummary>('/api/v1/auth/me', accessToken)
 */
export async function fetchWithAuth<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T | FetchJsonError> {
  const authHeaders = (bearer: string): HeadersInit => ({
    Authorization: `Bearer ${bearer}`,
    ...options.headers,
  })

  // (선택) 만료 임박이면 요청 전에 선제 갱신.
  if (isAccessTokenExpiringSoon()) {
    await refreshAccessToken()
  }

  const activeToken = getAccessToken() ?? token
  const first = await requestEnvelope<T>(path, { ...options, headers: authHeaders(activeToken) })
  if (first.status !== 401 || !hasSession()) {
    return first.result
  }

  // 401 + 로그인 세션 → refresh(단일 진행) 후 원 요청 1회 재시도. refresh 실패면 이미 로그아웃 처리됨.
  const refreshedToken = await refreshAccessToken()
  if (!refreshedToken) {
    return first.result
  }
  const retry = await requestEnvelope<T>(path, { ...options, headers: authHeaders(refreshedToken) })
  return retry.result
}

/**
 * 파일 업로드(multipart/form-data) 전용. `fetchJson`을 쓰지 못하는 이유는 그쪽이 항상
 * `Content-Type: application/json`을 붙이기 때문이다 — multipart는 브라우저가 직접
 * `boundary`까지 포함해 헤더를 만들어야 해서, 우리가 Content-Type을 지정하는 순간 서버가
 * 본문 경계를 찾지 못하고 요청이 깨진다. 그래서 Authorization만 붙이고 나머지는 맡긴다.
 *
 * 사용 예:
 *   const result = await uploadWithAuth<UploadResult>('/api/v1/...', accessToken, formData)
 */
export async function uploadWithAuth<T>(
  path: string,
  token: string,
  body: FormData,
): Promise<T | FetchJsonError> {
  const res = await fetch(`${API_BASE_URL ?? ''}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
  const payload: ApiSuccessEnvelope<T> | ApiErrorEnvelope = await res.json()
  if (!res.ok || !payload.success) {
    const errorBody = payload as ApiErrorEnvelope
    return { error: errorBody.error.code, message: errorBody.error.message }
  }
  return payload.data
}

/** 서버가 내려준 파일 한 개. 파일명은 `Content-Disposition`에서 뽑는다. */
export interface DownloadedFile {
  blob: Blob
  fileName: string
}

/**
 * 파일(PDF·CSV)을 받아오는 multipart 업로드. `uploadWithAuth`와 갈라놓은 이유는 응답이
 * JSON 봉투가 아니라 바이너리라서다 — 그쪽 코드는 무조건 `res.json()`을 부르기 때문에
 * PDF를 받으면 파싱 단계에서 터진다.
 *
 * **성공과 실패의 형식이 다르다.** 성공하면 PDF/CSV가 오고, 실패하면 평소의 JSON 오류 봉투가
 * 온다. 그래서 응답 Content-Type을 보고 갈라야 한다. 이걸 안 하면 서버가 "권한 없음"을
 * 돌려줬을 때 그 JSON을 그대로 `report.pdf`로 저장해, 사용자는 열리지 않는 파일만 손에 쥔다.
 *
 * 사용 예:
 *   const file = await downloadWithAuth('/api/v1/erp/imports/report', token, form)
 *   if ('error' in file) { ... } else { saveAs(file.blob, file.fileName) }
 */
export async function downloadWithAuth(
  path: string,
  token: string,
  body: FormData,
  fallbackFileName: string,
): Promise<DownloadedFile | FetchJsonError> {
  return toDownloadedFile(
    await fetch(`${API_BASE_URL ?? ''}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    }),
    fallbackFileName,
  )
}

/**
 * 파일을 **GET으로** 받아온다. 올릴 것 없이 id 하나로 받는 문서용이다(브리핑 PDF 등).
 *
 * `downloadWithAuth`와 응답 처리는 완전히 같고 요청 모양만 다르다 — 판정을 한 곳
 * (`toDownloadedFile`)에 두는 게 핵심이다. 두 벌로 두면 한쪽만 Content-Type 검사를 빠뜨려도
 * 티가 나지 않는데, 그때 사용자는 열리지 않는 PDF를 손에 쥔다.
 *
 * 사용 예:
 *   const file = await downloadGetWithAuth(path, token, 'ai-briefing.pdf')
 *   if ('error' in file) { ... } else { saveBlob(file.blob, file.fileName) }
 */
export async function downloadGetWithAuth(
  path: string,
  token: string,
  fallbackFileName: string,
): Promise<DownloadedFile | FetchJsonError> {
  return toDownloadedFile(
    await fetch(`${API_BASE_URL ?? ''}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fallbackFileName,
  )
}

/**
 * 파일 응답을 해석한다. 성공하면 바이너리가, 실패하면 평소의 JSON 오류 봉투가 오므로
 * Content-Type을 보고 갈라야 한다.
 */
async function toDownloadedFile(
  res: Response,
  fallbackFileName: string,
): Promise<DownloadedFile | FetchJsonError> {
  const contentType = res.headers.get('Content-Type') ?? ''
  const normalizedContentType = contentType.split(';', 1)[0].trim().toLowerCase()
  if (normalizedContentType === 'text/html' || normalizedContentType === 'application/xhtml+xml') {
    // CloudFront의 SPA fallback은 백엔드 404를 index.html + 200으로 바꿀 수 있다. 이를 성공으로
    // 취급하면 계약서 대신 웹앱을 .htm으로 저장하므로 파일 본문을 읽기 전에 차단한다.
    return {
      error: 'DOWNLOAD_FAILED',
      message: '계약서 원본을 찾지 못했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }
  if (!res.ok || normalizedContentType === 'application/json') {
    try {
      const payload = (await res.json()) as ApiErrorEnvelope
      return { error: payload.error.code, message: payload.error.message }
    } catch {
      // 서버가 죽었거나 프록시가 HTML 오류 페이지를 돌려준 경우 — 본문이 JSON이 아니다.
      return { error: 'DOWNLOAD_FAILED', message: `파일을 받지 못했습니다 (HTTP ${res.status}).` }
    }
  }

  return {
    blob: await res.blob(),
    fileName: fileNameFromDisposition(res.headers.get('Content-Disposition')) ?? fallbackFileName,
  }
}

/**
 * `Content-Disposition`에서 파일명을 꺼낸다. RFC 5987의 `filename*`(UTF-8)이 있으면 그쪽을
 * 먼저 본다 — 한글 파일명을 쓰게 되면 `filename=`은 깨진 값이 들어 있기 때문이다.
 */
function fileNameFromDisposition(header: string | null): string | null {
  if (!header) return null
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1])
    } catch {
      // 서버가 잘못 인코딩한 경우 아래 quoted 형식으로 넘어간다.
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header)
  return quoted ? quoted[1] : null
}
