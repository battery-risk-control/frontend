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

/**
 * 인증 계층. 3계층(구매팀/경영기획팀/경영진)에 더해 가입 승인 전용 관리자(admin)를 포함한다.
 * admin은 대시보드 계층이 아니라 /admin(가입 승인 화면)으로만 라우팅된다.
 */
export type OrgTier = 'purchasing' | 'planning' | 'executive' | 'admin'

export interface LoginRequest {
  email: string
  password: string
}

/**
 * LoginForm이 다루는 값. rememberMe는 UI 로컬 상태이며 로그인 요청 스키마에는 없다.
 * captcha 필드는 로그인 실패가 누적된 계정에서만 채워진다(평소 미전송).
 */
export interface LoginFormValues extends LoginRequest {
  rememberMe: boolean
  captchaId?: string
  captchaAnswer?: string
}

export interface LoginSuccessResponse {
  access_token: string
  /** access token 만료까지 남은 초. mock에는 없어 optional. refresh_token은 HttpOnly 쿠키라 body에 없다. */
  expires_in?: number
  org_tier: OrgTier
  status: 'APPROVED'
}

export interface LoginPendingErrorResponse {
  error: 'PENDING_APPROVAL'
  message: string
}

export type LoginResponse = LoginSuccessResponse | LoginPendingErrorResponse

/**
 * SignupForm이 다루는 값. 임직원 성명·회사 이메일·비밀번호·계층에 더해
 * 개인정보 수집·이용 동의(필수/선택)를 포함한다(규제 가이드 ①).
 * org_tier는 가입 폼에서 admin을 선택할 수 없으므로 3계층으로 좁힌다.
 */
export interface SignupFormValues {
  name: string
  email: string
  password: string
  org_tier: Exclude<OrgTier, 'admin'>
  privacy_required_consent: boolean
  marketing_optional_consent: boolean
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
  /**
   * 기사 원문 링크. 백엔드가 절대 http(s)가 아닌 값을 null로 바꿔 보내므로 존재 여부만 본다.
   * 실데이터가 0건이라 placeholder로 폴백한 항목에는 없다(지어낸 링크를 만들지 않는다).
   */
  source_url?: string | null
  /** 분석 생성 시각(ISO). placeholder 폴백 항목에는 없다. */
  collected_at?: string | null
}

/**
 * 구매팀 대시보드 우측 "뉴스 상세" 탭이 보여주는 선택 항목.
 *
 * **두 곳에서 선택된다** — 아래 "최신 뉴스" 목록(`NewsFeedItem`)과 글로벌 위험 지도의 마커
 * (`GlobalRiskBoardItem`). 둘은 원천이 달라(`raw_events` vs `analyses`) 필드가 겹치지 않고,
 * 실측상 `risk_event_id`도 서로 만나지 않는다(2026-08-03 기준 교집합 0건) — 지도는
 * `material_category`·`severity`·국가가 모두 있는 분석만, 뉴스는 자재가 매칭된 수집 원본만
 * 올라오기 때문이다. 그래서 한쪽을 다른 쪽으로 찾아 맞추지 못하고 이 공통 모양으로 모은다.
 *
 * 지도에서 온 항목에는 `headline_original`이 없다(공개 지도 응답에 번역 전 원문이 없다).
 * `collected_at`·`url`은 2026-08-03에 지도 응답(`RiskBoardItem`)에도 추가해서 이제 양쪽 다
 * 채워진다 — 그전에는 "최신 뉴스"에서 고르면 "기사 원문 열기"가 뜨는데 지도 마커로 고르면
 * 안 뜨는 차이가 났다. 다만 실데이터 0건일 때의 placeholder 폴백에는 여전히 없다.
 *
 * 화면은 있는 것만 렌더한다 — 없는 값을 지어내면 "원문 링크가 있는 줄 알았는데 없는" 상태가 된다.
 */
export interface SelectedArticle {
  /** 뉴스는 `risk_event_id`, 지도는 `risk_event_id`. 목록의 선택 표시에 쓴다. */
  id: string
  /**
   * 수집 이벤트 id. 뉴스에서 고른 항목에만 있다(지도 응답에는 이 값이 없다).
   * "이 기사로 브리핑 생성"과 리스크 모니터링 사전 선택이 요구하는 값이다.
   */
  event_id?: number | null
  /** 어디서 골랐는지. 화면이 "선택 기사"와 "지도에서 선택"을 구분해 표기한다. */
  origin: 'NEWS' | 'MAP'
  headline: string
  material: string
  grade?: RiskGrade
  confidence_label: ConfidenceLabel
  country_code: string | null
  country_name?: string | null
  /** 뉴스에서 온 항목만 있다 */
  collected_at?: string
  headline_original?: string
  /** 분석이 만든 한국어 요약. 상세에서 영문 원문 대신 보여준다. 없으면 원문으로 폴백. */
  summary?: string | null
  translated?: boolean
  url?: string | null
}

