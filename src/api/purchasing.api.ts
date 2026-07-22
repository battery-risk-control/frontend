import type { RiskEvent, RiskEventBriefing } from './types'

/**
 * 1계층 구매팀 대시보드 mock 데이터.
 * risk_event_id 규칙(RISK-YYYY-MMDD-NNN)과 필드 구조는 CLAUDE.md의 risk_event 스키마를 그대로 따른다.
 * output_artifacts는 Seq 21 데모 범위에 따라 render_mode: 'json' 고정.
 */
const MOCK_RISK_EVENTS: RiskEvent[] = [
  {
    risk_event_id: 'RISK-2026-0721-001',
    grade: '심각',
    confidence_label: '확정',
    market_context: {
      source: 'data_ingestion_layer',
      material: '니켈',
      event_summary: '인도네시아 니켈 수출 관세 인상 발표로 현물가 18% 급등',
      country_code: 'ID',
      country_name: '인도네시아',
      coordinates: { lat: -6.2088, lng: 106.8456 },
    },
    erp_view: {
      safety_stock_days: 6,
      affected_material_code: 'NI-2201',
      alt_sourcing_candidates: ['공급사A', '공급사B'],
    },
    quality_check: {
      status: 'pass',
      criteria: ['IATF16949 인증', 'PPAP 승인 이력'],
      reason: '대체 후보 2곳 모두 최근 감사 기준 충족',
    },
    rag_view: {
      contract_clause_summary: '기존 계약서 8조(가격 조정) — 원자재가 15% 이상 변동 시 재협상 조항 존재',
      negotiation_points: ['재협상 조항 발동 요건 충족 여부 확인', '단기 물량 우선 확보 조건 제시'],
    },
    output_artifacts: { render_mode: 'json', file_url: null, fallback_to_json: true },
  },
  {
    risk_event_id: 'RISK-2026-0720-004',
    grade: '주의',
    confidence_label: '참고',
    market_context: {
      source: 'data_ingestion_layer',
      material: '리튬',
      event_summary: '칠레 리튬 광산 노조 파업 예고 보도, 공급 차질 가능성 제기',
      country_code: 'CL',
      country_name: '칠레',
      coordinates: { lat: -33.4489, lng: -70.6693 },
    },
    erp_view: {
      safety_stock_days: 21,
      affected_material_code: 'LI-1105',
      alt_sourcing_candidates: ['공급사C'],
    },
    quality_check: {
      status: 'pass',
      criteria: ['IATF16949 인증'],
      reason: '대체 후보 1곳 인증 유효, PPAP 이력 미확인',
    },
    rag_view: {
      contract_clause_summary: '기존 계약서 5조(공급 지연) — 2주 초과 지연 시 위약 조항 적용',
      negotiation_points: ['파업 현실화 시 위약 조항 적용 여부 사전 검토'],
    },
    output_artifacts: { render_mode: 'json', file_url: null, fallback_to_json: true },
  },
  {
    risk_event_id: 'RISK-2026-0719-002',
    grade: '주의',
    confidence_label: '경고',
    market_context: {
      source: 'data_ingestion_layer',
      material: '코발트',
      event_summary: '콩고민주공화국 코발트 광산 관련 뉴스, 출처 교차검증 실패',
      country_code: 'CD',
      country_name: '콩고민주공화국',
      coordinates: { lat: -4.4419, lng: 15.2663 },
    },
    erp_view: {
      safety_stock_days: 34,
      affected_material_code: 'CO-3310',
      alt_sourcing_candidates: [],
    },
    quality_check: {
      status: 'fail',
      criteria: ['IATF16949 인증', 'PPAP 승인 이력'],
      reason: '단일 출처 미검증 보도 — ERP 실적 데이터와 교차 확인 불가',
    },
    rag_view: {
      contract_clause_summary: '해당 없음 — 검증 실패로 계약 조항 대조 보류',
      negotiation_points: [],
    },
    output_artifacts: { render_mode: 'json', file_url: null, fallback_to_json: true },
  },
  {
    risk_event_id: 'RISK-2026-0718-011',
    grade: '정상',
    confidence_label: '확정',
    market_context: {
      source: 'data_ingestion_layer',
      material: '니켈',
      event_summary: '필리핀 니켈 광산 정기 점검 완료, 공급 일정 정상 유지',
      country_code: 'PH',
      country_name: '필리핀',
      coordinates: { lat: 14.5995, lng: 120.9842 },
    },
    erp_view: {
      safety_stock_days: 45,
      affected_material_code: 'NI-2205',
      alt_sourcing_candidates: ['공급사A'],
    },
    quality_check: {
      status: 'pass',
      criteria: ['IATF16949 인증', 'PPAP 승인 이력'],
      reason: 'ERP 입고 실적과 계약 물량 일치',
    },
    rag_view: {
      contract_clause_summary: '기존 계약서 3조(정기 검수) — 별도 특이사항 없음',
      negotiation_points: [],
    },
    output_artifacts: { render_mode: 'json', file_url: null, fallback_to_json: true },
  },
  {
    risk_event_id: 'RISK-2026-0717-006',
    grade: '주의',
    confidence_label: '확정',
    market_context: {
      source: 'data_ingestion_layer',
      material: '리튬',
      event_summary: '호주 리튬 정광 해상 운임 상승, 리드타임 5일 지연 반영',
      country_code: 'AU',
      country_name: '호주',
      coordinates: { lat: -35.2809, lng: 149.1300 },
    },
    erp_view: {
      safety_stock_days: 15,
      affected_material_code: 'LI-1108',
      alt_sourcing_candidates: ['공급사D', '공급사E'],
    },
    quality_check: {
      status: 'pass',
      criteria: ['IATF16949 인증', 'PPAP 승인 이력'],
      reason: '대체 후보 2곳 모두 즉시 전환 가능',
    },
    rag_view: {
      contract_clause_summary: '기존 계약서 6조(운송 지연) — 5영업일 이내 지연은 면책',
      negotiation_points: ['면책 범위 초과 여부 리드타임 재산정 후 확인'],
    },
    output_artifacts: { render_mode: 'json', file_url: null, fallback_to_json: true },
  },
  {
    risk_event_id: 'RISK-2026-0716-009',
    grade: '심각',
    confidence_label: '참고',
    market_context: {
      source: 'data_ingestion_layer',
      material: '코발트',
      event_summary: '코발트 최대 생산국 수출 쿼터 축소 뉴스 확산, ERP 미반영 상태',
      country_code: 'CD',
      country_name: '콩고민주공화국',
      coordinates: { lat: -4.4419, lng: 15.2663 },
    },
    erp_view: {
      safety_stock_days: 9,
      affected_material_code: 'CO-3312',
      alt_sourcing_candidates: ['공급사F'],
    },
    quality_check: {
      status: 'pass',
      criteria: ['IATF16949 인증'],
      reason: '대체 후보 1곳 인증 유효, PPAP 이력 확인 중',
    },
    rag_view: {
      contract_clause_summary: '기존 계약서 8조(가격 조정) — 쿼터 축소는 명시적 조정 사유 아님',
      negotiation_points: ['쿼터 축소 확정 시까지 단기 대응안 우선 검토'],
    },
    output_artifacts: { render_mode: 'json', file_url: null, fallback_to_json: true },
  },
]

