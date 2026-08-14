import { fetchImportDependency, fetchRiskEvents } from './purchasing.api'
import { parseRiskEventDate } from '../lib/riskEventId'
import { fetchWithAuth } from './http'
import type {
  AiBriefingDetailResponse,
  AiBriefingSummaryDashboardResponse,
  BriefingSummaryItem,
  ContractDetailResponse,
  ContractStatusDashboardResponse,
  CountryDependencyItem,
  DataQualityStatus,
  EntityBadgeItem,
  ImportDependencyDashboardResponse,
  KpiSummaryItem,
  MaterialRiskDashboardResponse,
  MaterialRiskRankItem,
  PlanningDashboardResponse,
  RankedBarItem,
  RiskExposureByUnit,
  RiskGrade,
  SupplierAnalysisDashboardResponse,
  SupplierRiskRankItem,
  UnitDependencyItem,
  VendorRiskHistoryItem,
} from './types'

/**
 * ①단계(mock)/②③단계(실 백엔드) 분기 기준. `fetchPublicRiskBoard()`(public.api.ts)와
 * 동일한 패턴이지만, 2계층 API는 전부 인증이 필요해 `fetchJson` 대신 `fetchWithAuth`를 쓴다.
 * 2026-08-03부터 `/api/v1/planning/*` 7개 + 상세 2개(9개)가 실제로 연결됐다
 * (`docs/backend-api-contracts.md` 참고).
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

const GRADE_SEVERITY: Record<RiskGrade, number> = { 심각: 3, 주의: 2, 정상: 1 }

/**
 * risk_event에는 사업부(business_unit) 필드가 없어, 데모용으로 자재→사업부 매핑을 임시 고정한다.
 * mock-schemas.md 2계층 예시의 사업부명("배터리셀사업부"/"양극재사업부")을 그대로 재사용했다.
 */
const BUSINESS_UNIT_BY_MATERIAL: Record<string, string> = {
  니켈: '배터리셀사업부',
  리튬: '배터리셀사업부',
  코발트: '양극재사업부',
}

/** risk_event.erp_view.alt_sourcing_candidates에 등장하는 공급사명 → vendor_id 고정 매핑(데모용). */
const VENDOR_ID_BY_NAME: Record<string, string> = {
  공급사A: 'SUP-0101',
  공급사B: 'SUP-0102',
  공급사C: 'SUP-0103',
  공급사D: 'SUP-0104',
  공급사E: 'SUP-0105',
  공급사F: 'SUP-0106',
}

/**
 * 전략 대시보드 탭(사이드바 1번째, `GET /api/v1/planning/strategy-dashboard`).
 *
 * 사용 예:
 *   const dashboard = await fetchPlanningDashboard(accessToken)
 */
export async function fetchPlanningDashboard(token: string): Promise<PlanningDashboardResponse> {
  if (!API_BASE_URL) return fetchPlanningDashboardMock()
  const result = await fetchWithAuth<PlanningDashboardResponse>('/api/v1/planning/strategy-dashboard', token)
  if ('error' in result) throw new Error(result.message)
  return result
}

/**
 * 2계층 경영기획팀 대시보드 mock. purchasing.api.ts의 risk_event mock 배열에서
 * risk_exposure_by_unit·vendor_risk_history를 파생시켜 같은 근원 데이터를 재사용한다.
 */