/**
 * 구매팀 대시보드 우측 "주요 알림" 한 줄.
 *
 * **두 원천이 한 목록에 섞인다.**
 * - 뉴스(`RiskMonitoringEvent`) — 멀티에이전트까지 끝나 종합 위험도가 나온 건 중 심각·주의만.
 *   외부신호 점수만 있는 잠정 등급은 올리지 않는다("판정이 끝났다"고 오해할 여지를 만들지 않는다).
 * - 가격(`MaterialPriceSummary`) — 변동성이 높은 자재를 `정보`로. 위험 판정이 아니라 참고 지표다.
 *
 * `정보`는 `RiskGrade`(심각/주의/정상)에 없는 값이라 등급 배지를 재사용하지 않고 별도 표기한다 —
 * 가격 변동성은 공급 위험 등급과 축이 달라 같은 배지로 그리면 3단계 등급 중 하나로 읽힌다.
 */
export interface DashboardAlert {
  id: string
  level: '심각' | '주의' | '정보'
  /**
   * 뉴스는 `08-03 00:51`(현지, 24시간), 가격은 `07-31`(거래일까지).
   *
   * 원천마다 정밀도가 달라 문자열로 굳혀 넘긴다 — 가격은 일봉이라 시각 자체가 없고,
   * 없는 값을 `00:00`으로 채우면 그 시각에 무슨 일이 있었던 것처럼 읽힌다.
   */
  timeLabel: string
  title: string
  /** 제목 아래 회색 보조 줄. 자재·국가나 등락·변동성처럼 "왜 떴는지"를 적는다. */
  detail: string
  /** 클릭 시 이동할 화면 */
  href: string
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
  /** 거래일. 일봉이라 날짜까지만 있다. */
  date: string
  price_index: number
  /**
   * 이 행을 마지막으로 적재한 시각(ISO). 화면이 "언제 갱신된 값인가"를 표시할 때 쓴다 —
   * 거래일에 00:00을 붙이면 실제 수집 시각이 아닌 값을 지어내게 된다.
   * 이 필드가 추가되기 전 응답에는 없으므로 optional이다.
   */
  updated_at?: string
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

/**
 * 실시간 뉴스 속보. risk_event_id(RISK-YYYY-MMDD-NNN)에서 날짜를 추출해 최신순으로 정렬한다.
 *
 * `source`(데이터 출처 계층, 예: 'data_ingestion_layer')와 `publisher`(보도 언론사 도메인)는
 * 서로 다른 개념이다 — `source`는 CLAUDE.md 원 `risk_event.market_context.source` 스키마
 * 그대로(의미 불변, 화면에는 더 이상 노출하지 않음), `publisher`는 "데이터_활용_및_모델_학습_
 * 기획정의서" 1단계에 명시된 GDELT 메타데이터의 `domain` 필드(기사 게재 언론사 도메인)를
 * 반영한 신규 필드다(2026-07-29) — 새로운 개념이 아니라 원래 파이프라인에 있던 값을 그제야
 * 스키마에 반영한 것.
 */
export interface NewsFeedItem {
  risk_event_id: string
  /**
   * 수집 이벤트 id(`raw_events.id`). `risk_event_id`는 분석이 붙으면 UUID, 아니면 `RAW-{id}`라
   * 분석이 붙은 기사에서는 이 숫자를 되찾을 수 없었다 — 그래서 "이 기사로 브리핑 생성"과
   * 리스크 모니터링 사전 선택(`?eventId=`)이 동작하지 않았다.
   * 수집 원본이 없는 placeholder 폴백 항목에는 없다.
   */
  event_id?: number | null
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
  /** 분석이 만든 한국어 요약(analyses.summary_kr). 없으면 null. 상세에서 원문 대신 보여준다. */
  summary_kr: string | null
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
  /** 마지막 위험분석 실행 시각(기준 시각 칩). 경영진 `latest_assessed_at`과 같은 근원(MAX assessed_at). */
  as_of: string | null
}

/**
 * 2계층 사이드바 7탭 확장(전략 대시보드 외 6탭). `RankedBarChart`/`EntityBadgeList` 공용
 * 컴포넌트 입력 타입 + 탭별 응답 타입 — mock-schemas.md "1. 2계층" 갱신본 참고.
 */

/** RankedBarChart 공용 입력 항목 — "이름+막대+값" 패턴(자재 순위/국가 의존도/공급사 랭킹 등)에 재사용. */
export interface RankedBarItem {
  name: string
  value: number
  value_suffix?: string
  tone?: 'critical' | 'warning' | 'normal' | 'neutral' | 'reference'
}

/** EntityBadgeList 공용 입력 항목 — 공급사/계약/브리핑 리스트에 재사용(VendorRiskHistory 패턴 일반화). */
export interface EntityBadgeItem {
  id: string
  primary: string
  secondary?: string
  badge?: { label: string; tone: 'success' | 'warning' | 'neutral' }
}

/** 자재 위험 탭. */
export interface MaterialRiskRankItem {
  material: string
  score: number
  rank: number
  grade: RiskGrade
}

export interface MaterialRiskDashboardResponse {
  kpi_summary: KpiSummaryItem[]
  ranking: MaterialRiskRankItem[]
  top_material_unit_exposure: RiskExposureByUnit[]
  quarter_change_label: string
}

/** 수입 의존도 탭. */
export interface CountryDependencyItem {
  country: string
  share_ratio: number
}

export interface UnitDependencyItem {
  business_unit: string
  country: string
  share_ratio: number
}

export interface ImportDependencyDashboardResponse {
  kpi_summary: KpiSummaryItem[]
  by_country: CountryDependencyItem[]
  by_unit: UnitDependencyItem[]
  alternative_suppliers: EntityBadgeItem[]
}

/** 공급사 분석 탭. */
export interface SupplierRiskRankItem {
  vendor_id: string
  vendor_name: string
  risk_count_90d: number
  approved_status: 'APPROVED' | 'REVIEW'
  linked_units: string[]
}

export interface SupplierAnalysisDashboardResponse {
  kpi_summary: KpiSummaryItem[]
  ranking: SupplierRiskRankItem[]
  recommended: EntityBadgeItem[]
}

/** 계약 현황 탭. */
export interface ContractCoverageItem {
  business_unit: string
  contract_count: number
}

export interface ContractStatusDashboardResponse {
  kpi_summary: KpiSummaryItem[]
  coverage_by_unit: ContractCoverageItem[]
  expiring: EntityBadgeItem[]
}

/** AI 브리핑 탭. */
export interface BriefingSummaryItem {
  risk_event_id: string
  material: string
  grade: RiskGrade
  headline: string
  business_unit: string
}

export interface AiBriefingSummaryDashboardResponse {
  kpi_summary: KpiSummaryItem[]
  by_unit: RankedBarItem[]
  recent: BriefingSummaryItem[]
  /** recent의 전체 건수(페이지네이션용) — recent 자체는 요청한 페이지 분량만 담는다. */
  recent_total_count: number
}

/** 데이터 품질 탭 — 전 필드 mock 임시값(docs/mock-schemas.md "임시 mock 값" 표 참고). */
export interface DataQualityStatus {
  erp_sync_status: string
  rag_index_status: string
  material_coverage_count: number
  material_coverage_total: number
  last_updated_label: string
  confidence_distribution: { label: ConfidenceLabel; ratio: number }[]
}

/**
 * 계약 근거 1건 — RAG(ChromaDB) 검색 결과. 실 백엔드 실측(2026-08-05)으로 필드 구성을
 * 확인했으나 `procurement_risk_assessments.contract_findings`(JSONB) 자체는 구조가
 * 고정된 스키마가 아니라서, 화면은 이 필드들이 없어도 깨지지 않게 전부 optional로 둔다.
 */
export interface ContractFindingItem {
  contract_id?: number
  document_id?: string
  page?: number
  clause_type?: string
  /** 조항 유형의 한글 표시명(예: "단가·가격조정 조항") — 화면에 이걸 우선 노출한다. */
  clause_name_kr?: string
  /** 0~1 사이 코사인 유사도. */
  similarity_score?: number
  /** 계약서 원문에서 발췌한 근거 텍스트. */
  evidence_text?: string
  material_id?: number
  supplier_id?: number
  source_type?: string
}

/**
 * AI 브리핑 드릴다운 상세(`/planning/briefing/:analysisId`). `analysis_id`는 1계층
 * risk_event_id("RISK-YYYY-MMDD-NNN")와 형식이 다르다 — 실 백엔드에서는
 * `analyses.analysis_id`(UUID) 문자열이 그대로 온다(parseRiskEventDate로 파싱 불가,
 * 이 화면에서는 날짜 파싱을 쓰지 않는다).
 */
export interface AiBriefingDetailResponse {
  analysis_id: string
  material: string
  business_unit: string | null
  grade: RiskGrade
  headline: string
  event_content: string
  /** analyses.summary_kr — 추출 단계의 짧은(1줄) 한국어 요약. 상세 요약 폴백용. */
  summary_kr: string | null
  /**
   * 경영기획 AI 브리핑 상세 전용으로 LLM이 새로 생성한 자세한 한국어 요약(ai_briefings.briefing_summary_kr).
   * 없으면(아직 생성 전) null — 화면은 summary_kr로 폴백한다.
   */
  briefing_summary_kr: string | null
  /** analyses.source_url — 뉴스 원문 링크. 없으면 null(원문 버튼 미표시). */
  source_url: string | null
  briefing: string | null
  recommended_actions: string[] | null
  contract_findings: ContractFindingItem[] | null
  warnings: string[] | null
  assessed_at: string | null
}

export interface ContractDocumentItem {
  document_id: string
  original_file_name: string
  processing_status: string
  chunk_count: number
}

/** 계약 현황 드릴다운 상세(`/planning/contract/:contractNumber`). */
export interface ContractDetailResponse {
  contract_number: string
  contract_name: string
  supplier_name: string
  material_name: string | null
  business_unit: string | null
  status: string
  start_date: string | null
  end_date: string | null
  documents: ContractDocumentItem[]
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
 *
 * `score`는 `PurchasingKpiSummary`의 ERP노출도·외부신호 평균이다(0~100).
 *
 * **`grade`는 선택이다.** 이 두 점수를 등급으로 나누는 임계값이 백엔드에 없다 —
 * 멀티에이전트는 종합 위험도에만 등급을 매기고, 구성요소인 ERP노출도·외부신호 각각에는
 * 매기지 않는다. 프론트에서 임계값을 지어내면 화면에만 존재하는 판정이 되므로 비워 두고
 * 점수만 보여준다(`ScoreCardPanel`이 배지를 생략한다).
 */
export interface ScoreCardItem {
  label: string
  score: number
  grade?: RiskGrade
  diffLabel?: string
}

/**
 * "대응 완료"로 표시된 구매 리스크 평가 한 줄
 * (`GET /api/v1/purchasing-dashboard/acknowledged`).
 *
 * 완료 처리하면 그 평가가 KPI·주요 이슈에서 빠지면서 화면에서도 사라져 되돌릴 자리가 없어진다.
 * 이 목록이 그 자리를 만든다 — 여기서만 되돌리기를 부를 수 있다.
 */
export interface AcknowledgedItem {
  assessment_id: string
  material_category: string
  /** 화면 표기명. 매핑에 없는 대분류는 코드가 그대로 온다. */
  material_name: string
  procurement_risk_level: string
  procurement_risk_score: number
  /** 이 평가를 만든 뉴스 제목. 분석이 지워졌으면 null이다. */
  subject_title: string | null
  /** 완료 처리한 사람. 계정이 지워졌으면 null. */
  acknowledged_by_name: string | null
  acknowledged_at: string
}

/**
 * 원자재별 리스크 점수 한 줄
 * (`GET /api/v1/purchasing-dashboard/material-risk-summary`).
 *
 * **`MaterialRiskItem`과 점수의 뜻이 다르다.** 저쪽은 ERP 노출도 단독 점수고, 이건
 * 외부신호·ERP노출·계약공백을 합친 **최종 합성 점수**(`procurement_risk_score`)다.
 * 같은 자재가 두 값에서 다른 등급으로 나올 수 있으므로 한 화면에 섞어 쓰지 않는다.
 *
 * 모집단은 대분류별 **점수 상위 3건**이다(KPI의 "최신 1건"과 다르다) — 한 자재에 뉴스가
 * 여러 건 들어왔을 때 가장 최근 것만 보면 직전의 더 심각한 뉴스가 화면에서 사라진다.
 *
 * 평가가 없는 자재도 행이 온다(7종 고정). 그 경우 점수·등급·`latest_assessment_id`가 전부
 * null이고, 화면은 "평가 없음"으로 표시한다.
 */
export interface MaterialRiskSummaryItem {
  material_category: string
  material_name: string
  /** 상위 3건 평균(0~100, 소수 1자리). 평가 0건이면 null */
  risk_score: number | null
  /** 상위 3건 중 최고 등급. 평가 0건이면 null */
  risk_level: 'CRITICAL' | 'WARNING' | 'NORMAL' | null
  /** 24시간 전까지 쌓인 평가만으로 같은 계산을 한 값. 그때 평가가 없었으면 null */
  risk_score_24h_ago: number | null
  /** `risk_score - risk_score_24h_ago`. 한쪽이라도 null이면 null이라 ▲▼를 그리지 않는다. */
  score_delta: number | null
  /**
   * 완료 처리(`POST /api/v1/multi-agent/assessments/{id}/acknowledge`) 대상.
   * KPI 건수가 세는 "대분류별 최신 1건"이라 `top_news`의 상위 3건과는 기준이 다르다.
   */
  latest_assessment_id: string | null
  top_news: MaterialRiskNewsItem[]
}

/**
 * 공급사 현황 및 대체 공급사 추천
 * (`GET /api/v1/purchasing-dashboard/supplier-overview`).
 *
 * **좌우의 원천이 다르다.** `current`는 ERP 발주 실적이고 `alternatives`는 분석이 돌 때
 * 저장된 추천 결과다 — 서로 다른 시점을 가리킬 수 있다.
 */
export interface SupplierOverview {
  /** 발주 금액(원화 환산) 1위 공급사. 발주가 없으면 null */
  current: CurrentSupplier | null
  /** 가장 최근 분석의 추천 3건. 추천이 저장된 분석이 없으면 빈 배열 */
  alternatives: AlternativeSupplier[]
}

export interface CurrentSupplier {
  supplier_code: string
  supplier_name: string
  country_code: string | null
  supplier_status: string | null
  risk_level: string | null
  /** 전체 발주 금액 대비 비중(%). 고시 매매기준율로 원화 환산 후 계산된 값이다. */
  dependency_ratio: number
}

export interface AlternativeSupplier {
  rank_position: number
  supplier_code: string
  supplier_name: string
  /** 추천 저장 시점이 아니라 `suppliers`의 **현재** 상태. 지금 발주 가능한지를 말해준다. */
  supplier_status: string | null
  risk_level: string | null
  /** "왜 이 공급사인가". 이게 없으면 구매팀이 화면만 보고 판단할 수 없다. */
  recommendation_reason: string | null
  pros: string | null
  cons: string | null
}

/** `MaterialRiskSummaryItem`의 "주요 이슈" 1건. */
export interface MaterialRiskNewsItem {
  assessment_id: string
  /** 번역본이 있으면 한국어, 없으면 영문 원문 */
  title: string | null
  score: number | null
  level: 'CRITICAL' | 'WARNING' | 'NORMAL' | null
  assessed_at: string | null
}

/**
 * 1계층 구매팀 대시보드 상단 KPI 5칸
 * (백엔드 `GET /api/v1/purchasing-dashboard/kpi-summary`).
 *
 * 모집단은 **자재 대분류(8종)별 최신 `procurement_risk_assessments` 1건**이다 — 누적 이력이
 * 아니라 현재 상태를 센다. 같은 자재를 여러 번 평가해도 "지금 심각한 자재 수"는 하나로 센다.
 *
 * 평균 점수와 `latest_assessed_at`은 **평가가 0건이면 null**이다(SQL AVG/MAX가 빈 집합에서
 * null). 0으로 바꿔 내려주지 않으므로 화면이 "0점"과 "아직 평가 없음"을 구분할 수 있다.
 */
export interface PurchasingKpiSummary {
  /** 평가가 존재하는 자재 대분류 수. 0이면 아래 건수·점수가 전부 비어 있다는 뜻이다. */
  assessed_category_count: number
  critical_count: number
  warning_count: number
  normal_count: number
  /** ERP 노출도 평균(0~100). 평가 0건이면 null */
  erp_exposure_score_avg: number | null
  /** 외부신호 평균(0~100). 평가 0건이면 null */
  external_signal_score_avg: number | null
  /** reviewer 노드 검증을 통과한 브리핑 건수 */
  verified_briefing_count: number
  latest_assessed_at: string | null
  /**
   * 최근 24시간 원본 행 전체 기준. 위 필드들("대분류별 최신 1건" 스냅샷)과 **모집단이 다르므로**
   * 두 값을 빼서 "전일 대비"로 쓰면 안 된다 — 백엔드 DTO 주석에 같은 경고가 있다.
   */
  critical_count_24h: number
  warning_count_24h: number
  erp_exposure_score_avg_24h: number | null
  external_signal_score_avg_24h: number | null
  /**
   * 백엔드가 현재 **항상 true로 하드코딩**해 보낸다(`DashboardRepository`). 값 자체는 실제
   * 집계 결과이므로 이 플래그로 분기하면 안 된다 — 화면에서 쓰지 않는다.
   */
  mock: boolean
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
 * 수입 의존도 도넛차트용. **모수가 둘이다** — 목업에서 조각 합은 100인데 가운데는 82.3%로
 * 서로 다른 기준이기 때문이다.
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
 * 1계층 구매팀 "리스크 모니터링" 화면의 이벤트 목록 1건
 * (백엔드 `GET /api/v1/risk-monitoring/events`).
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
  /**
   * 이 뉴스의 완결된 브리핑. 없으면 null이다.
   * `confidence_label === '확정'`과 항상 짝을 이룬다 — 확정인데 null이면 백엔드 버그다.
   */
  briefing_id: string | null
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
  /** 이 등급을 만든 자재. 대분류에 자재가 여럿이면 그중 가장 심한 쪽 */
  representative_material_id: string | null
  /** 유효한 종합 평가가 나온 자재 수 */
  valid_material_count: number
  /** 평가가 시도된 자재 수. valid보다 크면 일부만 성공한 것 */
  target_material_count: number
  /** 카드에 접히기 전 자재별 결과 */
  material_assessments: MaterialAssessment[]
}

/**
 * 자재 1개의 평가 결과. 한 뉴스가 ERP 자재 여러 개로 펼쳐질 수 있어(리튬·흑연은 2개씩),
 * 카드는 가장 심한 자재로 접히고 상세에서 전체를 펼쳐 보여준다.
 *
 * `valid=false`면 KG 게이트에서 조기 종료된 자재라 등급·점수가 null이고 사유만 `reasons`에 있다.
 */
export interface MaterialAssessment {
  erp_material_id: string
  valid: boolean
  risk_level: string | null
  risk_score: number | null
  erp_exposure_score: number | null
  contract_gap_score: number | null
  reasons: string[]
  assessed_at: string
}

/**
 * 평가 실행 상태. `multi_agent_completed`(유효 평가가 하나라도 있는가)와 축이 다르다 —
 * 이쪽은 **대상 자재 전부가 평가됐는가**를 말한다.
 */
export type AttemptStatus = 'NOT_RUN' | 'COMPLETED' | 'PARTIAL_SUCCESS' | 'EARLY_TERMINATED'

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
  latest_attempt_status: AttemptStatus
  /** 가장 최근 평가 실행 시각. 한 번도 안 돌았으면 null */
  latest_attempt_at: string | null
}

/**
 * 1계층 구매팀 "원자재 위험" 화면 상단 KPI 4장
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
  /**
   * 위 KPI 숫자를 만든 데이터의 품질 — **점수가 나온 자재**의 품질 중 가장 나쁜 값
   * (VALID < STALE < INCOMPLETE < INVALID). 평가하지 못한 자재는 여기 섞이지 않는다
   * (`unavailable_count`와 자재별 `unavailable_reason`이 맡는다).
   */
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
  /** "제4조". 조항이 아닌 청크(표지·서문)면 null */
  clause_no: string | null
  /**
   * "제4조 · 납기 및 지연 위약금". 청크 본문 머리에서 백엔드가 뽑는다(LLM 아님).
   * 청크 하나가 4.01·4.02·4.03을 통째로 담고 있어서, 제목이 없으면 어느 조항이 답인지 알 수 없다.
   */
  clause_title: string
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

/*
 * 자재 화면 전용 브리핑 타입은 여기에 없다(2026-08-02 제거). 원자재 위험 화면의
 * "AI 브리핑 생성"은 AI 브리핑 화면으로 이동만 하므로 `AiBriefingDetail`을 쓴다.
 */

/* ------------------------------------------------------------------ */
/* 1계층 구매팀 "계약 · RAG" 화면 (백엔드 `/api/v1/contract-rag/**`)      */
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
  /**
   * "INBOUND"(원자재 매입, 공급사→자사) 또는 "OUTBOUND"(제품 납품, 자사→고객사).
   * 인바운드는 supplier/material만, 아웃바운드는 product/customer만 채워진다.
   */
  kind: 'INBOUND' | 'OUTBOUND'
  product_id: number | null
  erp_product_id: string | null
  product_name: string | null
  customer_id: number | null
  erp_customer_id: string | null
  customer_name: string | null
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

/*
 * 계약·RAG 브리핑 타입(`ContractBriefing` · `ContractEvidenceRef` · `ContractBriefingSourceNews`)은
 * 2026-08-02에 제거했다. 계약 화면은 브리핑을 실행하지 않고 `/purchasing/ai-briefing?source=CONTRACT`
 * 로 넘길 뿐이라, 실행 결과 타입은 아래 "AI 브리핑" 화면 쪽에만 있으면 된다.
 */

/* ------------------------------------------------------------------ */
/* 1계층 구매팀 "AI 브리핑" 화면 (백엔드 `/api/v1/ai-briefing/**`)         */
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
  /**
   * 이 대상으로 이미 저장돼 있는 가장 최근 브리핑. 없으면 null.
   * 앞 화면에서 넘어왔을 때 화면이 본문을 바로 채우는 데 쓴다 — 없으면 프리필만 보이고
   * "구매 위험 브리핑" 칸이 비어, 이미 만들어 둔 브리핑을 두고 생성을 다시 누르게 된다.
   */
  latest_briefing_id: string | null
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
 * "평가해보니 정상"이 아니라 **"평가하지 못했다"**는 뜻이라 등급으로 읽으면 안 된다
 * (`ProcurementRiskAssessment.completed`와 같은 판정).
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
  /** 이 브리핑이 어떤 대상으로 만들어졌는지. 상세를 열 때 상단 "분석 대상"까지 함께 맞추는 데 쓴다. */
  source_ref: string
  subject_title: string | null
  news_id: string
  procurement_risk_level: string
  procurement_risk_score: number
  composite: boolean
  review_passed: boolean | null
  created_at: string
}

