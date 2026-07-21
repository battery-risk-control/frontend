import { fetchRiskEvents } from './purchasing.api'
import { parseRiskEventDate } from '../lib/riskEventId'
import type {
  KpiSummaryItem,
  PlanningDashboardResponse,
  RiskExposureByUnit,
  RiskGrade,
  VendorRiskHistoryItem,
} from './types'

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
 * 2계층 경영기획팀 대시보드 mock 함수. purchasing.api.ts의 risk_event mock 배열에서
 * risk_exposure_by_unit·vendor_risk_history를 파생시켜 같은 근원 데이터를 재사용한다.
 *
 * 사용 예:
 *   const dashboard = fetchPlanningDashboard()
 */
export function fetchPlanningDashboard(
  businessUnit = '전체',
  period = '2026Q3',
): PlanningDashboardResponse {
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

  return { business_unit: businessUnit, period, kpi_summary, risk_exposure_by_unit, vendor_risk_history }
}
