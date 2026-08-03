import { fetchWithAuth } from './http'
import type {
  MaterialRiskGaugeItem,
  MaterialRiskItem,
  MaterialRiskSummaryItem,
  PurchasingKpiSummary,
  RiskGrade,
  ScoreCardItem,
  SupplierOverview,
} from './types'

/**
 * 비로그인 대시보드(`/`) 본문 12섹션 중, 구매팀 1계층 `purchasingDashboard.api.ts`(minji
 * 브랜치, `accessToken` 필수·mock 폴백 없음)가 담당하던 인증 API 3종(KPI 요약/원자재별
 * 리스크 점수/공급사 현황)을 이식한 API 클라이언트다.
 *
 * **원본과의 차이**: 원본 저자는 "이 화면의 숫자는 우리 ERP·평가 결과라서 mock을 지어내면
 * 안 된다"는 원칙으로 mock 폴백을 두지 않았다. 이번 포팅은 그 대신 `/public/*` 전체에 이미
 * 적용된 "완전 공개 + mock 폴백"(사용자 결정, 2026-08-03) 원칙을 그대로 따른다 —
 * `publicRiskMonitoring.api.ts` 최상단 주석과 동일한 3단계 분기(mock/로그인 필요/실 API).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.'

/** mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요. */
const MOCK_KPI_SUMMARY: PurchasingKpiSummary = {
  assessed_category_count: 7,
  critical_count: 2,
  warning_count: 3,
  normal_count: 2,
  erp_exposure_score_avg: 58,
  external_signal_score_avg: 52,
  verified_briefing_count: 4,
  latest_assessed_at: '2026-08-03T01:20:00Z',
  critical_count_24h: 1,
  warning_count_24h: 2,
  erp_exposure_score_avg_24h: 55,
  external_signal_score_avg_24h: 49,
  mock: true,
}

/** mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요. */
const MOCK_MATERIAL_RISK_SUMMARY: MaterialRiskSummaryItem[] = [
  { material_category: 'COBALT', material_name: '코발트', risk_score: 70, risk_level: 'CRITICAL', risk_score_24h_ago: 64, score_delta: 6, latest_assessment_id: 'ASMT-0001', top_news: [] },
  { material_category: 'NICKEL', material_name: '니켈', risk_score: 56, risk_level: 'WARNING', risk_score_24h_ago: 58, score_delta: -2, latest_assessment_id: 'ASMT-0002', top_news: [] },
  { material_category: 'LITHIUM', material_name: '리튬', risk_score: 48, risk_level: 'WARNING', risk_score_24h_ago: 44, score_delta: 4, latest_assessment_id: 'ASMT-0003', top_news: [] },
  { material_category: 'GRAPHITE', material_name: '흑연', risk_score: null, risk_level: null, risk_score_24h_ago: null, score_delta: null, latest_assessment_id: null, top_news: [] },
  { material_category: 'MANGANESE', material_name: '망간', risk_score: 26, risk_level: 'NORMAL', risk_score_24h_ago: 28, score_delta: -2, latest_assessment_id: 'ASMT-0004', top_news: [] },
  { material_category: 'COPPER', material_name: '구리', risk_score: 18, risk_level: 'NORMAL', risk_score_24h_ago: 18, score_delta: 0, latest_assessment_id: 'ASMT-0005', top_news: [] },
  { material_category: 'ALUMINUM', material_name: '알루미늄', risk_score: null, risk_level: null, risk_score_24h_ago: null, score_delta: null, latest_assessment_id: null, top_news: [] },
]

/** mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요. */
const MOCK_SUPPLIER_OVERVIEW: SupplierOverview = {
  current: {
    supplier_code: 'SUP-0142',
    supplier_name: '공급사A',
    country_code: 'CD',
    supplier_status: 'ACTIVE',
    risk_level: 'WARNING',
    dependency_ratio: 62.3,
  },
  alternatives: [
    {
      rank_position: 1,
      supplier_code: 'SUP-0201',
      supplier_name: '공급사B',
      supplier_status: 'ACTIVE',
      risk_level: 'NORMAL',
      recommendation_reason: 'IATF16949 인증 보유, 리드타임 우수',
      pros: '납기 안정성',
      cons: '단가 5% 높음',
    },
  ],
}