/**
 * 목록 API 공통 페이지 응답. 백엔드 `PageResponse`와 1:1이다.
 *
 * `total_elements`가 있어야 마지막 페이지에서 "다음"을 잠글 수 있다 — 배열만 받으면 "지금
 * 페이지가 비었다"와 "더 없다"를 구분할 방법이 없어 빈 페이지를 계속 넘기게 된다.
 */
export interface ApiPage<T> {
  content: T[]
  page: number
  size: number
  total_elements: number
  total_pages: number
}

export type AiBriefingRiskLevel = 'CRITICAL' | 'WARNING' | 'NORMAL'

/** `review_passed`의 세 상태 — TRUE(검증 통과) · FALSE(검토 필요) · NULL(미검증). */
export type AiBriefingReviewStatus = 'PASSED' | 'FAILED' | 'PENDING'

/**
 * "최근 브리핑" 조회 조건. 각 축의 `null`은 "전체"이고 그 축은 요청에서 아예 빠진다.
 *
 * **필터와 페이징이 한 요청에 함께 간다.** 필터를 화면에서 걸면 서버가 먼저 자른 한 페이지
 * 안에서만 걸러져, 뒷 페이지에 있어야 할 항목이 통째로 사라진다.
 */
export interface AiBriefingListQuery {
  source?: AiBriefingSource | null
  /** 평가 미완료(`composite=false`) 브리핑은 어느 등급으로도 걸리지 않는다. */
  level?: AiBriefingRiskLevel | null
  reviewStatus?: AiBriefingReviewStatus | null
  /** 최근 N일. `null`이면 기간 제한 없음. */
  days?: number | null
  page?: number
  size?: number
}