function fetchPlanningDashboardMock(): PlanningDashboardResponse {
  const events = fetchRiskEvents()

  const criticalCount = events.filter((event) => event.grade === '심각').length
  const criticalRatio = Math.round((criticalCount / events.length) * 1000) / 10

  const kpi_summary: KpiSummaryItem[] = [
    // risk_event 표본(7건)은 "이번 분기 탐지 건수"를 대표하기엔 규모가 작아 mock-schemas.md 예시값을 그대로 사용
    { label: '탐지된 리스크', value: 32, unit: '건' },
    { label: '심각 등급 비중', value: criticalRatio, unit: '%' },
    // risk_event에는 대응 소요시간 필드가 없어 예시값 사용
    { label: '평균 대응 소요', value: 2.3, unit: '일' },
  ]

  const severityByUnit = new Map<string, number[]>()
  for (const event of events) {
    const unit = BUSINESS_UNIT_BY_MATERIAL[event.market_context.material] ?? '기타'
    const severities = severityByUnit.get(unit) ?? []
    severities.push(GRADE_SEVERITY[event.grade])
    severityByUnit.set(unit, severities)
  }
  const risk_exposure_by_unit: RiskExposureByUnit[] = Array.from(severityByUnit.entries()).map(
    ([unit, severities]) => ({
      business_unit: unit,
      // 등급 평균(1~3)을 72점 만점(심각만 있을 때)으로 환산 — mock-schemas.md 예시 exposure_score 범위와 단위를 맞췄다.
      exposure_score: Math.round((severities.reduce((sum, value) => sum + value, 0) / severities.length) * 24),
    }),
  )

  const eventsByVendor = new Map<string, typeof events>()
  for (const event of events) {
    for (const vendorName of event.erp_view.alt_sourcing_candidates) {
      const vendorEvents = eventsByVendor.get(vendorName) ?? []
      vendorEvents.push(event)
      eventsByVendor.set(vendorName, vendorEvents)
    }
  }
  const vendor_risk_history: VendorRiskHistoryItem[] = Array.from(eventsByVendor.entries()).map(
    ([vendorName, vendorEvents]) => {
      const latestEvent = [...vendorEvents].sort((a, b) =>
        parseRiskEventDate(a.risk_event_id) < parseRiskEventDate(b.risk_event_id) ? 1 : -1,
      )[0]
      return {
        vendor_id: VENDOR_ID_BY_NAME[vendorName] ?? 'SUP-0000',
        vendor_name: vendorName,
        risk_count_90d: vendorEvents.length,
        latest_grade: latestEvent.grade,
        confidence_label: latestEvent.confidence_label,
      }
    },
  )

  // mock에는 실제 수집 뉴스가 없어 데모용으로 현재 시각을 쓴다 —
  // 실 백엔드에서는 strategy-dashboard의 as_of(최신 공급망 뉴스 수집 시각, MAX collected_at)가 온다.
  return {
    business_unit: '전체',
    period: '2026Q3',
    kpi_summary,
    risk_exposure_by_unit,
    vendor_risk_history,
    as_of: new Date().toISOString(),
  }
}

/**
 * 자재 위험 탭(사이드바 2번째, `GET /api/v1/planning/material-risk`).
 *
 * 사용 예:
 *   const dashboard = await fetchMaterialRiskDashboard(accessToken)
 */
export async function fetchMaterialRiskDashboard(token: string): Promise<MaterialRiskDashboardResponse> {
  if (!API_BASE_URL) return fetchMaterialRiskDashboardMock()
  const result = await fetchWithAuth<MaterialRiskDashboardResponse>('/api/v1/planning/material-risk', token)
  if ('error' in result) throw new Error(result.message)
  return result
}

