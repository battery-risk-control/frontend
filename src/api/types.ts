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
  /**
   * 지수 100의 기준이 된 거래일. **조회 구간(days)에 따라 달라진다** — 저장값은 프록시 종목의
   * 주가(달러/주)이지 자재의 톤당 가격이 아니라서 절대값에는 의미가 없고 "구간 시작 대비 몇 %"만
   * 뜻이 있기 때문이다. 화면이 "무엇 대비"인지 표기하려면 이 값이 필요하다.
   * mock(①단계)에서는 없을 수 있다.
   */
  base_date?: string
  /**
   * 이 자재를 조달하는 국가 목록. 화면의 "국가·지역" 필터가 쓴다.
   *
   * **국가별 가격이 아니다.** 자재당 시계열은 하나뿐이고 그 값도 대표 기업 주가 프록시라
   * 채굴국과 연결되지 않는다(글렌코어는 스위스 기업이지만 코발트는 콩고에서 캔다).
   * 그래서 이 목록은 "국가를 고르면 어느 자재 선을 남길지"를 정하는 용도다.
   * mock(①단계)에서는 없을 수 있다.
   */
  countries?: SourcingCountry[]
  points: MaterialPricePoint[]
}

export interface SourcingCountry {
  country_code: string
  country_name: string
}

/**
 * 원자재 가격 상세보기(Phase 9.3, surin RiskMonitoring 스타일 이식) 요약 카드용.
 * change_label/risk_score/grade는 실제 계산 로직이 없는 mock 임시값이다 — docs/mock-schemas.md
 * "임시 mock 값(후속 정리 필요)" 섹션 참고. 가격 자체는 이 타입에 없고, MaterialPriceSeries의
 * 마지막 포인트에서 화면이 직접 유도한다(별도 필드로 중복 저장하지 않음).
 */
export interface MaterialPriceSummary {
  material: string
  change_label: string
  risk_score: number
  grade: RiskGrade
}

/** 실시간 뉴스 속보. risk_event_id(RISK-YYYY-MMDD-NNN)에서 날짜를 추출해 최신순으로 정렬한다. */
export interface NewsFeedItem {
  risk_event_id: string
  date: string
  /** 수집 시각(UTC ISO-8601). date는 일 단위라 "3분 전" 같은 상대 표기에는 이 값을 쓴다. */
  collected_at: string
  material: string
  /**
   * 멀티에이전트(ERP·계약)까지 통과해 종합 위험도가 나온 뉴스에만 있다.
   * 수집·분석만 된 기사는 판정이 끝나지 않아 배지를 생략한다 — "정상"으로 보이면 사실과 달라진다.
   */
  grade?: RiskGrade
  /** GDELT 등 수집 소스. 화면에는 표기하지 않는다. */
  source: string
  /** 화면에 표시할 제목. 번역본이 있으면 한국어, 없으면 영문 원문이 그대로 들어온다. */
  headline: string
  /** 항상 영문 원문. 번역 여부와 무관하게 원문을 확인할 수 있다. */
  headline_original: string
  /** headline이 번역본인지. false면 영문이 그대로 표시된다. */
  translated: boolean
  confidence_label: ConfidenceLabel
  /** ISO 3166-1 alpha-2. GDELT가 국가를 특정하지 못한 기사가 많아 null인 경우가 흔하다. */
  country_code: string | null
  /** 기사 원문 링크. placeholder 데이터에는 없으므로 링크를 걸기 전에 확인이 필요하다. */
  url: string | null
}

/**
 * 비로그인 공개 대시보드 환율 밴드의 통화 한 줄 (`GET /api/v1/public/exchange-rates`).
 *
 * 표기용 문자열(`label`·`change_label`)을 백엔드가 만들어 내려주므로 화면에서 조립하지 않는다 —
 * 100단위 고시 통화(JPY·IDR·CLP·ARS·CDF)의 표기 규칙이 프론트와 백엔드로 갈라지면 어긋난다.
 */
