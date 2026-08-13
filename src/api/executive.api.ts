import {
  fetchAiBriefingSummaryDashboard,
  fetchImportDependencyDashboard,
  fetchMaterialRiskDashboard,
  fetchSupplierAnalysisDashboard,
} from './planning.api'
import { fetchPublicRiskBoard } from './public.api'
import { fetchWithAuth, type FetchJsonError } from './http'
import type {
  ExecutiveKpi,
  ExecutiveOverviewResponse,
  ExecutiveRiskTrendPoint,
  ExecutiveVerificationSummary,
} from './executive.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/**
 * 3계층 경영진 대시보드 mock. 새 데이터를 지어내지 않고 1·2계층이 이미 쓰는 mock 함수들을
 * 그대로 호출해 파생시킨다(mock-schemas.md 확장 원칙) — 아래 함수들은 `VITE_API_BASE_URL`이
 * 없으면 네트워크를 타지 않고 mock을 반환하므로 토큰은 빈 문자열이어도 안전하다.
 */
async function fetchExecutiveOverviewMock(): Promise<ExecutiveOverviewResponse> {
  const [riskMap, material, dependency, supplier, briefing] = await Promise.all([
    fetchPublicRiskBoard(),
    fetchMaterialRiskDashboard(''),
    fetchImportDependencyDashboard(''),
    fetchSupplierAnalysisDashboard(''),
    fetchAiBriefingSummaryDashboard(''),
  ])

  const criticalCount = riskMap.filter((item) => item.grade === '심각').length
  const warningCount = riskMap.filter((item) => item.grade === '주의').length
  const averageRiskScore =
    material.ranking.length === 0
      ? 0
      : Math.round(
          (material.ranking.reduce((sum, item) => sum + item.score, 0) / material.ranking.length) * 10,
        ) / 10

  const kpi: ExecutiveKpi = {
    critical_count: criticalCount,
    warning_count: warningCount,
    average_risk_score: averageRiskScore,
    verified_briefing_count: briefing.recent.length,
    // 검증 요약과 같은 근원을 쓴다 — 심각 등급 브리핑을 재검토 대상으로 간주(mock 한정 규칙).
    review_required_count: briefing.recent.filter((item) => item.grade === '심각').length,
    latest_assessed_at: new Date().toISOString(),
  }

  // 최근 14일 추세. 오늘의 등급 분포를 기준으로 과거로 갈수록 완만히 줄어드는 모양만 만든다
  // — mock에는 일별 이력이 없어 이 이상 정교하게 지어내지 않는다.
  const risk_trend: ExecutiveRiskTrendPoint[] = Array.from({ length: 14 }, (_, index) => {
    const daysAgo = 13 - index
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const decay = daysAgo / 26
    return {
      date: date.toISOString().slice(0, 10),
      average_risk_score: Math.round(averageRiskScore * (1 - decay) * 10) / 10,
      critical_count: Math.max(0, criticalCount - Math.round(decay * criticalCount * 2)),
      warning_count: Math.max(0, warningCount - Math.round(decay * warningCount * 2)),
    }
  })

  const verification_summary: ExecutiveVerificationSummary = {
    total_count: briefing.recent.length,
    passed_count: briefing.recent.length - kpi.review_required_count,
    review_required_count: kpi.review_required_count,
    // mock 브리핑에는 근거 필드가 없어 결측 사유별 건수는 0으로 둔다 — 화면이 "누락 없음"으로 읽는다.
    erp_evidence_missing_count: 0,
    contract_evidence_missing_count: 0,
    llm_warning_count: 0,
  }

  return {
    kpi,
    risk_map: riskMap,
    top_risks: material.ranking,
    risk_trend,
    country_dependency: dependency.by_country,
    supplier_risks: supplier.ranking,
    alternative_suppliers: dependency.alternative_suppliers,
    recent_briefings: briefing.recent,
    verification_summary,
    // mock에는 실제 수집 뉴스가 없어 데모용으로 현재 시각을 쓴다 — 실 백엔드는 MAX(collected_at)를 내려준다.
    as_of: new Date().toISOString(),
  }
}

/**
 * Spring Boot의 실제 3계층 경영진 대시보드 API를 호출한다.
 * `VITE_API_BASE_URL`이 없으면(①단계 데모) 1·2계층과 동일하게 mock으로 동작한다.
 *
 * 성공하면 ExecutiveOverviewResponse를 반환하고,
 * 실패하면 공통 FetchJsonError를 반환한다.
 */
export async function fetchExecutiveOverview(
  accessToken: string,
): Promise<ExecutiveOverviewResponse | FetchJsonError> {
  if (!API_BASE_URL) return fetchExecutiveOverviewMock()
  return fetchWithAuth<ExecutiveOverviewResponse>(
    '/api/v1/executive/dashboard',
    accessToken,
  )
}