/** risk_event mock을 자재별로 묶어 전사 순위를 매긴다 — fetchPlanningDashboardMock()과 같은 GRADE_SEVERITY×24 환산을 재사용. */
function fetchMaterialRiskDashboardMock(): MaterialRiskDashboardResponse {
  const events = fetchRiskEvents()

  const severityByMaterial = new Map<string, number[]>()
  for (const event of events) {
    const material = event.market_context.material
    const severities = severityByMaterial.get(material) ?? []
    severities.push(GRADE_SEVERITY[event.grade])
    severityByMaterial.set(material, severities)
  }

  const ranking: MaterialRiskRankItem[] = Array.from(severityByMaterial.entries())
    .map(([material, severities]) => {
      const avgSeverity = severities.reduce((sum, value) => sum + value, 0) / severities.length
      const score = Math.round(avgSeverity * 24)
      const grade: RiskGrade = avgSeverity >= 2.5 ? '심각' : avgSeverity >= 1.5 ? '주의' : '정상'
      return { material, score, grade, rank: 0 }
    })
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }))

  // 필드명은 "top_material_..."이지만, 최상위 1개 자재로만 필터링하면 그 자재가 속하지 않은
  // 사업부가 통째로 빠져버린다(예: 코발트가 1위면 배터리셀사업부가 아예 미표시) — 실 백엔드
  // `loadTopMaterialUnitExposure()`가 이름과 달리 실제로는 전체 자재를 평균 내는 것과 동일하게
  // mock도 전체 자재 기준으로 계산한다(fetchPlanningDashboardMock()의 risk_exposure_by_unit과
  // 동일 로직).
  const severityByUnit = new Map<string, number[]>()
  for (const event of events) {
    const unit = BUSINESS_UNIT_BY_MATERIAL[event.market_context.material] ?? '기타'
    const severities = severityByUnit.get(unit) ?? []
    severities.push(GRADE_SEVERITY[event.grade])
    severityByUnit.set(unit, severities)
  }
  const top_material_unit_exposure: RiskExposureByUnit[] = Array.from(severityByUnit.entries()).map(
    ([unit, severities]) => ({
      business_unit: unit,
      exposure_score: Math.round((severities.reduce((sum, value) => sum + value, 0) / severities.length) * 24),
    }),
  )

  const kpi_summary: KpiSummaryItem[] = [
    { label: '평가 자재', value: ranking.length, unit: '종' },
    { label: '심각 자재', value: ranking.filter((item) => item.grade === '심각').length, unit: '건' },
    // risk_event에는 재고일수 필드가 없어 예시값 사용 — mock 임시값, 후속 검증 필요.
    // tone은 실백엔드가 재고÷안전재고 비율로 계산해 내려주는 값 — mock에선 34일(≈안전재고 이상)을
    // 가정해 'normal'로 둔다.
    { label: '평균 재고일수', value: 34, unit: '일', tone: 'normal' },
    { label: '최고 위험 점수', value: ranking[0]?.score ?? 0, unit: '점' },
  ]

  return {
    kpi_summary,
    ranking,
    top_material_unit_exposure,
    // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
    quarter_change_label: '지난 분기 대비 위험 점수 상승',
  }
}

/**
 * 수입 의존도 탭(사이드바 3번째, `GET /api/v1/planning/import-dependency`).
 *
 * 사용 예:
 *   const dashboard = await fetchImportDependencyDashboard(accessToken)
 */
export async function fetchImportDependencyDashboard(token: string): Promise<ImportDependencyDashboardResponse> {
  if (!API_BASE_URL) return fetchImportDependencyDashboardMock()
  const result = await fetchWithAuth<ImportDependencyDashboardResponse>('/api/v1/planning/import-dependency', token)
  if ('error' in result) throw new Error(result.message)
  return result
}

/** 1계층 fetchImportDependency()의 국가별 breakdown을 재사용하고, 사업부 축은 데모용으로 파생한다. */
function fetchImportDependencyDashboardMock(): ImportDependencyDashboardResponse {
  const dependency = fetchImportDependency()

  const by_country: CountryDependencyItem[] = dependency.breakdown.map((item) => ({
    country: item.label,
    share_ratio: item.value,
  }))

  // risk_event/ERP 어느 쪽에도 "사업부 x 국가" 실측 데이터가 없어 데모용으로 상위 2개국만 파생
  // — mock 임시값, 후속 검증 필요
  const by_unit: UnitDependencyItem[] = [
    { business_unit: '배터리셀사업부', country: by_country[0]?.country ?? '', share_ratio: 84 },
    { business_unit: '양극재사업부', country: by_country[0]?.country ?? '', share_ratio: 31 },
  ]

  const alternative_suppliers: EntityBadgeItem[] = [
    {
      id: 'SUP-0101',
      primary: '공급사A',
      secondary: '전환 시 의존도 개선 추정',
      badge: { label: 'APPROVED', tone: 'success' },
    },
  ]

  const kpi_summary: KpiSummaryItem[] = [
    { label: '전체 수입 의존도', value: dependency.total, unit: '%' },
    { label: '단일국가 과의존', value: by_country.filter((item) => item.share_ratio >= 80).length, unit: '건' },
    { label: '대체 후보', value: alternative_suppliers.length, unit: '곳' },
    // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
    { label: '다변화 진행률', value: 40, unit: '%' },
  ]

  return { kpi_summary, by_country, by_unit, alternative_suppliers }
}