export interface ExchangeRateItem {
  currency_code: string
  currency_name: string
  /** 고시 단위. JPY·IDR 등은 100단위 고시라 100이다(`label`에 이미 반영돼 있다). */
  unit_multiplier: number
  /** `USD/KRW`, 100단위 통화는 `JPY(100)/KRW`. */
  label: string
  rate: number
  /** 직전 고시일 대비 등락(원)·등락률(%). 비교할 직전 고시일이 없으면 null이다. */
  change_amount: number | null
  change_rate: number | null
  /** `▲ 0.22%` 형태. 비교 대상이 없으면 `—`. */
  change_label: string
  /** `KOREAEXIM`=수출입은행 직접 고시, `CROSS_USD`=USD 경유 재정환율. */
  rate_source: string
  /**
   * 재정환율이면 true. 수출입은행이 고시하지 않는 조달국 통화(칠레·아르헨티나·콩고·남아공·
   * 브라질·필리핀)를 USD를 경유해 계산한 값이라 두 소스의 스냅샷 시각이 섞여 있다.
   * 표시용이며 정산 근거로는 쓸 수 없어 화면에 근사 표시를 단다.
   */
  cross_rate: boolean
}

/**
 * 환율 밴드 전체. `rate_date`는 요청일이 아니라 **실제 고시일**이다 — 원천이 영업일 11시 전후에
 * 하루 한 번만 갱신되는 일환율이라 주말·공휴일에는 직전 영업일 날짜가 내려온다. 화면에 이
 * 날짜를 그대로 노출해 "언제 기준 환율인지"를 감추지 않는다.
 */