/* ------------------------------------------------------------------ 데이터 관리 */

/**
 * 1계층 구매팀 "데이터 관리" 화면. ERP CSV 일괄 적재와 RAG 계약 문서 등록 두 모드가 있고,
 * 두 모드 모두 **분석(DB 미반영) → 반영** 2단계다. 잡 ID가 없어 프론트가 File을 들고 있다가
 * 반영 단계에서 같은 파일을 다시 보낸다.
 */
export type DataImportMode = 'ERP' | 'RAG'

export type ErpImportResult = 'SUCCESS' | 'WARNING' | 'ERROR'

export type ErpImportIssueLevel = 'ERROR' | 'WARNING' | 'DUPLICATE'

/** MAPPED=적재됨, IGNORED=파일에 있으나 버려짐, MISSING=시스템이 요구하는데 파일에 없음 */
export type ErpImportColumnStatus = 'MAPPED' | 'IGNORED' | 'MISSING'

export interface ErpImportIssue {
  level: ErpImportIssueLevel
  /** 헤더를 1행으로 세는 실제 파일 줄 번호. 파일 전체에 대한 지적이면 null. */
  row_number: number | null
  column: string | null
  message: string
}

export interface ErpImportColumnMapping {
  source_column: string
  /** null이면 적재되지 않고 무시되는 컬럼이다. */
  target_field: string | null
  description: string
  required: boolean
  sample: string | null
  status: ErpImportColumnStatus
}