/**
 * 공급사 분석 탭(사이드바 4번째, `GET /api/v1/planning/supplier-analysis`).
 *
 * 사용 예:
 *   const dashboard = await fetchSupplierAnalysisDashboard(accessToken)
 */
export async function fetchSupplierAnalysisDashboard(token: string): Promise<SupplierAnalysisDashboardResponse> {
  if (!API_BASE_URL) return fetchSupplierAnalysisDashboardMock()
  const result = await fetchWithAuth<SupplierAnalysisDashboardResponse>('/api/v1/planning/supplier-analysis', token)
  if ('error' in result) throw new Error(result.message)
  return result
}

/** fetchPlanningDashboardMock()의 vendor_risk_history를 랭킹·연결 사업부 정보로 확장한다. */
function fetchSupplierAnalysisDashboardMock(): SupplierAnalysisDashboardResponse {
  const { vendor_risk_history } = fetchPlanningDashboardMock()

  const ranking: SupplierRiskRankItem[] = [...vendor_risk_history]
    .sort((a, b) => b.risk_count_90d - a.risk_count_90d)
    .map((item) => ({
      vendor_id: item.vendor_id,
      vendor_name: item.vendor_name,
      risk_count_90d: item.risk_count_90d,
      approved_status: item.latest_grade === '심각' ? 'REVIEW' : 'APPROVED',
      // risk_event에는 공급사-사업부 연결 필드가 없어 데모용 고정값 — mock 임시값, 후속 검증 필요
      linked_units: ['배터리셀사업부'],
    }))

  const recommended: EntityBadgeItem[] = ranking
    .filter((item) => item.approved_status === 'APPROVED')
    .slice(0, 3)
    .map((item) => ({
      id: item.vendor_id,
      primary: item.vendor_name,
      secondary: `최근 90일 이력 ${item.risk_count_90d}건`,
      badge: { label: 'APPROVED', tone: 'success' },
    }))

  const kpi_summary: KpiSummaryItem[] = [
    { label: '전체 공급사', value: ranking.length, unit: '곳' },
    { label: 'REVIEW 상태', value: ranking.filter((item) => item.approved_status === 'REVIEW').length, unit: '곳' },
    { label: '90일 이벤트', value: ranking.reduce((sum, item) => sum + item.risk_count_90d, 0), unit: '건' },
    // mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요
    { label: '대체 검토 진행', value: 2, unit: '/3' },
  ]

  return { kpi_summary, ranking, recommended }
}

/**
 * 계약 현황 탭(사이드바 5번째, `GET /api/v1/planning/contracts`).
 *
 * 사용 예:
 *   const dashboard = await fetchContractStatusDashboard(accessToken)
 */
export async function fetchContractStatusDashboard(token: string): Promise<ContractStatusDashboardResponse> {
  if (!API_BASE_URL) return fetchContractStatusDashboardMock()
  const result = await fetchWithAuth<ContractStatusDashboardResponse>('/api/v1/planning/contracts', token)
  if ('error' in result) throw new Error(result.message)
  return result
}

/** risk_event/ERP 어느 쪽에도 계약-사업부 매핑이 없어 전 필드 mock 임시값 — docs/mock-schemas.md "임시 mock 값" 표에 등재. */
function fetchContractStatusDashboardMock(): ContractStatusDashboardResponse {
  const kpi_summary: KpiSummaryItem[] = [
    { label: 'ACTIVE', value: 24, unit: '건' },
    { label: '만료 임박', value: 3, unit: '건' },
    { label: '문서 적재', value: 28, unit: '건' },
    { label: 'RAG 검색 가능', value: 28, unit: '건' },
  ]

  const coverage_by_unit = [
    { business_unit: '배터리셀사업부', contract_count: 14 },
    { business_unit: '양극재사업부', contract_count: 10 },
    { business_unit: '음극재사업부', contract_count: 5 },
  ]

  const expiring: EntityBadgeItem[] = [
    { id: 'BA-2025-0014', primary: 'BA-2025-0014', secondary: '양극재사업부', badge: { label: 'D-12', tone: 'warning' } },
    { id: 'BA-2025-0022', primary: 'BA-2025-0022', secondary: '배터리셀사업부', badge: { label: 'D-30', tone: 'warning' } },
  ]

  const contracts = expiring.map((item) => ({
    contract_number: item.id,
    contract_name: `${item.id} 공급 계약`,
    supplier_name: '공급사A',
    business_unit: item.secondary ?? null,
    status: 'ACTIVE',
    end_date: null,
    document_loaded: false,
    rag_ready: false,
    documents: [],
  }))
  return { kpi_summary, coverage_by_unit, expiring, contracts }
}

