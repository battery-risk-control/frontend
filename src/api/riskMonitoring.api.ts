import { fetchWithAuth } from './http'
import type { RiskMonitoringDetail, RiskMonitoringEvent } from './types'

/**
 * 1계층 구매팀 "리스크 모니터링" 화면 API 클라이언트.
 *
 * 다른 api 모듈과 달리 **mock 폴백이 없다.** 이 화면이 보여주는 것은 GDELT 스케줄러가 실제로
 * 수집·번역한 기사와 그 기사에 붙은 분석 결과라서, 지어낸 목록을 띄우면 "수집이 되고 있다"는
 * 잘못된 인상을 준다 — 백엔드가 없으면 화면이 빈 목록과 안내 문구를 보여주는 편이 정확하다.
 * (`public.api.ts`의 mock 분기는 비로그인 방문자에게 빈 화면을 보이지 않으려는 것이라 사정이 다르다.)
 *
 * 모든 호출이 인증을 요구하므로 `accessToken`을 인자로 받는다 — 토큰은 `useAuthState()`에 있다.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export interface RiskMonitoringFilters {
  /** 심각/주의/정상. 생략하면 전체 */
  grade?: string
  /** ISO 3166-1 alpha-2. 생략하면 전체 */
  country?: string
  /** 자재 표기명(리튬) 또는 대분류(LITHIUM). 생략하면 전체 */
  material?: string
  /** 최근 N일(1~180) */
  days?: number
  limit?: number
}

/** `VITE_API_BASE_URL`이 없으면 실 API를 부를 수 없다 — 화면이 안내 문구를 띄우도록 알린다. */
export function isRiskMonitoringApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

function toQuery(filters: RiskMonitoringFilters): string {
  const params = new URLSearchParams()
  if (filters.grade) params.set('grade', filters.grade)
  if (filters.country) params.set('country', filters.country)
  if (filters.material) params.set('material', filters.material)
  if (filters.days !== undefined) params.set('days', String(filters.days))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  const query = params.toString()
  return query ? `?${query}` : ''
}

/**
 * 이벤트 목록 조회. 백엔드가 같은 기사를 제목 기준으로 한 번만 내려주고, 자재가 특정되지
 * 않은 기사(공급망 무관)는 제외한다.
 *
 * 사용 예:
 *   const events = await fetchRiskMonitoringEvents(accessToken, { days: 7 })
 */
export async function fetchRiskMonitoringEvents(
  accessToken: string,
  filters: RiskMonitoringFilters = {},
): Promise<RiskMonitoringEvent[]> {
  const result = await fetchWithAuth<RiskMonitoringEvent[]>(
    `/api/v1/risk-monitoring/events${toQuery(filters)}`,
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 이벤트 상세 조회. 뉴스 요약·영향 원자재·외부신호·좌표·원문 링크와, 멀티에이전트가 끝난
 * 기사면 종합 평가까지 함께 온다.
 *
 * 사용 예:
 *   const detail = await fetchRiskMonitoringEvent(accessToken, 252)
 */
export async function fetchRiskMonitoringEvent(
  accessToken: string,
  eventId: number,
): Promise<RiskMonitoringDetail> {
  const result = await fetchWithAuth<RiskMonitoringDetail>(
    `/api/v1/risk-monitoring/events/${eventId}`,
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

