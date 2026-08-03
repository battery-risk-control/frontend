import { fetchWithAuth } from './http'
import type { RiskMonitoringDetail, RiskMonitoringEvent } from './types'

/**
 * 비로그인 `/public/risk-monitoring` 화면 API 클라이언트. 구매팀 1계층 `riskMonitoring.api.ts`
 * (minji 브랜치, `accessToken` 필수·mock 폴백 없음)를 이식하되, "완전 공개 + mock 폴백
 * 신규 작성"(사용자 결정, 2026-08-03) 원칙에 따라 방향을 바꿨다:
 *
 * - `!API_BASE_URL`(①단계): 로그인 여부와 무관하게 항상 mock을 반환한다.
 * - `API_BASE_URL` 있고 `accessToken` 없음(②/③단계, 비로그인 방문자): 이 화면들은 minji
 *   쪽에도 공개(비인증) 백엔드 엔드포인트가 없어 실제로 호출해도 401만 받는다 — 호출 자체를
 *   생략하고 `LOGIN_REQUIRED_MESSAGE`를 던진다.
 * - `API_BASE_URL` 있고 `accessToken` 있음: minji 원본과 동일하게 `fetchWithAuth` 호출.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.'

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

/**
 * mock 이벤트 6건 — Figma "04 구매팀 · 리스크 이벤트"(2026-08-02) 목록을 그대로 옮겼다.
 * mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요.
 */
const MOCK_EVENTS: RiskMonitoringEvent[] = [
  {
    event_id: 1,
    grade: '심각',
    confidence_label: '확정',
    multi_agent_completed: true,
    headline: '코발트 공급사의 납기 지연 가능성 확대',
    headline_original: 'Cobalt supplier delivery delay risk widens',
    translated: true,
    material: '코발트',
    country_code: 'CD',
    country_name: '콩고민주공화국',
    collected_at: '2026-07-31T14:02:00Z',
    source: 'GDELT',
  },
  {
    event_id: 2,
    grade: '주의',
    confidence_label: '참고',
    multi_agent_completed: false,
    headline: '니켈 항만 파업 장기화',
    headline_original: 'Nickel port strike prolonged',
    translated: true,
    material: '니켈',
    country_code: 'ID',
    country_name: '인도네시아',
    collected_at: '2026-07-31T13:18:00Z',
    source: 'GDELT',
  },
  {
    event_id: 3,
    grade: '주의',
    confidence_label: '참고',
    multi_agent_completed: false,
    headline: '리튬 현물가격 변동 확대',
    headline_original: 'Lithium spot price volatility widens',
    translated: true,
    material: '리튬',
    country_code: 'CL',
    country_name: '칠레',
    collected_at: '2026-07-31T11:42:00Z',
    source: 'GDELT',
  },
  {
    event_id: 4,
    grade: '정상',
    confidence_label: '참고',
    multi_agent_completed: false,
    headline: '흑연 생산량 회복',
    headline_original: 'Graphite output recovers',
    translated: true,
    material: '흑연',
    country_code: 'CN',
    country_name: '중국',
    collected_at: '2026-07-31T09:10:00Z',
    source: 'GDELT',
  },
  {
    event_id: 5,
    grade: '정상',
    confidence_label: '참고',
    multi_agent_completed: false,
    headline: '망간 항만 운영 정상화',
    headline_original: 'Manganese port operations normalize',
    translated: true,
    material: '망간',
    country_code: 'AU',
    country_name: '호주',
    collected_at: '2026-07-30T09:00:00Z',
    source: 'GDELT',
  },
]

