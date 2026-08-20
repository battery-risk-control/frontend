import { fetchWithAuth } from './http'
import type {
  AcknowledgedItem,
  MaterialRiskItem,
  MaterialRiskSummaryItem,
  PurchasingKpiSummary,
  RiskGrade,
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

/**
 * "완료 처리 항목" mock — 항상 빈 배열이다.
 *
 * `acknowledgeAssessment`의 ①단계는 아무 동작도 하지 않으므로(위 주석 참고), mock 모드에서는
 * 애초에 그 어떤 평가도 실제로 "완료 처리"되지 않는다. 되돌릴 목업 항목을 지어내면 "누른 적
 * 없는데 이미 완료 처리된 항목이 있다"는 앞뒤가 안 맞는 상태가 된다 — 빈 목록 안내문으로
 * 충분하다(CLAUDE.md "mock 데이터를 완벽하게 구성하려 애쓰지 않는다").
 */
const MOCK_ACKNOWLEDGED: AcknowledgedItem[] = []

async function resolve<T extends object>(
  accessToken: string | null,
  path: string,
  mock: T,
): Promise<T> {
  if (!API_BASE_URL) return mock
  // 조회 전용 API — 백엔드가 permitAll로 열어뒀으므로 비로그인 방문자도 그대로 부른다.
  const result = await fetchWithAuth<T>(path, accessToken ?? '')
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
    throw new Error(String((result as { message?: string }).message ?? '확인 처리에 실패했습니다.'))
  }
}

/**
 * 완료 처리 되돌리기. 그 평가가 KPI·주요 이슈 집계로 되돌아온다. `acknowledgeAssessment`와
 * 대칭인 3분기 — mock 모드는 아무 것도 하지 않는다(되돌릴 서버 상태 자체가 없다).
 *
 * 되돌릴 기록이 없어도 성공이다 — 결과 상태가 같기 때문이고, 백엔드가 200 + not_acknowledged로
 * 알려준다. 화면은 어느 쪽이든 목록을 다시 불러오면 되므로 응답 본문을 쓰지 않는다.
 */
export async function unacknowledgeAssessment(
  accessToken: string | null,
  assessmentId: string,
): Promise<void> {
  if (!API_BASE_URL) return
  if (!accessToken) throw new Error(LOGIN_REQUIRED_MESSAGE)
  const result = await fetchWithAuth<unknown>(
    `/api/v1/multi-agent/assessments/${assessmentId}/acknowledge`,
    accessToken,
    { method: 'DELETE' },
  )
  if (result !== null && typeof result === 'object' && 'error' in result) {
    throw new Error(String((result as { message?: string }).message ?? '되돌리기에 실패했습니다.'))
  }
}

/**
 * 완료 처리된 평가 목록. 되돌리기 UI가 이 목록 위에 선다.
 *
 * @param limit 노출 건수(1~50, 기본 5). 경영진 화면은 "우선 브리핑 점수"에서 확인 완료된 평가에
 *   연결된 브리핑을 제외하려고 assessment_id 집합이 필요해 더 크게(예: 50) 조회한다.
 */
export async function fetchAcknowledgedAssessments(
  accessToken: string | null,
  limit = 5,
): Promise<AcknowledgedItem[]> {
  return resolve(accessToken, `/api/v1/purchasing-dashboard/acknowledged?limit=${limit}`, MOCK_ACKNOWLEDGED)
}

/** 심각 → 주의 → 정상 순으로 세울 때 쓰는 순위. 값이 클수록 위험하다. */
const GRADE_SEVERITY: Record<RiskGrade, number> = {
  심각: 3,
  주의: 2,
  정상: 1,
}

/**
 * 구매 대응 우선순위. **평가 가능한 자재만 순위를 매기고**, 평가하지 못한 자재는 순위 없이
 * 목록 맨 뒤로 보낸다.
 *
 * 예전에는 평가 불가를 심각과 주의 사이(2.5)에 끼워 눈에 띄게 했는데, 그러면 "2위"라는 숫자가
 * **두 가지 뜻을 갖는다** — "두 번째로 위험하다"와 "확인이 안 됐다". 순위 목록에서 숫자는 급한
 * 정도로 읽히므로 후자를 그 자리에 두면 오독된다. 미확인은 순위가 아니라 별도 영역과
 * "평가 불가" 라벨로 드러낸다.
 *
 * 사용 예:
 *   const { ranked, unavailable } = toPurchasePriority(overview.materials)
 */
export function toPurchasePriority(materials: MaterialRiskItem[]): PurchasePriority {
  const assessable = materials.filter((item) => item.grade !== null && item.score !== null)
  const unavailable = materials.filter((item) => item.grade === null || item.score === null)

  const ranked = [...assessable].sort((a, b) => {
    const severityDiff = GRADE_SEVERITY[b.grade as RiskGrade] - GRADE_SEVERITY[a.grade as RiskGrade]
    if (severityDiff !== 0) return severityDiff
    // 재고일수가 없는 자재는 비교 불가라 뒤로 보낸다(Infinity) — 0으로 두면 "재고 소진 임박"으로
    // 잘못 올라온다.
    return (a.inventory_days ?? Infinity) - (b.inventory_days ?? Infinity)
  })

  return { ranked, unavailable }
}

/** {@link toPurchasePriority} 결과. 순위가 붙는 목록과 붙지 않는 목록을 분리해 돌려준다. */
export interface PurchasePriority {
  /** 등급·점수가 있는 자재. 화면이 배열 순서대로 1위부터 번호를 붙인다. */
  ranked: MaterialRiskItem[]
  /** 평가하지 못한 자재. 순위를 붙이지 않고 목록 아래 별도 영역에 둔다. */
  unavailable: MaterialRiskItem[]
}
