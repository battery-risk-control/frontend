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
 * 1계층 구매팀 **대시보드** 화면 API 클라이언트.
 *
 * 이 화면이 쓰는 데이터는 두 갈래다.
 *
 * - **공개 API 6종**(`public.api.ts`) — 환율·가격추이·수입의존도·위험지도·뉴스속보·마퀴.
 *   비로그인 대시보드가 쓰는 것과 **같은 엔드포인트를 그대로 재사용**한다.
 *   `/api/v1/public/**`는 `SecurityConfig`에서 permitAll이고 `JwtAuthenticationFilter`는
 *   토큰이 유효할 때 SecurityContext를 채우기만 할 뿐 거부하지 않으므로, 로그인 상태로
 *   호출해도 동일한 응답이 온다. 두 화면이 같은 숫자를 보여야 하는데 조회 경로를 둘로
 *   나누면 어느 쪽이 맞는지 알 수 없게 되므로 일부러 하나만 둔다.
 * - **인증 API**(이 파일 + `materialRisk.api.ts` + `riskMonitoring.api.ts`) — 공개 API가
 *   의도적으로 뺀 ERP 내부값(재고일수·공급사 의존도·자재코드)과 KPI 집계.
 *   공개 subset으로는 하단 패널(공급사 리스크 현황·ERP 영향·대응 우선순위)을 채울 수 없다.
 *
 * `riskMonitoring.api.ts`·`materialRisk.api.ts`와 같은 방침으로 **mock 폴백이 없다.**
 * 이 화면의 숫자는 우리 ERP·평가 결과라서, 지어낸 값을 띄우면 "우리 상태가 이렇다"는 잘못된
 * 인상을 준다 — 백엔드가 없으면 빈 값과 안내 문구를 보여주는 편이 정확하다.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/** `VITE_API_BASE_URL`이 없으면 실 API를 부를 수 없다 — 화면이 안내 문구를 띄우도록 알린다. */
export function isPurchasingDashboardApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

/**
 * 상단 KPI 5칸(심각·주의 건수, ERP 영향도, 외부 위험, 검증 브리핑).
 *
 * 경로가 `/api/v1/dashboard/procurement-risk-summary`에서 옮겨왔다 — 나머지 1계층 화면 API가
 * 화면 단위 이름을 갖는데(`/risk-monitoring/**`·`/material-risk/**`·`/ai-briefing/**`)
 * 이것만 계층 구분 없는 `/dashboard/**` 아래 있었다. 백엔드가 구 경로도 함께 매핑해 둬서
 * 기존 호출은 그대로 동작한다.
 *
 * 사용 예:
 *   const kpi = await fetchPurchasingKpiSummary(accessToken)
 */