/** 이벤트 1건의 상세 — mock 임시값. event_id 1(코발트)만 멀티에이전트까지 통과한 것으로 채운다. */
const MOCK_DETAILS: Record<number, RiskMonitoringDetail> = {
  1: {
    ...MOCK_EVENTS[0],
    summary: '주요 공급사의 선적 일정이 지연되며 배터리 원자재 공급 차질 우려가 확대됩니다.',
    impact_domain: 'Logistics',
    coordinates: { lat: -4.0383, lng: 21.7587 },
    url: null,
    external_signal: {
      goldstein_scale: -6.5,
      tone_score: -4.2,
      news_count: 18,
      risk_score: 60,
      severity: 'WARNING',
      reason_codes: ['DELIVERY_DELAY'],
    },
    procurement_risk: {
      assessment_id: 'ASSESS-0001',
      completed: true,
      risk_level: 'CRITICAL',
      risk_score: 70,
      external_signal_score: 60,
      erp_exposure_score: 75,
      contract_gap_score: 20,
      risk_reasons: ['안전재고 대비 공급 공백 발생 예상'],
      review_passed: true,
      assessed_at: '2026-07-31T14:20:00Z',
      representative_material_id: 'MAT-CO-SULF',
      valid_material_count: 1,
      target_material_count: 1,
      material_assessments: [
        {
          erp_material_id: 'MAT-CO-SULF',
          valid: true,
          risk_level: 'CRITICAL',
          risk_score: 70,
          erp_exposure_score: 75,
          contract_gap_score: 20,
          reasons: ['안전재고 대비 공급 공백 발생 예상'],
          assessed_at: '2026-07-31T14:20:00Z',
        },
      ],
    },
    erp_impact_available: false,
    erp_impact_blocked_reason: '이미 종합 위험도 평가가 완료된 이벤트입니다.',
  },
}

function toMockDetail(event: RiskMonitoringEvent): RiskMonitoringDetail {
  return (
    MOCK_DETAILS[event.event_id] ?? {
      ...event,
      summary: null,
      impact_domain: null,
      coordinates: null,
      url: null,
      external_signal: null,
      procurement_risk: null,
      erp_impact_available: event.grade !== null,
      erp_impact_blocked_reason: event.grade === null ? '분석이 아직 완료되지 않았습니다.' : null,
    }
  )
}

function applyFilters(events: RiskMonitoringEvent[], filters: RiskMonitoringFilters): RiskMonitoringEvent[] {
  return events
    .filter((event) => !filters.grade || event.grade === filters.grade)
    .filter((event) => !filters.country || event.country_code === filters.country)
    .filter((event) => !filters.material || event.material === filters.material)
    .slice(0, filters.limit ?? events.length)
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
 * 이벤트 목록 조회.
 *
 * 사용 예:
 *   const events = await fetchRiskMonitoringEvents(accessToken, { days: 7 })
 */
export async function fetchRiskMonitoringEvents(
  accessToken: string | null,
  filters: RiskMonitoringFilters = {},
): Promise<RiskMonitoringEvent[]> {
  if (!API_BASE_URL) {
    return applyFilters(MOCK_EVENTS, filters)
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
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
 * 이벤트 상세 조회.
 *
 * 사용 예:
 *   const detail = await fetchRiskMonitoringEvent(accessToken, 1)
 */
export async function fetchRiskMonitoringEvent(
  accessToken: string | null,
  eventId: number,
): Promise<RiskMonitoringDetail> {
  if (!API_BASE_URL) {
    const event = MOCK_EVENTS.find((e) => e.event_id === eventId)
    if (!event) {
      throw new Error('해당 이벤트를 찾을 수 없습니다.')
    }
    return toMockDetail(event)
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
  const result = await fetchWithAuth<RiskMonitoringDetail>(
    `/api/v1/risk-monitoring/events/${eventId}`,
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * "ERP·계약 영향 분석" 실행 — mock 모드에서는 실제 멀티에이전트가 없으므로 저장된
 * 상세를 그대로 돌려준다(버튼이 `erp_impact_available`로 이미 막혀 있어 호출될 일이 드물다).
 *
 * 사용 예:
 *   const updated = await runErpImpactAnalysis(accessToken, 1)
 */
export async function runErpImpactAnalysis(
  accessToken: string | null,
  eventId: number,
  useLlm = false,
): Promise<RiskMonitoringDetail> {
  if (!API_BASE_URL) {
    return fetchRiskMonitoringEvent(accessToken, eventId)
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
  const result = await fetchWithAuth<RiskMonitoringDetail>(
    `/api/v1/risk-monitoring/events/${eventId}/erp-impact?useLlm=${useLlm}`,
    accessToken,
    { method: 'POST' },
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}