/**
 * AI 브리핑 탭(사이드바 6번째, `GET /api/v1/planning/ai-briefing`).
 *
 * 사용 예:
 *   const dashboard = await fetchAiBriefingSummaryDashboard(accessToken)
 */
export async function fetchAiBriefingSummaryDashboard(
  token: string,
  page = 0,
  size = 10,
): Promise<AiBriefingSummaryDashboardResponse> {
  if (!API_BASE_URL) return fetchAiBriefingSummaryDashboardMock(page, size)
  const result = await fetchWithAuth<AiBriefingSummaryDashboardResponse>(
    `/api/v1/planning/ai-briefing?page=${page}&size=${size}`,
    token,
  )
  if ('error' in result) throw new Error(result.message)
  return result
}

/** risk_event mock의 rag_view/grade를 사업부 단위로 취합한다. */
function fetchAiBriefingSummaryDashboardMock(page: number, size: number): AiBriefingSummaryDashboardResponse {
  const events = fetchRiskEvents()

  const recentAll: BriefingSummaryItem[] = [...events]
    .sort((a, b) => (parseRiskEventDate(a.risk_event_id) < parseRiskEventDate(b.risk_event_id) ? 1 : -1))
    .map((event) => ({
      risk_event_id: event.risk_event_id,
      material: event.market_context.material,
      grade: event.grade,
      headline: event.market_context.event_summary,
      business_unit: BUSINESS_UNIT_BY_MATERIAL[event.market_context.material] ?? '기타',
    }))
  const recent = recentAll.slice(page * size, page * size + size)
  const recent_total_count = recentAll.length

  const countByUnit = new Map<string, number>()
  for (const event of events) {
    const unit = BUSINESS_UNIT_BY_MATERIAL[event.market_context.material] ?? '기타'
    countByUnit.set(unit, (countByUnit.get(unit) ?? 0) + 1)
  }
  const by_unit: RankedBarItem[] = Array.from(countByUnit.entries()).map(([unit, count]) => ({
    name: unit,
    value: count,
    tone: 'neutral',
  }))

  const kpi_summary: KpiSummaryItem[] = [
    // risk_event 표본(7건)은 "이번 분기 브리핑"을 대표하기엔 규모가 작아 예시값 사용 — mock 임시값
    { label: '이번 분기 브리핑', value: 32, unit: '건' },
    { label: '정상', value: events.filter((event) => event.grade === '정상').length, unit: '건' },
    { label: '주의', value: events.filter((event) => event.grade === '주의').length, unit: '건' },
    { label: '심각', value: events.filter((event) => event.grade === '심각').length, unit: '건' },
  ]

  return { kpi_summary, by_unit, recent, recent_total_count }
}

/**
 * 데이터 품질 탭(사이드바 7번째, `GET /api/v1/planning/data-quality`).
 *
 * 사용 예:
 *   const status = await fetchDataQualityStatus(accessToken)
 */
export async function fetchDataQualityStatus(token: string): Promise<DataQualityStatus> {
  if (!API_BASE_URL) return fetchDataQualityStatusMock()
  const result = await fetchWithAuth<DataQualityStatus>('/api/v1/planning/data-quality', token)
  if ('error' in result) throw new Error(result.message)
  return result
}