export async function fetchPurchasingKpiSummary(accessToken: string): Promise<PurchasingKpiSummary> {
  const result = await fetchWithAuth<PurchasingKpiSummary>(
    '/api/v1/purchasing-dashboard/kpi-summary',
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 원자재별 리스크 점수 7종(최종 합성 점수 기준).
 *
 * 평가가 없는 자재도 행이 오므로 화면이 7줄을 항상 같은 자리에 그린다 — 목록을 프론트에서
 * 만들지 않는 이유는, 자재를 추가할 때 백엔드와 화면 두 곳을 고쳐야 하는 상태를 만들지
 * 않기 위해서다.
 *
 * 사용 예:
 *   const summary = await fetchMaterialRiskSummary(accessToken)
 */
export async function fetchMaterialRiskSummary(
  accessToken: string,
): Promise<MaterialRiskSummaryItem[]> {
  const result = await fetchWithAuth<MaterialRiskSummaryItem[]>(
    '/api/v1/purchasing-dashboard/material-risk-summary',
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 공급사 현황 + 대체 공급사 추천.
 *
 * 사용 예:
 *   const overview = await fetchSupplierOverview(accessToken)
 */
export async function fetchSupplierOverview(accessToken: string): Promise<SupplierOverview> {
  const result = await fetchWithAuth<SupplierOverview>(
    '/api/v1/purchasing-dashboard/supplier-overview',
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 평가 1건을 완료 처리한다. 성공하면 그 평가가 KPI 심각/주의 집계에서 빠지고, 같은 자재에
 * 새 평가가 들어오면 자동으로 다시 잡힌다.
 *
 * **원본 행을 지우지 않는다.** 백엔드가 별도 로그 테이블에만 남기므로
 * (`procurement_risk_acknowledgements`, append-only), 되돌리려면 그 로그를 지우면 된다.
 *
 * 사용 예:
 *   await acknowledgeAssessment(accessToken, item.latest_assessment_id)
 */
export async function acknowledgeAssessment(
  accessToken: string,
  assessmentId: string,
): Promise<void> {
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
 * 자재별 위험 목록(`/material-risk/overview`)에서 게이지 카드 3장을 고른다.
 *
 * **평가하지 못한 자재(`grade === null`)는 제외한다.** 게이지는 등급이 있어야 그려지는데,
 * 재고 데이터가 없어 평가가 안 된 자재를 '정상'으로 채우면 "확인해보니 괜찮다"로 읽힌다 —
 * 실제로는 확인하지 못한 것이다. 그런 자재는 `MaterialRiskStatusPanel`이 "평가 불가"로 따로 보여준다.
 *
 * 기존 mock에는 `changeLabel`("전일 대비 ▲ 4")이 있었지만 채우지 않는다. `/material-risk/overview`는
 * 현재 스냅샷만 주고 전일 점수를 주지 않아, 비교 대상 없이 만들면 화면에만 존재하는 숫자가 된다.
 *
 * 사용 예:
 *   const gauges = toMaterialRiskGauges(overview.materials)
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
 * KPI 요약에서 점수 카드 2장(외부 리스크 종합 / ERP 영향)을 만든다.
 *
 * 평가가 0건이면 백엔드가 평균을 null로 주므로 카드 자체를 만들지 않는다 — 0점 카드를 띄우면
 * "위험이 없다"로 읽히는데 실제로는 "아직 평가하지 않았다"이기 때문이다.
 *
 * `grade`는 채우지 않는다(`ScoreCardItem.grade` 주석 참고) — 이 두 점수를 등급으로 나누는
 * 임계값이 백엔드에 없다.
 *
 * 사용 예:
 *   const cards = toScoreCards(kpi)
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
 * 구매 대응 우선순위 정렬. 별도 우선순위 스키마가 없으므로 자재별 위험 목록에서 파생한다 —
 * 등급(심각 > 주의 > 정상) → 재고일수(적을수록 긴급) 순.
 *
 * **평가하지 못한 자재를 맨 뒤로 보내지 않는다.** 등급이 없는 자재는 "안전해서 없는" 게 아니라
 * "확인하지 못한" 것이라 오히려 손이 필요하다. 심각 바로 다음(주의보다 앞)에 세워
 * 담당자 눈에 들어오게 한다.
 *
 * 사용 예:
 *   const ranked = toPurchasePriority(overview.materials)
 */
export function toPurchasePriority(materials: MaterialRiskItem[]): MaterialRiskItem[] {
  return [...materials].sort((a, b) => {
    const severityDiff = priorityRank(b) - priorityRank(a)
    if (severityDiff !== 0) return severityDiff
    // 재고일수가 없는 자재는 비교 불가라 뒤로 보낸다(Infinity) — 0으로 두면 "재고 소진 임박"으로
    // 잘못 올라온다.
    return (a.inventory_days ?? Infinity) - (b.inventory_days ?? Infinity)
  })
}

/** 심각(3) > 평가 불가(2.5) > 주의(2) > 정상(1). 평가 불가를 주의보다 앞에 두는 이유는 위 주석 참고. */
function priorityRank(material: MaterialRiskItem): number {
  if (material.grade === null) return 2.5
  return GRADE_SEVERITY[material.grade]
}