async function resolve<T extends object>(
  accessToken: string | null,
  path: string,
  mock: T,
): Promise<T> {
  if (!API_BASE_URL) return mock
  if (!accessToken) throw new Error(LOGIN_REQUIRED_MESSAGE)
  const result = await fetchWithAuth<T>(path, accessToken)
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/** 상단 KPI 5칸(심각·주의 건수, ERP 영향도, 외부 위험, 검증 브리핑). */
export async function fetchPurchasingKpiSummary(
  accessToken: string | null,
): Promise<PurchasingKpiSummary> {
  return resolve(accessToken, '/api/v1/purchasing-dashboard/kpi-summary', MOCK_KPI_SUMMARY)
}

/** 원자재별 리스크 점수 7종(최종 합성 점수 기준). */
export async function fetchMaterialRiskSummary(
  accessToken: string | null,
): Promise<MaterialRiskSummaryItem[]> {
  return resolve(
    accessToken,
    '/api/v1/purchasing-dashboard/material-risk-summary',
    MOCK_MATERIAL_RISK_SUMMARY,
  )
}

/** 공급사 현황 + 대체 공급사 추천. */
export async function fetchSupplierOverview(
  accessToken: string | null,
): Promise<SupplierOverview> {
  return resolve(accessToken, '/api/v1/purchasing-dashboard/supplier-overview', MOCK_SUPPLIER_OVERVIEW)
}

/**
 * 평가 1건을 완료 처리한다. mock 모드에서는 서버에 반영할 대상이 없으므로 아무 것도 하지
 * 않는다 — 호출부(`MaterialRiskSummaryTable`)가 로컬에서 목록을 갱신해 화면상으로만
 * 사라지는 정도로 충분하다(CLAUDE.md "mock 데이터를 완벽하게 구성하려 애쓰지 않는다").
 */
export async function acknowledgeAssessment(
  accessToken: string | null,
  assessmentId: string,
): Promise<void> {
  if (!API_BASE_URL) return
  if (!accessToken) throw new Error(LOGIN_REQUIRED_MESSAGE)
  const result = await fetchWithAuth<unknown>(
    `/api/v1/multi-agent/assessments/${assessmentId}/acknowledge`,
    accessToken,
    { method: 'POST' },
  )
  if (result !== null && typeof result === 'object' && 'error' in result) {
    throw new Error(String((result as { message?: string }).message ?? '완료 처리에 실패했습니다.'))
  }
}

/** 심각 → 주의 → 정상 순으로 세울 때 쓰는 순위. 값이 클수록 위험하다. */
const GRADE_SEVERITY: Record<RiskGrade, number> = {
  심각: 3,
  주의: 2,
  정상: 1,
}

/** 게이지 카드로 세울 자재 수. surin 이식 당시의 3장 구성을 유지한다. */
const GAUGE_COUNT = 3

/**
 * 자재별 위험 목록에서 게이지 카드 3장을 고른다. 평가하지 못한 자재(`grade === null`)는
 * 제외한다 — 그런 자재는 `PublicMaterialRiskStatusPanel`이 "평가 불가"로 따로 보여준다.
 */
export function toMaterialRiskGauges(materials: MaterialRiskItem[]): MaterialRiskGaugeItem[] {
  return materials
    .filter((material): material is MaterialRiskItem & { grade: RiskGrade } => material.grade !== null)
    .sort((a, b) => {
      const severityDiff = GRADE_SEVERITY[b.grade] - GRADE_SEVERITY[a.grade]
      if (severityDiff !== 0) return severityDiff
      return (b.score ?? 0) - (a.score ?? 0)
    })
    .slice(0, GAUGE_COUNT)
    .map((material) => ({
      name: material.material_name,
      basis: `(${material.erp_material_id})`,
      grade: material.grade,
    }))
}

/**
 * KPI 요약에서 점수 카드 2장(외부 리스크 종합 / ERP 영향)을 만든다. 평가가 0건이면 카드
 * 자체를 만들지 않는다 — 0점 카드를 띄우면 "위험이 없다"로 읽히는데 실제로는 "아직
 * 평가하지 않았다"이기 때문이다.
 */
export function toScoreCards(kpi: PurchasingKpiSummary | null): ScoreCardItem[] {
  if (!kpi) return []
  const cards: ScoreCardItem[] = []
  if (kpi.external_signal_score_avg !== null) {
    cards.push({ label: '외부 리스크 종합 점수', score: Math.round(kpi.external_signal_score_avg) })
  }
  if (kpi.erp_exposure_score_avg !== null) {
    cards.push({ label: 'ERP 영향 점수', score: Math.round(kpi.erp_exposure_score_avg) })
  }
  return cards
}

/**
 * 구매 대응 우선순위 정렬 — 등급(심각 > 주의 > 정상) → 재고일수(적을수록 긴급) 순.
 * 평가하지 못한 자재를 맨 뒤로 보내지 않는다(심각 바로 다음, 주의보다 앞).
 */
export function toPurchasePriority(materials: MaterialRiskItem[]): MaterialRiskItem[] {
  return [...materials].sort((a, b) => {
    const severityDiff = priorityRank(b) - priorityRank(a)
    if (severityDiff !== 0) return severityDiff
    return (a.inventory_days ?? Infinity) - (b.inventory_days ?? Infinity)
  })
}

/** 심각(3) > 평가 불가(2.5) > 주의(2) > 정상(1). */
function priorityRank(material: MaterialRiskItem): number {
  if (material.grade === null) return 2.5
  return GRADE_SEVERITY[material.grade]
}