export interface ExchangeRateBoard {
  rate_date: string | null
  base_currency: string
  rates: ExchangeRateItem[]
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

/**
 * 구매팀 대시보드 확장(Phase 9.4, surin RiskStepGauge 이식) — 원자재 리스크 개요 5칸 그리드 중
 * 게이지 카드 3장용. `grade`는 surin의 4단계(정상/주의/경고/심각) 대신 기존 3단계 `RiskGrade`를
 * 재사용한다(경고→심각 매핑) — docs/mock-schemas.md 참고.
 */
export interface MaterialRiskGaugeItem {
  name: string
  basis: string
  grade: RiskGrade
  changeLabel?: string
}

/**
 * 구매팀 대시보드 확장(Phase 9.4) — 원자재 리스크 개요 5칸 그리드 중 점수 카드 2장용.
 * score/grade 모두 mock 임시값이다 — docs/mock-schemas.md 참고.
 */
export interface ScoreCardItem {
  label: string
  score: number
  grade: RiskGrade
  diffLabel?: string
}

export interface ImportDependencyBreakdownItem {
  label: string
  value: number
  /**
   * 도넛 조각 색. **실 API는 내려주지 않는다** — 배색은 화면의 몫이라 백엔드가 정하면
   * 디자인 토큰이 바뀔 때 서버를 고쳐야 한다. `ImportDependencyPanel`이 팔레트에서 채운다.
   */
  color?: string
  /** 실 API에만 있다. 지도 연동 등 국가 식별이 필요할 때 쓴다. */
  country_code?: string
}

/**
 * 구매팀 대시보드 확장(Phase 9.4, surin importDependency 이식) — 수입 의존도 도넛차트용.
 * **모수가 둘이다** — 목업에서 조각 합은 100인데 가운데는 82.3%로 서로 다른 기준이기 때문이다.
 *
 * - `breakdown` — **수입분 안에서의** 국가별 구성비(합 100%). 국내(KR)는 빠진다.
 * - `total` — **전체 발주 중** 수입이 차지하는 비중(%). 도넛 가운데 숫자.
 */
export interface ImportDependencyData {
  total: number
  year?: string
  /** 원화 환산에 쓴 환율 고시일. 주문마다 결제통화가 달라 환산이 필요하다. 실 API에만 있다. */
  base_date?: string
  breakdown: ImportDependencyBreakdownItem[]
}

/**
 * 1계층 "리스크 모니터링" 화면(비로그인 `/public/risk-monitoring`에도 동일 구조 반영,
 * `docs/mock-schemas.md` 참고)의 이벤트 목록 1건 (백엔드 `GET /api/v1/risk-monitoring/events`).
 *
 * **`grade`와 `confidence_label`은 다른 축이다.** grade는 "얼마나 위험한가",
 * confidence_label은 "어디까지 검증됐는가"다. 멀티에이전트(ERP·계약)를 아직 안 거친 기사도
 * 외부신호(XGBoost 트리아지 + LLM)만으로 등급을 매겨 보여주되, `multi_agent_completed`가
 * false면 화면이 잠정 배지(참고/경고)를 함께 띄운다.
 *
 * 기존 `RiskEvent`와 달리 원천이 **수집 뉴스(raw_events)** 라서 식별자가 `RISK-YYYY-...`가
 * 아니라 숫자다 — 분석이 안 붙은 기사도 목록에 나와야 하기 때문이다.
 */
export interface RiskMonitoringEvent {
  event_id: number
  /** 분석(F3)이 아직 없는 기사는 null — 화면이 등급 배지를 생략한다. */
  grade: RiskGrade | null
  confidence_label: ConfidenceLabel
  /** true면 종합 위험도 기준 확정 등급이라 잠정 배지를 숨긴다. */
  multi_agent_completed: boolean
  /** 번역본이 있으면 한국어, 없으면 원문 */
  headline: string
  headline_original: string
  translated: boolean
  material: string
  country_code: string | null
  country_name: string | null
  /** 수집 시각(UTC ISO8601) */
  collected_at: string
  source: string
}

/** severity 규칙엔진이 실제로 먹은 입력값과 결과. 분석 전 기사는 상세에서 null이다. */
export interface RiskExternalSignal {
  /** GDELT Goldstein Scale(-10~+10). 낮을수록 갈등적 사건 */
  goldstein_scale: number | null
  /** LLM 추출 tone(-1~+1). 음수일수록 부정적 */
  tone_score: number | null
  news_count: number | null
  /** 외부신호 위험 점수(0~100) */
  risk_score: number | null
  severity: string | null
  reason_codes: string[]
}

/**
 * 멀티에이전트 종합 평가(외부신호 0.35 + ERP 노출도 0.45 + 계약공백 0.20).
 *
 * **`completed`가 false면 점수를 등급으로 읽으면 안 된다** — KG 게이트에서 조기 종료된
 * 실행도 행이 남으면서 0점·NORMAL로 기록되기 때문이다. 그 경우 사유가 `risk_reasons`에 담긴다.
 */
export interface ProcurementRiskAssessment {
  assessment_id: string
  completed: boolean
  risk_level: string
  risk_score: number | null
  external_signal_score: number | null
  erp_exposure_score: number | null
  contract_gap_score: number | null
  risk_reasons: string[]
  review_passed: boolean | null
  assessed_at: string
}

/** 이벤트 상세 (`GET /api/v1/risk-monitoring/events/{eventId}`). */
export interface RiskMonitoringDetail extends RiskMonitoringEvent {
  /** LLM 추출 한국어 요약. 추출 전이면 null */
  summary: string | null
  impact_domain: string | null
  coordinates: { lat: number; lng: number } | null
  /** 기사 원문 링크. 절대 http(s)가 아니면 null이라 화면이 버튼을 숨긴다. */
  url: string | null
  external_signal: RiskExternalSignal | null
  procurement_risk: ProcurementRiskAssessment | null
  /** false면 "ERP·계약 영향 분석" 버튼을 비활성화하고 사유를 보여준다. */
  erp_impact_available: boolean
  erp_impact_blocked_reason: string | null
}

/**
 * 1계층 "원자재 위험" 화면(비로그인 `/public/materials`) 상단 KPI 4장
 * (백엔드 `GET /api/v1/material-risk/overview`).
 *
 * `assessed_material_count`는 **점수가 실제로 나온** 자재 수다. 재고·소비 데이터가 빠져
 * 평가하지 못한 자재는 여기서 빠지고 `unavailable_count`로 간다 — 평가하지 못한 것을
 * 평가한 것처럼 세면 KPI가 실제보다 커 보인다.
 */
export interface MaterialRiskSummary {
  assessed_material_count: number
  critical_count: number
  warning_count: number
  normal_count: number
  unavailable_count: number
  /** 평가된 자재의 재고일수 평균. 평가된 자재가 하나도 없으면 null */
  average_inventory_days: number | null
  /** 자재별 품질 중 가장 나쁜 값(VALID < STALE < INCOMPLETE < INVALID) */
  data_quality_status: string
  as_of: string
}

/**
 * 자재별 위험 현황 1행.
 *
 * **`grade`와 `exposure_level`은 같은 것의 두 표기다.** 화면 표기는 grade(심각/주의/정상),
 * 조건 분기는 exposure_level(CRITICAL/WARNING/NORMAL/UNKNOWN)을 쓴다 — 한국어 표기를
 * 조건문에 넣으면 표기가 바뀔 때 로직이 조용히 깨진다.
 *
 * 점수·등급은 멀티에이전트의 ERP Exposure Agent가 계산한 값이라, 같은 자재를 브리핑에서
 * 다시 봐도 같은 숫자가 나온다.
 */
export interface MaterialRiskItem {
  erp_material_id: string
  material_name: string
  /** 자재 대분류(LITHIUM/COBALT…). 브리핑이 이 값으로 관련 뉴스를 찾는다. */
  material_category: string | null
  /** 평가하지 못한 자재는 null — 화면이 등급 배지 대신 "평가 불가"를 띄운다. */
  grade: RiskGrade | null
  exposure_level: string
  /** ERP 노출도 점수(0~100). 평가하지 못했으면 null */
  score: number | null
  inventory_days: number | null
  safety_stock_days: number | null
  /** 주 공급사 의존도(0~1). 화면에서 %로 환산한다. */
  supplier_dependency_ratio: number | null
  data_quality_status: string
  /** 평가에 실패한 이유. 성공했으면 null */
  unavailable_reason: string | null
}

/** 화면 1회 로드분 — KPI와 목록이 같은 계산 결과에서 나오므로 한 응답으로 온다. */
export interface MaterialRiskOverview {
  summary: MaterialRiskSummary
  materials: MaterialRiskItem[]
}

/** 주 공급사 — 공급 비중 1순위 공급사. */
export interface MaterialPrimarySupplier {
  erp_supplier_id: string | null
  supplier_name: string | null
  supplier_status: string | null
  /** 대체 공급사 확보 상태(APPROVED/CONDITIONAL/PENDING/NONE) */
  alternative_supplier_status: string | null
  /** 해외우려기관(FEOC) 해당 여부 */
  feoc_status: string | null
}

/** 연결 계약. RAG가 아니라 ERP(supplier_materials → contracts)에서 온다. */
export interface MaterialLinkedContract {
  contract_id: number
  erp_contract_id: string | null
  contract_number: string | null
  contract_name: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
}

/** ERP 노출도 점수를 구성한 5개 세부 점수. 왜 이 등급인지 화면에서 풀어 보여줄 때 쓴다. */
export interface MaterialRiskComponents {
  gap_risk_score: number | null
  safety_stock_risk_score: number | null
  dependency_risk_score: number | null
  purchase_order_delay_risk_score: number | null
  alternative_supplier_risk_score: number | null
}

/** ERP Agent가 계약 Agent에 던지는 질문 1건. RAG 검색의 질의로 그대로 쓰인다. */
export interface MaterialContractQuestion {
  question_code: string
  question: string
}

/** 자재 상세 (`GET /api/v1/material-risk/materials/{erpMaterialId}`). */
export interface MaterialRiskDetail extends MaterialRiskItem {
  unit: string | null
  on_hand_quantity: number | null
  available_quantity: number | null
  safety_stock_quantity: number | null
  average_daily_usage: number | null
  next_inbound_date: string | null
  next_eta_days: number | null
  expected_supply_gap_days: number | null
  /** 계산에 쓰인 재고 스냅샷 시각. 이 숫자들이 언제 기준인지 화면이 판단할 수 있게 온다. */
  inventory_snapshot_at: string | null
  primary_supplier: MaterialPrimarySupplier | null
  linked_contract: MaterialLinkedContract | null
  risk_components: MaterialRiskComponents | null
  forced_critical: boolean
  contract_review_required: boolean
  contract_questions: MaterialContractQuestion[]
  warnings: string[]
  /** false면 "AI 브리핑 생성" 버튼을 비활성화하고 사유를 보여준다. */
  briefing_available: boolean
  briefing_blocked_reason: string | null
  as_of: string
}

/** 계약 RAG 검색 결과 청크 1건 (`POST .../contract-evidence`). */
export interface ContractEvidenceItem {
  document_id: string
  contract_id: number | null
  supplier_id: number | null
  material_id: number | null
  document_type: string
  chunk_index: number
  page_number: number
  content: string
  similarity_score: number
  mock_embedding: boolean
}

/** "계약 RAG 근거 보기" 응답 — 무엇을 물었고(questions) 어떤 조항이 걸렸는지(results). */
export interface ContractEvidence {
  erp_material_id: string
  linked_contract: MaterialLinkedContract | null
  questions: MaterialContractQuestion[]
  /** 실제로 ChromaDB에 넘어간 질의 문자열 */
  query: string
  results: ContractEvidenceItem[]
  /** true면 임베딩이 mock이라 유사도 점수를 신뢰하면 안 된다. */
  mock: boolean
}

/* ------------------------------------------------------------------ */
/* 1계층 구매팀 "계약 · RAG" 화면 (백엔드 `/api/v1/contract-rag/**`, 비로그인       */
/* `/public/contract-rag`에도 동일 구조 반영)                                    */
/* ------------------------------------------------------------------ */

/** 계약 요약. 계약 선택 목록과 검색 결과 카드가 같은 모양을 쓴다. */
export interface ContractSummary {
  contract_id: number
  /** 외부 ERP 계약번호(CTR-010). 화면에 크게 보이는 식별자다. */
  erp_contract_id: string | null
  contract_name: string
  status: string
  start_date: string | null
  end_date: string | null
  currency_code: string | null
  supplier_id: number | null
  erp_supplier_id: string | null
  supplier_name: string | null
  country_code: string | null
  material_id: number | null
  erp_material_id: string | null
  material_name: string | null
  material_category: string | null
  /** ChromaDB에 적재 완료된 문서 수. 0이면 검색해도 이 계약은 안 걸린다. */
  document_count: number
  indexed_chunk_count: number
}

/** 조항 카드 한 장. */
export interface ContractClauseHit {
  document_id: string
  chunk_index: number
  page_number: number
  /** "제4조 · 납기 및 지연 위약금". 청크 본문 머리에서 백엔드가 뽑아낸다. */
  clause_title: string
  /** 조항이 아닌 청크(표지·서문)면 null이다. */
  clause_no: string | null
  /** 원문 표제("DELIVERY AND PENALTY"). 한글 라벨을 입히기 전 값. */
  clause_heading: string | null
  /** 0~1. mock 임베딩이면 의미 없는 값이다(SearchResponse.mock 참고). */
  similarity_score: number
  content: string
  content_hash: string
  source: string
  contract: ContractSummary | null
}

export interface ContractClauseSearchResult {
  query: string
  /** "all"이면 전체 계약, "filtered"면 특정 계약으로 좁힌 검색이다. */
  scope: 'all' | 'filtered'
  contract_id: number | null
  result_count: number
  /** true면 임베딩이 mock이라 유사도 점수를 신뢰할 수 없다. */
  mock: boolean
  embedding_type: string | null
  embedding_version: string | null
  results: ContractClauseHit[]
}

export interface ContractDocument {
  document_id: string
  original_file_name: string
  document_type: string
  mime_type: string
  file_size_bytes: number
  processing_status: string
  chunk_count: number
  embedding_type: string | null
  embedding_version: string | null
  error_code: string | null
  error_message: string | null
  created_at: string | null
  processed_at: string | null
}

export interface ContractDetail {
  contract: ContractSummary
  documents: ContractDocument[]
  embedding_type: string | null
  embedding_version: string | null
  mock_embedding: boolean | null
  /** false면 "AI 브리핑 생성" 버튼을 비활성화하고 사유를 보여준다. */
  briefing_available: boolean
  briefing_blocked_reason: string | null
}

export interface ContractUploadResult {
  document_id: string
  contract_id: number
  original_file_name: string
  processing_status: string
  chunk_count: number
  embedding_type: string | null
  embedding_version: string | null
  /** true면 같은 내용이 이미 있어 재적재하지 않았다는 뜻이다. */
  duplicate: boolean
  mock: boolean
  processed_at: string | null
}

export interface ContractReprocessResult {
  contract_id: number
  total_count: number
  success_count: number
  failed_count: number
  documents: {
    document_id: string
    original_file_name: string
    success: boolean
    chunk_count: number
    error_code: string | null
    error_message: string | null
  }[]
}

/** 화면에서 "근거로 사용하기"로 담은 조항. */
export interface ContractEvidenceRef {
  document_id: string
  chunk_index: number
  clause_title: string
}

/* ------------------------------------------------------------------ */
/* 1계층 구매팀 "AI 브리핑" 화면 (백엔드 `/api/v1/ai-briefing/**`, 비로그인          */
/* `/public/ai-briefing`에도 동일 구조 반영)                                     */
/* ------------------------------------------------------------------ */

/** 앞선 세 화면 중 어디서 넘어왔는지. 화면 진입 쿼리스트링 `?source=`의 값이다. */
export type AiBriefingSource = 'NEWS' | 'MATERIAL' | 'CONTRACT'

/**
 * 화면 상단 "분석 대상 · ERP 연결" 프리필.
 *
 * 이 응답을 받는 것만으로는 멀티에이전트가 돌지 않는다 — 실행은 "LLM 브리핑 생성"을 눌러
 * `generateAiBriefing()`을 호출했을 때뿐이다. `generate_available`이 false면 버튼을 비활성화하고
 * `generate_blocked_reason`을 그대로 보여준다(앞 화면이 쓰던 문구와 같다).
 */
export interface AiBriefingContext {
  source_type: AiBriefingSource
  source_ref: string
  subject_title: string | null
  news_id: string | null
  analysis_id: string | null
  /** 외부신호로 쓰는 기사 제목. 자재·계약에서 넘어오면 `subject_title`과 다르다. */
  source_headline: string | null
  erp_material_id: string | null
  erp_supplier_id: string | null
  erp_contract_id: string | null
  contract_id: number | null
  material_name: string | null
  material_category: string | null
  country_code: string | null
  impact_domain: string | null
  external_signal_level: string | null
  external_signal_score: number | null
  generate_available: boolean
  generate_blocked_reason: string | null
}

/** "ERP 노출 근거" 한 줄에 들어가는 값들. 의존도만 ERP Context에서 오고 나머지는 ERP Agent 결과다. */
export interface AiBriefingErpEvidence {
  exposure_score: number | null
  exposure_level: string | null
  inventory_days: number | null
  safety_stock_days: number | null
  next_inbound_eta_days: number | null
  expected_supply_gap_days: number | null
  /** 0~1 비율. 화면은 %로 환산해 보여준다. */
  supplier_dependency_ratio: number | null
  stockout_before_eta: boolean
}

/** 우측 "분석 근거" 한 칸. 등급·점수가 없는 칸(계약 RAG)은 `note`에 "3개 조항"이 들어온다. */
export interface AiBriefingStep {
  label: string
  level: string | null
  score: number | null
  note: string | null
}

/** 우측 "분석 근거" 4칸: 외부 이벤트 → ERP 노출 → 계약 RAG → 최종 위험. */
export interface AiBriefingEvidenceChain {
  external_signal: AiBriefingStep
  erp_exposure: AiBriefingStep
  contract_rag: AiBriefingStep
  final_risk: AiBriefingStep
}

/** 하단 "검증 메타데이터". reviewer 노드 결과와 재현에 필요한 버전 정보. */
export interface AiBriefingVerification {
  review_passed: boolean | null
  llm_used: boolean
  llm_error: string | null
  warning_count: number
  warnings: string[]
  contract_id: number | null
  contract_page: number | null
  weight_version: string | null
  mock: boolean
}

/**
 * 브리핑 상세. "LLM 브리핑 생성" 응답과 "브리핑 상세 보기" 응답이 같은 타입이다.
 *
 * `composite`가 false면 KG 게이트에서 조기 종료된 실행이라 점수가 항상 0·정상이다 —
 * "평가해보니 정상"이 아니라 **"평가하지 못했다"**는 뜻이라 등급으로 읽으면 안 된다.
 */
export interface AiBriefingDetail {
  briefing_id: string
  assessment_id: string | null
  source_type: AiBriefingSource
  source_ref: string
  subject_title: string | null
  news_id: string
  analysis_id: string | null
  source_headline: string | null
  erp_material_id: string | null
  erp_supplier_id: string | null
  erp_contract_id: string | null
  contract_id: number | null
  material_name: string | null
  material_category: string | null
  impact_domain: string | null
  composite: boolean
  procurement_risk_level: string
  procurement_risk_score: number
  briefing: string | null
  risk_reasons: string[]
  recommended_actions: string[]
  erp_evidence: AiBriefingErpEvidence | null
  contract_findings: Record<string, unknown>[]
  evidence_chain: AiBriefingEvidenceChain
  verification: AiBriefingVerification
  created_at: string
}

/** 우측 하단 "최근 브리핑" 카드 1장. 본문·근거는 오지 않는다 — 상세는 따로 조회한다. */
export interface AiBriefingListItem {
  briefing_id: string
  source_type: AiBriefingSource
  subject_title: string | null
  news_id: string
  procurement_risk_level: string
  procurement_risk_score: number
  composite: boolean
  review_passed: boolean | null
  created_at: string
}
