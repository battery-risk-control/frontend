import { fetchPlanningDashboard } from './planning.api'
import {
  fetchWithAuth,
  type FetchJsonError,
} from './http'
import type {
  CumulativeRiskKpi,
  EnterpriseRiskSummaryItem,
  ExecutiveDashboardResponse,
  SavingsSimulation,
} from './types'
import type {
  ExecutiveOverviewResponse,
} from './executive.types'

/**
 * 기존 mock 화면에서 사업부 위험 추세를 표시하기 위한
 * 데모용 임계값.
 */
const TREND_UP_THRESHOLD = 50

/**
 * 기존 3계층 mock 대시보드 함수.
 *
 * 새 실제 화면으로 교체하는 동안 기존 화면이 깨지지 않도록
 * 임시로 유지한다.
 */
export function fetchExecutiveDashboard(
  period = '2026Q3',
): ExecutiveDashboardResponse {
  const cumulative_risk_kpi: CumulativeRiskKpi = {
    detected_count: 32,
    responded_count: 94,
    response_rate: 79.7,
    critical_count: 5,
    avg_response_days: 2.3,
  }

  const savings_simulation: SavingsSimulation = {
    is_simulation: true,
    estimated_saving_krw: 320000000,
    baseline_assumption:
      '조기 대응 없이 최초 감지가로 구매 지속 가정',
  }

  const {
    risk_exposure_by_unit,
  } = fetchPlanningDashboard(
    undefined,
    period,
  )

  const enterprise_risk_summary:
    EnterpriseRiskSummaryItem[] =
    risk_exposure_by_unit.map((unit) => ({
      business_unit: unit.business_unit,
      exposure_score: unit.exposure_score,
      trend:
        unit.exposure_score >= TREND_UP_THRESHOLD
          ? '상승'
          : '유지',
    }))

  return {
    period,
    cumulative_risk_kpi,
    savings_simulation,
    enterprise_risk_summary,
  }
}

/**
 * Spring Boot의 실제 3계층 경영진 대시보드 API를 호출한다.
 *
 * 성공하면 ExecutiveOverviewResponse를 반환하고,
 * 실패하면 공통 FetchJsonError를 반환한다.
 */
export async function fetchExecutiveOverview(
  accessToken: string,
): Promise<
  ExecutiveOverviewResponse | FetchJsonError
> {
  return fetchWithAuth<ExecutiveOverviewResponse>(
    '/api/v1/executive/dashboard',
    accessToken,
  )
}