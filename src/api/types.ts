import type { ConfidenceLabel } from '../components/ui/ConfidenceBadge'
import type { RiskGrade } from '../components/ui/RiskGradeBadge'

export type { ConfidenceLabel, RiskGrade }

export interface MarketContext {
  source: string
  material: string
  event_summary: string
  /** ISO 3166-1 alpha-2. 국가 특정이 불가능한 이벤트는 생략 가능 */
  country_code?: string
  /** 한글 표기. 국가 특정이 불가능한 이벤트는 생략 가능 */
  country_name?: string
  /** 국가 특정이 불가능한 이벤트는 생략 가능 */
  coordinates?: { lat: number; lng: number }
}

export interface ErpView {
  safety_stock_days: number
  affected_material_code: string
  alt_sourcing_candidates: string[]
}

export interface QualityCheck {
  status: 'pass' | 'fail'
  criteria: string[]
  reason: string
}

export interface RagView {
  contract_clause_summary: string
  negotiation_points: string[]
}

export interface OutputArtifacts {
  render_mode: 'json'
  file_url: string | null
  fallback_to_json: boolean
}

/** CLAUDE.md "API Mock 응답 구조" 원본 risk_event 스키마. */
export interface RiskEvent {
  risk_event_id: string
  grade: RiskGrade
  confidence_label: ConfidenceLabel
  market_context: MarketContext
  erp_view: ErpView
  quality_check: QualityCheck
  rag_view: RagView
  output_artifacts: OutputArtifacts
}

/**
 * 1계층 브리핑 자료 열람(Seq 24). risk_event의 rag_view/output_artifacts만 추출한 상세 조회 응답 —
 * 화면에 등급·신뢰도 배지를 표시하기 위해 material/grade/confidence_label도 함께 내려준다.
 */
export interface RiskEventBriefing {
  risk_event_id: string
  material: string
  grade: RiskGrade
  confidence_label: ConfidenceLabel
  rag_view: RagView
  output_artifacts: OutputArtifacts
}

/** mock-schemas.md "인증" — 3계층(구매팀/경영기획팀/경영진) 값 집합. */
export type OrgTier = 'purchasing' | 'planning' | 'executive'

export interface LoginRequest {
  email: string
  password: string
}

/** LoginForm이 다루는 값. rememberMe는 UI 로컬 상태이며 로그인 요청 스키마에는 없다. */
export interface LoginFormValues extends LoginRequest {
  rememberMe: boolean
}

export interface LoginSuccessResponse {
  access_token: string
  org_tier: OrgTier
  status: 'APPROVED'
}

export interface LoginPendingErrorResponse {
  error: 'PENDING_APPROVAL'
  message: string
}

export type LoginResponse = LoginSuccessResponse | LoginPendingErrorResponse

/** SignupForm이 다루는 값. Figma 와이어프레임 회원가입 폼 필드(임직원 성명 포함) 기준. */
export interface SignupFormValues {
  name: string
  email: string
  password: string
  org_tier: OrgTier
}

/**
 * mock-schemas.md 제안 스키마 원본. 소속 회사명(org_name)은 Figma 와이어프레임 폼에는
 * 없는 필드라 api 계층에서 고정값으로 채운다 — SignupFormValues와의 차이는 그 때문.
 */
export interface SignupRequest extends SignupFormValues {
  org_name: string
}

export interface SignupResponse {
  user_id: string
  status: 'PENDING'
  message: string
}

/**
 * 비로그인 공개 대시보드(Seq 23) — 글로벌 리스크 관제 맵. Seq 20에 따라 confidence_label도 항상 함께 표시한다.
 * country_code/coordinates는 market_context와 동일하게 국가 특정 불가 시 생략 가능(optional) — 지도 마커 표시용.
 */
export interface GlobalRiskBoardItem {
  risk_event_id: string
  material: string
  grade: RiskGrade
  confidence_label: ConfidenceLabel
  event_summary: string
  country_code?: string
  country_name?: string
  coordinates?: { lat: number; lng: number }
}

/** AI 기반 권고 조치 리스트. 공개 화면이므로 ERP 내부 상세(재고일수, 공급사명)는 노출하지 않는다. */
export interface AiRecommendation {
  risk_event_id: string
  material: string
  grade: RiskGrade
  confidence_label: ConfidenceLabel
  recommendation: string
}

export interface MaterialPricePoint {
  date: string
  price_index: number
}

/** risk_event에는 가격 필드가 없어, 대상 자재만 market_context에서 가져오고 지수는 데모용으로 합성했다. */
export interface MaterialPriceSeries {
  material: string
  unit: string
  points: MaterialPricePoint[]
}

/** 실시간 뉴스 속보. risk_event_id(RISK-YYYY-MMDD-NNN)에서 날짜를 추출해 최신순으로 정렬한다. */
export interface NewsFeedItem {
  risk_event_id: string
  date: string
  material: string
  source: string
  headline: string
  confidence_label: ConfidenceLabel
}

/** 2계층 경영기획팀 대시보드 — mock-schemas.md "2. 2계층" 참고. */
export interface KpiSummaryItem {
  label: string
  value: number
  unit: string
}

/** risk_event에는 사업부(business_unit) 필드가 없어 자재→사업부 매핑을 가정해 파생한다(코드 주석 참고). */
export interface RiskExposureByUnit {
  business_unit: string
  exposure_score: number
}

export interface VendorRiskHistoryItem {
  vendor_id: string
  vendor_name: string
  risk_count_90d: number
  latest_grade: RiskGrade
  confidence_label: ConfidenceLabel
}

export interface PlanningDashboardResponse {
  business_unit: string
  period: string
  kpi_summary: KpiSummaryItem[]
  risk_exposure_by_unit: RiskExposureByUnit[]
  vendor_risk_history: VendorRiskHistoryItem[]
}

/**
 * 3계층 경영진 대시보드 — mock-schemas.md "3. 3계층" 참고.
 * critical_count/avg_response_days는 Figma "경영진 대시보드" 프레임의 화면 설명 예시
 * ("이번 분기 리스크 탐지 32건, 심각 등급 5건, 평균 대응 소요 2.3일")에 맞춰 확장 원칙에 따라 추가했다.
 */
export interface CumulativeRiskKpi {
  detected_count: number
  responded_count: number
  response_rate: number
  critical_count: number
  avg_response_days: number
}

/** is_simulation은 항상 true로 고정 — product-overview.md 비예측 원칙에 따라 화면 표기를 강제하기 위한 필드. */
export interface SavingsSimulation {
  is_simulation: true
  estimated_saving_krw: number
  baseline_assumption: string
}

export interface EnterpriseRiskSummaryItem {
  business_unit: string
  exposure_score: number
  trend: '상승' | '유지' | '하락'
}

export interface ExecutiveDashboardResponse {
  period: string
  cumulative_risk_kpi: CumulativeRiskKpi
  savings_simulation: SavingsSimulation
  enterprise_risk_summary: EnterpriseRiskSummaryItem[]
}