export interface ErpImportFileAnalysis {
  file_name: string
  /** 판별된 대상 테이블. null이면 어떤 ERP 테이블인지 알아내지 못한 것이라 반영할 수 없다. */
  target_table: string | null
  target_label: string | null
  /** FK 의존 적재 순서(1~10). 미판별이면 0. */
  load_order: number
  size_bytes: number
  row_count: number
  column_count: number
  result: ErpImportResult
  error_count: number
  warning_count: number
  duplicate_count: number
  columns: ErpImportColumnMapping[]
  /** 상위 몇 행 미리보기. "내용 분석" 표가 이걸 그린다. */
  sample_rows: Record<string, string>[]
  issues: ErpImportIssue[]
}

export interface ErpImportTableCount {
  target_table: string
  label: string
  row_count: number
}

export interface ErpImportPreview {
  files: ErpImportFileAnalysis[]
  total_rows: number
  total_errors: number
  total_warnings: number
  total_duplicates: number
  /** 0~100. 오류를 가장 무겁게, 중복·경고 순으로 깎은 점수. */
  quality_score: number
  /** 오류가 하나라도 있으면 false — 화면이 "DB에 반영" 버튼을 잠근다. */
  committable: boolean
  summary: ErpImportTableCount[]
}

export interface ErpImportTableResult {
  target_table: string
  label: string
  inserted: number
  updated: number
}

