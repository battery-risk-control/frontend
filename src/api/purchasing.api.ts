import type {
  GlobalRiskBoardItem,
  ImportDependencyData,
  MaterialPriceSeries,
  MaterialPriceSummary,
  RiskEvent,
} from './types'

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

/*
 * `fetchRiskEventBriefing`은 2026-08-02에 걷어냈다. 유일한 사용처였던 구형 브리핑 열람 화면
 * (Seq 24, BriefingDetailPage)이 AI 브리핑 화면으로 대체되면서, 하드코딩된 mock 브리핑이
 * 실제 멀티에이전트 결과와 나란히 보이는 상태가 됐기 때문이다. 브리핑 열람은
 * `/api/v1/ai-briefing/briefings/{id}`(aiBriefing.api.ts) 하나로 일원화했다.
 */

/**
 * 글로벌 리스크 관제 맵 mock 함수. 원래 api/public.api.ts에 있었으나, 구매팀 대시보드(Phase 9.4)도
 * 같은 지도를 재사용하게 되면서 원천 데이터(MOCK_RISK_EVENTS) 허브인 이 파일로 옮겼다.
 * public.api.ts는 이 함수를 재수출만 한다(로직 변경 없음, 기존 import 경로 그대로 동작).
 *
 * 사용 예:
 *   const items = fetchGlobalRiskBoard()
 */
export function fetchGlobalRiskBoard(): GlobalRiskBoardItem[] {
  return fetchRiskEvents().map((event) => ({
    risk_event_id: event.risk_event_id,
    material: event.market_context.material,
    grade: event.grade,
    confidence_label: event.confidence_label,
    event_summary: event.market_context.event_summary,
    country_code: event.market_context.country_code,
    country_name: event.market_context.country_name,
    coordinates: event.market_context.coordinates,
  }))
}

/**
 * 원자재 가격 추이 데모 데이터. risk_event 스키마에는 가격 필드가 없어 대상 자재만
 * market_context.material에서 가져오고, 지수 값은 데모용으로 합성했다(기준일=100).
 * 원래 api/public.api.ts에 있었으나 fetchGlobalRiskBoard와 같은 이유로 이 파일로 옮겼다.
 */
const MOCK_PRICE_SERIES: Record<string, MaterialPriceSeries> = {
  니켈: {
    material: '니켈',
    unit: '지수(기준일=100)',
    points: [
      { date: '2026-07-15', price_index: 100 },
      { date: '2026-07-16', price_index: 101 },
      { date: '2026-07-17', price_index: 103 },
      { date: '2026-07-18', price_index: 106 },
      { date: '2026-07-19', price_index: 112 },
      { date: '2026-07-20', price_index: 116 },
      { date: '2026-07-21', price_index: 118 },
    ],
  },
  리튬: {
    material: '리튬',
    unit: '지수(기준일=100)',
    points: [
      { date: '2026-07-15', price_index: 100 },
      { date: '2026-07-16', price_index: 99 },
      { date: '2026-07-17', price_index: 98 },
      { date: '2026-07-18', price_index: 100 },
      { date: '2026-07-19', price_index: 103 },
      { date: '2026-07-20', price_index: 104 },
      { date: '2026-07-21', price_index: 105 },
    ],
  },
  코발트: {
    material: '코발트',
    unit: '지수(기준일=100)',
    points: [
      { date: '2026-07-15', price_index: 100 },
      { date: '2026-07-16', price_index: 100 },
      { date: '2026-07-17', price_index: 102 },
      { date: '2026-07-18', price_index: 101 },
      { date: '2026-07-19', price_index: 104 },
      { date: '2026-07-20', price_index: 108 },
      { date: '2026-07-21', price_index: 109 },
    ],
  },
}

/**
 * 원자재 가격 추이 mock 함수. 현재 risk_event mock에 등장하는 자재(니켈/리튬/코발트)만 반환한다.
 *
 * 사용 예:
 *   const series = fetchMaterialPriceTrends()
 */
export function fetchMaterialPriceTrends(): MaterialPriceSeries[] {
  const materials = new Set(fetchRiskEvents().map((event) => event.market_context.material))
  return Array.from(materials)
    .map((material) => MOCK_PRICE_SERIES[material])
    .filter((series): series is MaterialPriceSeries => Boolean(series))
}

/**
 * 원자재 가격 상세보기(Phase 9.3) 요약 카드용 mock 함수. change_label/risk_score/grade는
 * MaterialPriceSeries나 risk_event에서 계산한 값이 아니라 surin RiskMonitoring 화면의
 * 시각 구성을 이식하기 위한 임시값이다 — docs/mock-schemas.md 참고, 후속 검증 필요.
 *
 * 사용 예:
 *   const summaries = fetchMaterialPriceSummaries()
 */
export function fetchMaterialPriceSummaries(): MaterialPriceSummary[] {
  return [
    { material: '니켈', change_label: '▲ 1.7%', risk_score: 72, grade: '주의' }, // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
    { material: '리튬', change_label: '▲ 1.0%', risk_score: 58, grade: '주의' }, // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
    { material: '코발트', change_label: '▲ 4.8%', risk_score: 66, grade: '심각' }, // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
  ]
}

/*
 * `fetchMaterialRiskGauges`·`fetchScoreCards`(원자재 리스크 개요 5칸의 mock)는 2026-08-02에
 * 걷어냈다. 구매팀 대시보드가 실 데이터로 넘어가면서 게이지는 `/material-risk/overview`,
 * 점수 카드는 `/purchasing-dashboard/kpi-summary`에서 파생하게 됐고(변환은
 * `purchasingDashboard.api.ts`의 `toMaterialRiskGauges`·`toScoreCards`), 그 값들과 나란히 두면
 * 어느 쪽이 실제 평가 결과인지 구분되지 않기 때문이다. 특히 mock 쪽에는 우리 ERP에 없는
 * 자재(흑연)와 근거 없는 "전일 대비" 문구가 들어 있었다.
 *
 * 아래 `fetchImportDependency`를 비롯한 나머지 mock은 남는다 — 비로그인 공개 대시보드가
 * `VITE_API_BASE_URL` 미설정(①단계)에서 폴백으로 쓴다.
 */

/**
 * 구매팀 대시보드 확장(Phase 9.4, surin importDependency 이식) — 수입 의존도 도넛차트.
 * risk_event 스키마에는 없는 개념(국가별 수입 비중)이라 surin 값을 그대로 가져왔다 —
 * docs/mock-schemas.md 참고, 후속 검증 필요.
 *
 * 사용 예:
 *   const dependency = fetchImportDependency()
 */
export function fetchImportDependency(): ImportDependencyData {
  return {
    total: 82.3, // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
    year: '2024년 기준',
    breakdown: [
      { label: '중국', value: 54.1, color: '#2f5adb' },
      { label: '인도네시아', value: 12.8, color: '#22c55e' },
      { label: '호주', value: 8.7, color: '#a855f7' },
      { label: '모잠비크', value: 6.3, color: '#f59e0b' },
      { label: '브라질', value: 5.2, color: '#38bdf8' },
      { label: '기타', value: 12.9, color: '#cbd5e1' },
    ], // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
  }
}
