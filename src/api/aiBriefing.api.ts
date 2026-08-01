import { fetchWithAuth } from './http'
import type {
  AiBriefingContext,
  AiBriefingDetail,
  AiBriefingListItem,
  AiBriefingSource,
} from './types'

/**
 * 1계층 구매팀 "AI 브리핑" 화면 API 클라이언트.
 *
 * `materialRisk.api.ts`·`contractRag.api.ts`와 같은 방침으로 **mock 폴백이 없다.** 이 화면이
 * 보여주는 것은 실제 ERP 재고와 계약 조항을 근거로 한 위험 판단이라, 지어낸 브리핑을 띄우면
 * "이 등급으로 판단되었다"는 잘못된 확신을 준다 — 백엔드가 없으면 안내 문구가 정확하다.
 *
 * 모든 호출이 인증을 요구하므로 `accessToken`을 인자로 받는다(`useAuthState()`에 있다).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/** `VITE_API_BASE_URL`이 없으면 실 API를 부를 수 없다 — 화면이 안내 문구를 띄우도록 알린다. */
export function isAiBriefingApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

function unwrap<T>(result: T | { error: string; message: string }): T {
  if (result && typeof result === 'object' && 'error' in result) {
    throw new Error((result as { message: string }).message)
  }
  return result as T
}

/**
 * 화면 상단 "분석 대상 · ERP 연결" 프리필.
 *
 * **멀티에이전트를 돌리지 않는다** — 화면에 들어오기만 해도 LLM 비용이 나가면 안 되기 때문이다.
 * 실행 가능 여부(`generate_available`)는 앞 화면들이 버튼을 막을 때 쓰던 판정과 같은 것이라,
 * 여기서 false면 리스크 모니터링·원자재 위험 화면에서도 같은 이유로 막혀 있다.
 *
 * 사용 예:
 *   const context = await fetchAiBriefingContext(accessToken, 'NEWS', '252')
 */
export async function fetchAiBriefingContext(
  accessToken: string,
  source: AiBriefingSource,
  ref: string,
): Promise<AiBriefingContext> {
  return unwrap(await fetchWithAuth<AiBriefingContext>(
    `/api/v1/ai-briefing/context?source=${source}&ref=${encodeURIComponent(ref)}`,
    accessToken,
  ))
}

/**
 * "LLM 브리핑 생성". 멀티에이전트를 실제로 돌리고 결과를 저장한다.
 *
 * `useLlm`이 **기본 true**인 점이 다른 화면들과 반대다 — 버튼 이름이 "LLM 브리핑 생성"이라
 * 누르는 순간 문구 생성까지 도는 것이 이 화면의 약속이다. 비용이 나가는 호출이므로 화면은
 * 진행 중 표시를 반드시 띄우고 버튼을 잠근다.
 *
 * 사용 예:
 *   const briefing = await generateAiBriefing(accessToken, 'MATERIAL', 'MAT-CO-SULF')
 */
export async function generateAiBriefing(
  accessToken: string,
  source: AiBriefingSource,
  ref: string,
  useLlm = true,
): Promise<AiBriefingDetail> {
  return unwrap(await fetchWithAuth<AiBriefingDetail>(
    '/api/v1/ai-briefing/briefings',
    accessToken,
    { method: 'POST', body: JSON.stringify({ source, ref, use_llm: useLlm }) },
  ))
}

/**
 * 우측 하단 "최근 브리핑". 누가 만들었든 팀 전체가 같은 목록을 본다.
 *
 * 사용 예:
 *   const recent = await fetchRecentAiBriefings(accessToken, 5)
 */
export async function fetchRecentAiBriefings(
  accessToken: string,
  limit = 5,
): Promise<AiBriefingListItem[]> {
  return unwrap(await fetchWithAuth<AiBriefingListItem[]>(
    `/api/v1/ai-briefing/briefings?limit=${limit}`,
    accessToken,
  ))
}

/**
 * "브리핑 상세 보기". 저장된 브리핑을 생성 직후와 같은 모양으로 되돌린다 —
 * 화면은 방금 만든 것과 다시 열어본 것을 구분하지 않고 같은 컴포넌트로 그린다.
 *
 * 사용 예:
 *   const briefing = await fetchAiBriefing(accessToken, briefingId)
 */
export async function fetchAiBriefing(
  accessToken: string,
  briefingId: string,
): Promise<AiBriefingDetail> {
  return unwrap(await fetchWithAuth<AiBriefingDetail>(
    `/api/v1/ai-briefing/briefings/${encodeURIComponent(briefingId)}`,
    accessToken,
  ))
}