export interface ErpImportCommitResult {
  committed_at: string
  total_inserted: number
  total_updated: number
  results: ErpImportTableResult[]

  /**
   * KG 동기화 실패 사유. **null이 아니어도 DB 반영은 성공한 것이다** — 재고·소비량이
   * kg_service로 흘러가지 못했을 뿐이다. 화면은 이걸 "반영 실패"로 보여주면 안 된다.
   * 실패로 읽히면 사용자가 같은 파일을 다시 올려 중복 갱신을 시도한다.
   */
  kg_sync_warning: string | null

  /**
   * 최종 반영 보고서(PDF)를 받을 때 서버에 그대로 돌려줄 서명 문자열. 화면에 표시하지 않는다.
   * 서버가 "누가 언제 몇 건" 을 서명해둔 것이라, 이게 없으면 최종 보고서를 만들 수 없다.
   */
  receipt: string
}

/**
 * 업로드 제약. 서버의 `app.upload.max-file-size`가 진실이고 화면은 받아서 표시만 한다 —
 * 프론트에 숫자를 적어두면 서버 설정을 바꿨을 때 "화면은 통과인데 서버가 거부하는" 상태가 된다.
 */
export interface ErpImportConstraints {
  max_file_size_bytes: number
  allowed_extensions: string[]
}

