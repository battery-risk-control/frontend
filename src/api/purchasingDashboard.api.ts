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
    throw new Error(String((result as { message?: string }).message ?? '확인 처리에 실패했습니다.'))
  }
}

/**
 * 완료 처리 되돌리기. 그 평가가 KPI·주요 이슈 집계로 되돌아온다.
 *
 * 되돌릴 기록이 없어도 성공이다 — 결과 상태가 같기 때문이고, 백엔드가 200 + not_acknowledged로
 * 알려준다. 화면은 어느 쪽이든 목록을 다시 불러오면 되므로 응답 본문을 쓰지 않는다.
 *
 * 사용 예:
 *   await unacknowledgeAssessment(accessToken, item.assessment_id)
 */
export async function unacknowledgeAssessment(
  accessToken: string,
  assessmentId: string,
): Promise<void> {
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
 * 사용 예:
 *   const done = await fetchAcknowledgedAssessments(accessToken)
 */
export async function fetchAcknowledgedAssessments(
  accessToken: string,
  limit = 5,
): Promise<AcknowledgedItem[]> {
  const result = await fetchWithAuth<AcknowledgedItem[]>(
    `/api/v1/purchasing-dashboard/acknowledged?limit=${limit}`,
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
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
 * "평가 불가" 라벨로 드러낸다(사용자 결정, 2026-08-03).
 *
 * 백엔드 `MaterialRiskService.DISPLAY_ORDER`도 평가 불가를 맨 뒤에 두므로 이제 두 규칙이 같다 —
 * 예전에는 같은 자재가 "원자재 공급사 리스크 현황"에서는 마지막, "구매 대응 우선순위"에서는
 * 2위로 나와 한 화면 안에서 자리가 어긋났다.
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