/**
 * 1계층 구매팀 대시보드용 리스크 이벤트 목록 mock 함수.
 * 실제 BE 계약이 나오면 이 함수의 구현부만 fetch 호출로 교체하면 된다 (반환 타입은 유지).
 *
 * 사용 예:
 *   const events = fetchRiskEvents()
 */
export function fetchRiskEvents(): RiskEvent[] {
  return MOCK_RISK_EVENTS
}

/**
 * 1계층 브리핑 자료 열람(Seq 24)용 mock 함수. risk_event_id로 찾은 이벤트의
 * rag_view/output_artifacts만 추출해 반환한다 — 새 데이터를 만들지 않고 같은 근원에서 파생한다.
 * 존재하지 않는 ID면 null을 반환한다.
 *
 * 사용 예:
 *   const briefing = fetchRiskEventBriefing('RISK-2026-0721-001')
 */
export function fetchRiskEventBriefing(riskEventId: string): RiskEventBriefing | null {
  const event = MOCK_RISK_EVENTS.find((candidate) => candidate.risk_event_id === riskEventId)
  if (!event) return null
  return {
    risk_event_id: event.risk_event_id,
    material: event.market_context.material,
    grade: event.grade,
    confidence_label: event.confidence_label,
    rag_view: event.rag_view,
    output_artifacts: event.output_artifacts,
  }
}