export interface ContractSupplierOption {
  erp_supplier_id: string
  supplier_name: string
  country_code: string
  /** ACTIVE | SUSPENDED 등. 중단된 공급사도 목록에 있으므로 화면이 구분해 보여준다. */
  supplier_status: string
}

export interface ContractMaterialOption {
  erp_material_id: string
  material_name: string
  material_category: string
  active: boolean
}

/**
 * RAG 업로드 대상 선택지.
 *
 * **계약 목록이 아니라 공급사·자재 목록인 이유:** 데이터 관리 화면은 아직 계약이 없는 조합에
 * 계약서를 **처음 등록**하는 곳이다. 계약 목록으로 고르게 하면 이미 계약이 있는 조합밖에 못 골라
 * 신규 등록 자체가 불가능해진다. 기존 계약에 문서를 더하는 일은 계약/RAG 화면이 맡는다.
 */
export interface ContractUploadOptions {
  suppliers: ContractSupplierOption[]
  materials: ContractMaterialOption[]
}

/**
 * RAG 모드 분석 결과. 계약 필드는 파일 원문에서 정규식으로 추출한 값이라 **틀릴 수 있다** —
 * 화면이 수정 가능한 입력으로 보여주고, 사용자가 확인한 값으로 반영한다.
 */
export interface ContractDocumentPreview {
  erp_supplier_id: string
  erp_material_id: string
  /** 이 공급사·자재 조합에 이미 계약이 있으면 그 ID. 있으면 새로 만들지 않고 문서만 붙는다. */
  existing_contract_id: string | null
  /** 신규 계약일 때 발급 예정인 CTR-XXX. 기존 계약이 있으면 null. */
  expected_new_contract_id: string | null
  contract_number: string | null
  contract_name: string | null
  effective_date: string | null
  expiration_date: string | null
  file_name: string | null
  size_bytes: number
  char_count: number
  text_preview: string
  /** false면 원문을 읽지 못한 것 — "빈 문서"와 구분해서 안내해야 한다. */
  text_extracted: boolean
}

export interface ContractDocumentConfirmResult {
  contract_id: string
  contract_created: boolean
  document_id: string
  processing_status: string
}