/** 전 필드 mock 임시값 — 실제 파이프라인 모니터링 연동 전. */
function fetchDataQualityStatusMock(): DataQualityStatus {
  return {
    erp_sync_status: '정상',
    rag_index_status: '정상',
    material_coverage_count: 3,
    material_coverage_total: 8,
    last_updated_label: '10분 전',
    confidence_distribution: [
      { label: '확정', ratio: 42 },
      { label: '참고', ratio: 41 },
      { label: '경고', ratio: 17 },
    ],
  }
}

/**
 * AI 브리핑 드릴다운 상세(`GET /api/v1/planning/ai-briefing/{analysisId}`). 2026-08-03 신규.
 *
 * 사용 예:
 *   const detail = await fetchAiBriefingDetail(accessToken, analysisId)
 */
export async function fetchAiBriefingDetail(token: string, analysisId: string): Promise<AiBriefingDetailResponse> {
  if (!API_BASE_URL) return fetchAiBriefingDetailMock(analysisId)
  const result = await fetchWithAuth<AiBriefingDetailResponse>(
    `/api/v1/planning/ai-briefing/${encodeURIComponent(analysisId)}`,
    token,
  )
  if ('error' in result) throw new Error(result.message)
  return result
}

/**
 * mock 임시값 — 실제 백엔드는 procurement_risk_assessments의 LLM 브리핑 본문/근거를
 * 반환하지만, 1계층 risk_event mock의 `recent` 목록엔 그런 상세 필드가 없어 화면 확인용으로
 * 합성한다. `recent`에 없는 id는 찾을 수 없음으로 처리(1계층 BriefingDetailPage와 동일 관례).
 */
function fetchAiBriefingDetailMock(analysisId: string): AiBriefingDetailResponse {
  // 전체 목록에서 찾아야 하므로 페이지네이션 없이 한 번에 크게 요청한다.
  const { recent } = fetchAiBriefingSummaryDashboardMock(0, 1000)
  const item = recent.find((entry) => entry.risk_event_id === analysisId)
  if (!item) {
    throw new Error('해당 브리핑을 찾을 수 없습니다.')
  }
  return {
    analysis_id: item.risk_event_id,
    material: item.material,
    business_unit: item.business_unit,
    grade: item.grade,
    headline: item.headline,
    event_content: item.headline,
    // mock에는 분석이 만든 한국어 요약·원문 링크가 없어 폴백을 확인할 수 있도록 null로 둔다
    // (실 백엔드는 analyses.summary_kr·source_url, ai_briefings.briefing_summary_kr을 채워 보낸다).
    summary_kr: null,
    briefing_summary_kr: null,
    source_url: null,
    briefing: `${item.headline} — 관련 브리핑 본문(mock 임시값, 실제 LLM 생성 텍스트 아님).`,
    recommended_actions: ['대체 공급사 컨택 검토', '안전재고 확대 검토'],
    contract_findings: [],
    warnings: [],
    assessed_at: null,
  }
}

/**
 * 계약 상세 드릴다운(`GET /api/v1/planning/contracts/{contractNumber}`). 2026-08-03 신규.
 *
 * 사용 예:
 *   const detail = await fetchContractDetail(accessToken, contractNumber)
 */
export async function fetchContractDetail(token: string, contractNumber: string): Promise<ContractDetailResponse> {
  if (!API_BASE_URL) return fetchContractDetailMock(contractNumber)
  const result = await fetchWithAuth<ContractDetailResponse>(
    `/api/v1/planning/contracts/${encodeURIComponent(contractNumber)}`,
    token,
  )
  if ('error' in result) throw new Error(result.message)
  return result
}

/** mock 임시값 — fetchContractStatusDashboardMock()의 `expiring` 목록에서 찾아 합성한다. */
function fetchContractDetailMock(contractNumber: string): ContractDetailResponse {
  const { expiring } = fetchContractStatusDashboardMock()
  const item = expiring.find((entry) => entry.id === contractNumber)
  if (!item) {
    throw new Error('해당 계약을 찾을 수 없습니다.')
  }
  return {
    contract_number: item.id,
    contract_name: `${item.id} 공급 계약`,
    supplier_name: '공급사A',
    material_name: null,
    business_unit: item.secondary ?? null,
    status: 'ACTIVE',
    start_date: null,
    end_date: null,
    documents: [],
  }
}
