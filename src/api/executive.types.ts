import type {
  BriefingSummaryItem,
  CountryDependencyItem,
  EntityBadgeItem,
  GlobalRiskBoardItem,
  MaterialRiskRankItem,
  SupplierRiskRankItem,
} from './types'

/** 3계층 경영진 대시보드 상단 KPI. */
export interface ExecutiveKpi {
  critical_count: number
  warning_count: number
  average_risk_score: number
  verified_briefing_count: number
  review_required_count: number
  latest_assessed_at: string | null
}

/** 최근 30일 멀티에이전트 구매 위험 점수 추세. */
export interface ExecutiveRiskTrendPoint {
  date: string
  average_risk_score: number
  critical_count: number
  warning_count: number
}

/** 멀티에이전트 검증 결과와 근거 완전성 요약. */
export interface ExecutiveVerificationSummary {
  total_count: number
  passed_count: number
  review_required_count: number
  erp_evidence_missing_count: number
  contract_evidence_missing_count: number
  llm_warning_count: number
}

/**
 * Spring GET /api/v1/executive/dashboard에서 반환하는
 * 실제 3계층 경영진 대시보드 응답.
 */
export interface ExecutiveOverviewResponse {
  kpi: ExecutiveKpi
  risk_map: GlobalRiskBoardItem[]
  top_risks: MaterialRiskRankItem[]
  risk_trend: ExecutiveRiskTrendPoint[]
  country_dependency: CountryDependencyItem[]
  supplier_risks: SupplierRiskRankItem[]
  alternative_suppliers: EntityBadgeItem[]
  recent_briefings: BriefingSummaryItem[]
  verification_summary: ExecutiveVerificationSummary
  /** 기준 시각 칩 — 최신 공급망 뉴스 수집 시각(MAX collected_at). 경영기획 as_of와 같은 소스. */
  as_of: string | null
}