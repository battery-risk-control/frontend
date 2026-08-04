import { fetchPlanningDashboardMock } from './planning.api'
import type { CumulativeRiskKpi, EnterpriseRiskSummaryItem, ExecutiveDashboardResponse, SavingsSimulation } from './types'

/** exposure_score가 이 값 이상이면 전분기 대비 "상승"으로 표기(데모용 임계값). */
const TREND_UP_THRESHOLD = 50

/**
 * 3계층 경영진 대시보드 mock 함수. enterprise_risk_summary는 2계층 fetchPlanningDashboardMock()의
 * risk_exposure_by_unit을 그대로 압축 인용해 같은 근원 데이터에서 파생한다(mock-schemas.md 확장 원칙).
 * 2026-08-03부터 2계층이 실 백엔드에 연결됐지만, 3계층은 이번 작업 범위 밖이라 계속 mock
 * 함수를 직접 참조한다(인증 토큰 없이도 동작해야 하므로 실 연동 버전은 쓸 수 없음).
 *
 * 사용 예:
 *   const dashboard = fetchExecutiveDashboard()
 */
export function fetchExecutiveDashboard(period = '2026Q3'): ExecutiveDashboardResponse {
  // Figma "경영진 대시보드" 프레임의 화면 설명 예시(이번 분기 리스크 탐지 32건, 심각 등급 5건,
  // 평균 대응 소요 2.3일)를 그대로 사용 — risk_event mock 7건으로는 "이번 분기" 규모를 대표할 수 없어 파생하지 않았다.
  const cumulative_risk_kpi: CumulativeRiskKpi = {
    detected_count: 32,
    // responded_count/response_rate는 mock-schemas.md 원래 예시값 유지 — 현재 화면에서는 사용하지 않는다.
    responded_count: 94,
    response_rate: 79.7,
    critical_count: 5,
    avg_response_days: 2.3,
  }

  // mock-schemas.md 예시값 그대로 — risk_event에는 원가/비용 필드가 없어 파생 불가.
  const savings_simulation: SavingsSimulation = {
    is_simulation: true,
    estimated_saving_krw: 320000000,
    baseline_assumption: '조기 대응 없이 최초 감지가로 구매 지속 가정',
  }

  const { risk_exposure_by_unit } = fetchPlanningDashboardMock()
  const enterprise_risk_summary: EnterpriseRiskSummaryItem[] = risk_exposure_by_unit.map((unit) => ({
    business_unit: unit.business_unit,
    exposure_score: unit.exposure_score,
    trend: unit.exposure_score >= TREND_UP_THRESHOLD ? '상승' : '유지',
  }))

  return { period, cumulative_risk_kpi, savings_simulation, enterprise_risk_summary }
}
