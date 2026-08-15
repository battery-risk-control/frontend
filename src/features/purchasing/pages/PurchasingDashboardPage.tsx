import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchPublicExchangeRates,
  fetchPublicImportDependency,
  fetchPublicNewsFeed,
  fetchPublicNewsFeedCount,
  fetchPublicPriceSummaries,
  fetchPublicPriceTrends,
  fetchPublicRiskBoard,
} from '../../../api/public.api'
import {
  acknowledgeAssessment,
  fetchAcknowledgedAssessments,
  unacknowledgeAssessment,
  fetchMaterialRiskSummary,
  fetchPurchasingKpiSummary,
  fetchSupplierOverview,
} from '../../../api/purchasingDashboard.api'
import { fetchMaterialRiskOverview } from '../../../api/materialRisk.api'
import { fetchRiskMonitoringEvents } from '../../../api/riskMonitoring.api'
import { fetchRecentAiBriefings } from '../../../api/aiBriefing.api'
import type {
  AcknowledgedItem,
  AiBriefingListItem,
  ExchangeRateBoard,
  GlobalRiskBoardItem,
  ImportDependencyData,
  MaterialPriceSeries,
  MaterialPriceSummary,
  MaterialRiskItem,
  MaterialRiskSummaryItem,
  NewsFeedItem,
  PurchasingKpiSummary,
  RiskMonitoringEvent,
  SelectedArticle,
  SupplierOverview,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { AlertsBellButton } from '../../../components/layout/AlertsBellButton'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { PageSectionDots } from '../../../components/ui/PageSectionDots/PageSectionDots'
import { useAlertsPanelState } from '../../../lib/useAlertsPanelState'
import { useAuthState } from '../../../lib/useAuthState'
import { buildDashboardAlerts, PURCHASING_ALERT_TARGETS } from '../../../lib/dashboardAlerts'
import { fromNewsFeedItem, fromRiskBoardItem } from '../../../lib/selectedArticle'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { DEFAULT_PERIOD, PERIOD_DAYS } from '../../../lib/materialPricePeriods'
import { useLiveRefresh, LIVE_REFRESH_SLOW_INTERVAL_MS } from '../../../lib/useLiveRefresh'
import { useDashboardAlertTarget } from '../../../lib/useDashboardAlertTarget'
import { PurchasingDashboardHeader } from '../components/PurchasingDashboardHeader'
import { PurchasingKpiRow } from '../components/PurchasingKpiRow'
import { LiveNewsMarquee } from '../components/LiveNewsMarquee'
import { LatestNewsPanel } from '../components/LatestNewsPanel'
import { MaterialRiskGaugeGrid } from '../components/MaterialRiskGaugeGrid'
import { MaterialRiskSummaryTable } from '../components/MaterialRiskSummaryTable'
import { AcknowledgedPanel } from '../components/AcknowledgedPanel'
import { SupplierOverviewPanel } from '../components/SupplierOverviewPanel'
import { ImportDependencyRow } from '../components/ImportDependencyRow'
import { MaterialRiskStatusPanel } from '../components/MaterialRiskStatusPanel'
import { ErpImpactPanel } from '../components/ErpImpactPanel'
import { PurchasePriorityPanel } from '../components/PurchasePriorityPanel'
import { DashboardSidePanel } from '../components/DashboardSidePanel'
import styles from './PurchasingDashboardPage.module.css'

/** 미리보기 표시/숨김 디바운스 — 트리거(헤더 벨)와 콘텐츠(우측 패널 미리보기)가 화면상
 * 떨어져 있어(도트 인디케이터처럼 인접하지 않음) DOM 포함 관계 트릭 대신, 둘 중 하나라도
 * 호버 중이면 유지하고 둘 다 벗어난 뒤 이 시간만큼 지나야 닫는 디바운스 방식을 쓴다. */
const PREVIEW_CLOSE_DELAY_MS = 150

/**
 * 마퀴에 흘릴 헤드라인 수. 목업 기준이며 "최신 뉴스" **1페이지** 응답을 잘라 쓴다 —
 * 목록이 과거 페이지로 넘어가도 마퀴는 최신에 머문다(`marqueeItems` 참고).
 */
const MARQUEE_COUNT = 5

/**
 * "최신 뉴스" 한 페이지 건수. 목업이 5줄이고, 화살표로 과거 기사까지 넘겨 본다.
 *
 * 마퀴가 1페이지 응답을 잘라 쓰므로 이 값이 `MARQUEE_COUNT` 이상이어야 한다 —
 * 작아지면 마퀴에 흘릴 헤드라인이 모자란다.
 */
const NEWS_FEED_PAGE_SIZE = 5

/** 우측 "브리핑" 탭에 띄울 최근 브리핑 수. */
const RECENT_BRIEFING_LIMIT = 5

/** 알림 대상을 고를 때 훑을 이벤트 수·기간. 대시보드용이라 최근 것만 본다. */
const ALERT_EVENT_DAYS = 7
const ALERT_EVENT_LIMIT = 50

/**
 * 주요 알림 자동 갱신 주기.
 *
 * 대시보드를 열어둔 채로 백그라운드 멀티에이전트가 끝나면 새 판정이 생기는데, 예전에는 진입
 * 시점에만 조회해서 새로고침하기 전까지 알림이 늘지 않았다. 수집 스케줄러가 15분 주기라
 * 1분이면 충분히 촘촘하고, 목록 조회 하나뿐이라 부담도 작다.
 */
const ALERT_REFRESH_INTERVAL_MS = 60_000

// side-panel-heading(우측 탭 패널)은 항상 뷰포트 밖으로 스크롤되지 않는 별도 영역이라 제외.
// 순서는 화면 배치와 같아야 도트가 스크롤을 따라간다.
const SECTION_DOTS_SECTIONS = [
  { id: '상단 KPI 요약', headingId: 'kpi-summary-heading' },
  { id: '실시간 헤드라인', headingId: 'live-marquee-heading' },
  { id: '글로벌 위험 지도', headingId: 'global-risk-board-heading' },
  { id: '최신 뉴스', headingId: 'latest-news-heading' },
  { id: '수입 의존도', headingId: 'import-dependency-heading' },
  { id: '원자재 가격 추이', headingId: 'material-price-detail-heading' },
  // 이름이 비슷한 두 섹션이 나란히 있다. 위쪽은 최종 합성 점수(7종 표), 아래쪽은 ERP 노출도
  // 게이지다 — 점수의 뜻이 달라 도트에서도 구분되게 라벨을 나눴다.
  { id: '원자재별 리스크 점수', headingId: 'material-risk-composite-heading' },
  { id: '원자재 공급사 리스크 현황', headingId: 'material-risk-heading' },
  { id: 'ERP 영향', headingId: 'erp-impact-heading' },
  { id: '구매 대응 우선순위', headingId: 'purchase-priority-heading' },
  { id: '공급사 현황', headingId: 'supplier-overview-heading' },
]

/**
 * 1계층 구매팀 대시보드 (Seq 24).
 *
 * **전부 실 데이터다**(2026-08-02). 예전에는 `purchasing.api.ts`의 mock을 동기로 읽어 그렸다.
 * 데이터 원천이 두 갈래다.
 *
 * - **공개 API 6종** — 비로그인 대시보드와 **같은 엔드포인트를 그대로 재사용**한다
 *   (환율·가격추이·수입의존도·위험지도·뉴스속보·마퀴). `/api/v1/public/**`는 permitAll이고
 *   `JwtAuthenticationFilter`가 토큰이 없거나 유효할 때 모두 통과시키므로 로그인 상태에서도
 *   같은 응답이 온다. 두 화면이 같은 숫자를 보여야 하는데 조회 경로를 둘로 나누면 어느 쪽이
 *   맞는지 알 수 없게 되므로 일부러 하나만 둔다.
 * - **인증 API** — KPI 요약(`/purchasing-dashboard/kpi-summary`), 자재별 위험
 *   (`/material-risk/overview`), 알림용 이벤트(`/risk-monitoring/events`), 최근 브리핑
 *   (`/ai-briefing/briefings`). 공개 API가 의도적으로 뺀 ERP 내부값(재고일수·의존도·자재코드)은
 *   여기서만 온다.
 *
 * 배치는 목업(다른 담당자 제공) 순서를 위쪽에 두고, 목업에 없는 기존 패널을 그 아래에 둔다 —
 * 목업이 화면 구성을 전부 반영한 것이 아니라서, 빠진 패널을 지우는 대신 아래로 내렸다.
 *
 * 조회는 **패널마다 독립적으로** 처리한다. 한쪽이 실패해도 나머지는 그대로 그려야 하기
 * 때문이다(공개 대시보드와 같은 방침). 인증 API 4종은 토큰이 있어야 하므로 `accessToken`이
 * 준비된 뒤에만 부른다.
 *
 * 알림 패널의 펼침/접힘은 `AlertsPanelContext`(페이지 이동 간 유지)로, 접힌 상태에서 헤더 벨
 * (`AlertsBellButton`) 호버 시 뜨는 미리보기는 이 페이지의 로컬 `isPreviewing` 상태로 관리한다
 * (2026-07-27, 오류 및 기능 미흡 발견 #7) — 트리거(헤더, 최상단)와 콘텐츠(우측 sticky 컬럼)가
 * 화면상 떨어져 있어 도트 인디케이터의 DOM 포함 관계 트릭 대신, 어느 쪽을 호버해도 유지되고
 * 둘 다 벗어난 뒤 `PREVIEW_CLOSE_DELAY_MS`만큼 지나야 닫히는 디바운스 방식을 쓴다.
 * `Escape`로도 닫힌다. 우측 패널이 `AlertsPanel` → `DashboardSidePanel`(탭 3개)로 바뀌었지만
 * 이 배선은 계약이 같아 그대로다.
 */
export function PurchasingDashboardPage() {
  const { accessToken } = useAuthState()
  const liveRefreshKey = useLiveRefresh()
  // 천천히 변하는 공개 데이터(지도·수입의존도·환율·가격)용 느린 갱신 키. 원천이 드물게
  // 바뀌는 데이터를 60초마다 재조회하던 것을 5분으로 늦춰 폴링 트래픽을 줄인다.
  // 탭 복귀 시 즉시 갱신은 두 키 모두 동일하게 동작한다(useLiveRefresh focus 리스너).
  const slowRefreshKey = useLiveRefresh(LIVE_REFRESH_SLOW_INTERVAL_MS)
  // 주요 알림(가격 변동성 주의) 클릭 시 넘어온 자재 선택 + 섹션 스크롤 처리.
  const alertMaterial = useDashboardAlertTarget()

  // --- 공개 API 6종 ---
  const [riskBoardItems, setRiskBoardItems] = useState<GlobalRiskBoardItem[]>([])
  const [riskBoardLoading, setRiskBoardLoading] = useState(true)
  const [newsItems, setNewsItems] = useState<NewsFeedItem[]>([])
  /** "최신 뉴스" 현재 페이지(0부터). 화살표로만 바뀐다. */
  const [newsPage, setNewsPage] = useState(0)
  /** 자재 필터를 통과한 뉴스 전체 건수. 마지막 페이지에서 화살표를 잠근다. */
  const [newsTotal, setNewsTotal] = useState(0)
  /**
   * 상단 마퀴에 흘릴 헤드라인. **목록과 분리해서 들고 있는다** — 같은 배열을 쓰면 사용자가
   * 목록에서 과거 페이지로 넘기는 순간 "실시간 헤드라인" 자막까지 과거 기사로 바뀐다.
   * 1페이지를 받을 때 함께 채우므로 추가 요청은 없다.
   */
  const [marqueeItems, setMarqueeItems] = useState<NewsFeedItem[]>([])
  const [priceSeries, setPriceSeries] = useState<MaterialPriceSeries[]>([])
  const [priceSummaries, setPriceSummaries] = useState<MaterialPriceSummary[]>([])
  const [importDependency, setImportDependency] = useState<ImportDependencyData>({
    total: 0,
    breakdown: [],
  })
  // 초기값을 빈 밴드로 둬서, 조회 전·실패 시 모두 "환율 칩 없음" 분기로 수렴한다.
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateBoard>({
    rate_date: null,
    base_currency: 'KRW',
    rates: [],
  })

  // --- 인증 API 4종 ---
  const [kpi, setKpi] = useState<PurchasingKpiSummary | null>(null)
  const [materialRiskSummary, setMaterialRiskSummary] = useState<MaterialRiskSummaryItem[]>([])
  /** 완료 처리 중인 평가 id. 버튼 단위로 잠가 같은 평가를 두 번 보내지 않는다. */
  const [pendingAssessmentId, setPendingAssessmentId] = useState<string | null>(null)
  /** 완료 처리 후 KPI·원자재 요약을 다시 부르기 위한 트리거. */
  const [reloadKey, setReloadKey] = useState(0)
  const [supplierOverview, setSupplierOverview] = useState<SupplierOverview | null>(null)
  const [materials, setMaterials] = useState<MaterialRiskItem[]>([])
  // 헤더 "기준" 칩. 최신 공급망 뉴스 수집 시각(summary.news_as_of, MAX collected_at)을 쓴다 —
  // 2·3계층 대시보드 as_of와 같은 소스라 네 화면의 기준 시각이 일치한다(수집 뉴스가 없으면 null이라 칩이 숨는다).
  // 이 개요 조회가 liveRefreshKey(60초·포커스)에 물려 있어 칩도 함께 갱신된다.
  const [materialAsOf, setMaterialAsOf] = useState<string | null>(null)
  const [monitoringEvents, setMonitoringEvents] = useState<RiskMonitoringEvent[]>([])
  const [briefings, setBriefings] = useState<AiBriefingListItem[]>([])

  /*
   * 패널별 로딩 상태. 하나로 묶지 않는 이유는 조회가 **서로 다른 시점에 끝나기** 때문이다 —
   * 전역 플래그 하나로 두면 가장 느린 응답이 올 때까지 이미 도착한 패널까지 자리표시자로
   * 붙잡아 둔다. 실패해도 로딩은 끝난 것이므로 `.finally`에서 내린다(그때는 각 패널의
   * "데이터 없음" 문구가 맞는 표시다).
   */
  const [newsLoading, setNewsLoading] = useState(true)
  const [priceLoading, setPriceLoading] = useState(true)
  const [kpiLoading, setKpiLoading] = useState(true)
  const [materialRiskLoading, setMaterialRiskLoading] = useState(true)
  const [supplierLoading, setSupplierLoading] = useState(true)
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)
  const [briefingsLoading, setBriefingsLoading] = useState(true)

  /** 완료 처리 항목 — 되돌리기 목록. 완료/되돌리기 어느 쪽이든 reloadKey로 함께 다시 부른다. */
  const [acknowledged, setAcknowledged] = useState<AcknowledgedItem[]>([])
  const [acknowledgedLoading, setAcknowledgedLoading] = useState(true)

  // 기간 탭은 페이지가 소유한다 — 탭이 바뀌면 차트와 요약 카드를 **같은 days로** 함께 다시
  // 불러야 하고(백엔드가 "같은 구간에서 파생"을 전제로 만들어져 있다), 그 조회는 페이지 책임이다.
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  // 우측 "뉴스 상세" 탭이 보여줄 항목. **두 곳에서 선택된다** — 최신 뉴스 목록과 위험 지도
  // 마커. 두 원천은 필드도 식별자도 겹치지 않아(실측 교집합 0건) 한쪽을 다른 쪽으로 찾아
  // 맞추지 못하므로, 각각 `SelectedArticle`로 변환해 같은 자리에 넣는다.
  const [selectedNews, setSelectedNews] = useState<SelectedArticle | null>(null)
  const [selectedNewsItems, setSelectedNewsItems] = useState<SelectedArticle[]>([])

  /*
   * 조회 조건이 바뀌면 자리표시자를 다시 켠다 — **effect 안이 아니라 렌더 중에** 직전 값과
   * 비교한다.
   *
   * 로딩 상태의 초기값은 전부 `true`라 첫 조회는 이미 자리표시자로 시작한다. 여기서 다루는
   * 건 **재조회**다. 이게 없으면 기간 탭을 눌러도 이전 구간 차트가 그대로 떠 있고, 뉴스
   * 페이지를 넘겨도 이전 목록이 남아 "안 먹는다"처럼 보인다.
   *
   * effect에서 setState하면 화면이 한 번 그려진 뒤 다시 그려지는 연쇄 렌더가 되고
   * (react-hooks/set-state-in-effect), 그 사이 한 프레임 동안 옛 데이터가 "로딩 아님"으로
   * 보인다. 렌더 중 조정은 React가 그 자리에서 다시 렌더해 중간 상태가 화면에 나가지 않는다.
   */
  const [prevPeriod, setPrevPeriod] = useState(period)
  if (period !== prevPeriod) {
    setPrevPeriod(period)
    setPriceLoading(true)
  }

  const [prevNewsPage, setPrevNewsPage] = useState(newsPage)
  if (newsPage !== prevNewsPage) {
    setPrevNewsPage(newsPage)
    setNewsLoading(true)
  }

  // 인증 조회 묶음은 "대응 완료/되돌리기"(reloadKey)와 토큰 교체에 함께 반응한다 — 한쪽만
  // 갱신하면 KPI 건수와 표가 어긋난 채로 남는다.
  const authQueryKey = `${accessToken ?? ''}|${reloadKey}`
  const [prevAuthQueryKey, setPrevAuthQueryKey] = useState(authQueryKey)
  if (authQueryKey !== prevAuthQueryKey) {
    setPrevAuthQueryKey(authQueryKey)
    setKpiLoading(true)
    setMaterialRiskLoading(true)
    setSupplierLoading(true)
    setMaterialsLoading(true)
    setBriefingsLoading(true)
    setAcknowledgedLoading(true)
    // 알림은 1분 폴링이 따로 돌지만, 자리표시자는 첫 조회와 재조회에서만 띄운다
    // (폴링 중에 자리표시자로 바뀌면 읽던 알림이 사라진다).
    setAlertsLoading(true)
  }

  // 주요 알림은 두 원천이 섞인다 — 멀티에이전트 판정이 심각·주의인 뉴스 + 변동성이 큰 자재(정보).
  // 가격 쪽은 기간 탭(period)에 따라 함께 바뀐다. 같은 구간에서 파생한 값이라 그게 맞다.
  const alerts = buildDashboardAlerts(monitoringEvents, priceSeries, priceSummaries, PURCHASING_ALERT_TARGETS)

  const { expanded: alertsExpanded, open: openAlertsPanel } = useAlertsPanelState()
  const [isPreviewing, setIsPreviewing] = useState(false)
  /** 알림 벨을 누른 횟수. 우측 패널이 "주요 알림" 탭으로 옮겨야 할 때를 알린다. */
  const [alertsFocusToken, setAlertsFocusToken] = useState(0)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * 헤더 알림 벨 클릭 — 패널을 열고 "주요 알림" 탭으로 옮긴다.
   *
   * 토글이 아니라 열기다. 브리핑 탭을 보다가 알림을 보려고 눌렀는데 패널이 닫히면 안 된다.
   * 열고 닫기는 패널 가장자리의 `SidePanelToggleButton`이 맡는다.
   *
   * 미리보기도 함께 내린다 — 패널이 열리면 그 안에 같은 내용이 있어서, 오버레이가 남아 있으면
   * 같은 목록이 두 겹으로 보인다.
   */
  const handleOpenAlerts = useCallback(() => {
    openAlertsPanel()
    setAlertsFocusToken((previous) => previous + 1)
    setIsPreviewing(false)
  }, [openAlertsPanel])

  /**
   * 지도 마커·최신 뉴스에서 기사를 고르면 우측 패널을 함께 연다.
   *
   * 패널이 접혀 있을 때 제목을 눌러도 화면이 아무 반응도 하지 않아, 클릭이 먹지 않은 것처럼
   * 보였다 — 선택은 바뀌었는데 그걸 보여줄 자리가 닫혀 있었다. "뉴스 상세" 탭으로 옮기는 것은
   * `DashboardSidePanel`이 `selectedNews` 참조 변경을 보고 이미 하고 있다.
   *
   * 목록이 처음 도착할 때의 자동 선택(첫 기사)에는 쓰지 않는다 — 사용자가 누른 것이 아닌데
   * 패널이 열리면, 접어 둔 사람에게는 화면이 제멋대로 움직이는 것으로 보인다.
   */
  const handleSelectArticle = useCallback(
    (article: SelectedArticle) => {
      setSelectedNews(article)
      setSelectedNewsItems([article])
      openAlertsPanel()
    },
    [openAlertsPanel],
  )

  // 공개 API(느린 갱신) — 지도·수입의존도·환율은 원천 갱신이 드물어(환율 하루 2회, 지도는
  // 분석 파이프라인) 5분 주기로 폴링한다. 탭 복귀 시에는 slowRefreshKey도 즉시 갱신된다.
  useEffect(() => {
    let cancelled = false
    fetchPublicRiskBoard()
      .then((items) => {
        if (!cancelled) setRiskBoardItems(items)
      })
      .catch((err) => {
        console.error('글로벌 위험 지도 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setRiskBoardLoading(false)
      })
    fetchPublicImportDependency()
      .then((data) => {
        if (!cancelled) setImportDependency(data)
      })
      .catch((err) => {
        console.error('수입 의존도 조회 실패', err)
      })
    fetchPublicExchangeRates()
      .then((board) => {
        if (!cancelled) setExchangeRates(board)
      })
      .catch((err) => {
        console.error('환율 조회 실패', err)
      })
    return () => {
      cancelled = true
    }
  }, [slowRefreshKey])

  // 뉴스 총건수는 뉴스 목록과 같은 60초 주기를 쓴다 — 목록과 건수가 다른 주기로 갱신되면
  // 마지막 페이지 화살표 잠금이 어긋난다(둘은 같은 조건의 쿼리 짝이다).
  useEffect(() => {
    let cancelled = false
    fetchPublicNewsFeedCount()
      .then((total) => {
        if (!cancelled) setNewsTotal(total)
      })
      .catch((err) => {
        console.error('뉴스 건수 조회 실패', err)
      })
    return () => {
      cancelled = true
    }
  }, [liveRefreshKey])

  // 가격 차트·요약 카드만 기간 탭에 반응한다. 위 훅과 분리한 이유는 지도·뉴스·환율까지 탭을
  // 누를 때마다 다시 부를 이유가 없어서다. 둘을 반드시 **같은 days로** 부른다.
  useEffect(() => {
    let cancelled = false
    // 자리표시자는 위쪽 렌더 중 조정(prevPeriod 비교)에서 이미 켰다.
    const days = PERIOD_DAYS[period]
    fetchPublicPriceTrends(days)
      .then((series) => {
        if (!cancelled) setPriceSeries(series)
      })
      .catch((err) => {
        console.error('원자재 가격 추이 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false)
      })
    fetchPublicPriceSummaries(days)
      .then((summaries) => {
        if (!cancelled) setPriceSummaries(summaries)
      })
      .catch((err) => {
        console.error('원자재 요약 카드 조회 실패', err)
      })
    return () => {
      cancelled = true
    }
    // 가격 원천(yfinance)은 장중 15분 간격 갱신이라 5분 폴링이면 충분하다. 기간 탭(period)
    // 클릭은 의존성에 그대로 있어 즉시 반응한다.
  }, [period, slowRefreshKey])

  // 뉴스 목록은 페이지가 바뀔 때마다 다시 부른다. 위 공개 API 묶음에서 떼어낸 이유는 그쪽이
  // 마운트 1회용인데 여기만 newsPage에 의존하기 때문이다 — 같이 두면 화살표를 누를 때마다
  // 환율·지도·가격까지 전부 다시 불린다.
  useEffect(() => {
    let cancelled = false
    // 화살표로 페이지를 넘길 때마다 다시 불러오므로 로딩을 되켠다 — 이게 없으면 첫 조회
    // 이후로는 자리표시자가 영영 안 뜨고, 넘긴 뒤에도 이전 페이지 목록이 그대로 남아
    // "화살표가 안 먹는다"처럼 보인다.
    // 자리표시자는 위쪽 렌더 중 조정(prevNewsPage 비교)에서 이미 켰다.
    fetchPublicNewsFeed(NEWS_FEED_PAGE_SIZE, newsPage * NEWS_FEED_PAGE_SIZE)
      .then((items) => {
        if (cancelled) return
        setNewsItems(items)
        if (newsPage === 0) setMarqueeItems(items)
        // 목업처럼 첫 기사를 미리 띄워 우측 패널이 빈 채로 시작하지 않게 한다.
        // 이미 골라 둔 기사가 있으면 덮어쓰지 않는다 — 페이지를 넘겼다고 우측 상세가
        // 제멋대로 바뀌면 "읽던 기사를 잃어버리는" 동작이 된다.
        setSelectedNews((current) => current ?? (items[0] ? fromNewsFeedItem(items[0]) : null))
      })
      .catch((err) => {
        console.error('뉴스 속보 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setNewsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [newsPage, liveRefreshKey])

  // 인증 API — 토큰이 준비된 뒤에만 부른다. RequireAuth가 이 화면을 지키므로 실제로는 항상
  // 값이 있지만, 없을 때 401을 만들지 않도록 가드를 둔다.
  //
  // `reloadKey`는 "대응 완료" 후 KPI와 원자재 요약을 다시 부르기 위한 것이다. 두 조회가 같은
  // 테이블(procurement_risk_assessments)을 서로 다른 기준으로 집계하므로, 한쪽만 갱신하면
  // 화면 안에서 건수와 표가 어긋난 채로 남는다.
  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    // 자리표시자는 위쪽 렌더 중 조정(authQueryKey 비교)에서 이미 켰다.
    fetchPurchasingKpiSummary(accessToken)
      .then((summary) => {
        if (!cancelled) setKpi(summary)
      })
      .catch((err) => {
        console.error('KPI 요약 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setKpiLoading(false)
      })
    fetchMaterialRiskSummary(accessToken)
      .then((summary) => {
        if (!cancelled) setMaterialRiskSummary(summary)
      })
      .catch((err) => {
        console.error('원자재별 리스크 점수 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setMaterialRiskLoading(false)
      })
    fetchSupplierOverview(accessToken)
      .then((overview) => {
        if (!cancelled) setSupplierOverview(overview)
      })
      .catch((err) => {
        console.error('공급사 현황 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setSupplierLoading(false)
      })
    fetchMaterialRiskOverview(accessToken)
      .then((overview) => {
        if (cancelled) return
        setMaterials(overview.materials)
        setMaterialAsOf(overview.summary.news_as_of)
      })
      .catch((err) => {
        console.error('자재별 위험 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setMaterialsLoading(false)
      })
    // 이 화면은 "최근 몇 건"만 보여주는 사이드 패널이라 필터 없이 첫 페이지만 받는다.
    // 필터·페이징은 AI 브리핑 화면의 몫이다.
    fetchRecentAiBriefings(accessToken, { size: RECENT_BRIEFING_LIMIT })
      .then((page) => {
        if (!cancelled) setBriefings(page.content)
      })
      .catch((err) => {
        console.error('최근 브리핑 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setBriefingsLoading(false)
      })
    fetchAcknowledgedAssessments(accessToken)
      .then((items) => {
        if (!cancelled) setAcknowledged(items)
      })
      .catch((err) => {
        console.error('완료 처리 항목 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setAcknowledgedLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, reloadKey, liveRefreshKey])

  /**
   * 평가 1건을 완료 처리하고 두 집계를 다시 부른다.
   *
   * 낙관적 갱신을 하지 않는다 — 완료 처리하면 그 자재의 **다음 평가**가 최신으로 올라와
   * 점수·등급·주요 이슈가 통째로 바뀔 수 있어서, 화면에서 그 결과를 미리 계산할 수 없다.
   * 서버 값을 다시 받는 편이 정확하다.
   */
  async function handleAcknowledge(item: MaterialRiskSummaryItem) {
    if (!accessToken || !item.latest_assessment_id) return
    setPendingAssessmentId(item.latest_assessment_id)
    try {
      await acknowledgeAssessment(accessToken, item.latest_assessment_id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      console.error('완료 처리 실패', err)
    } finally {
      setPendingAssessmentId(null)
    }
  }

  /*
   * 주요 알림만 주기적으로 다시 부른다. 다른 조회와 묶지 않는 이유: 이건 백그라운드에서
   * 새 판정이 생기는 유일한 축이라 갱신이 필요하고, 나머지(KPI·표·공급사)를 함께 돌리면
   * 1분마다 화면 전체가 흔들린다.
   *
   * 폴링 중에는 로딩 표시를 켜지 않는다 — 이미 목록이 떠 있는데 1분마다 자리표시자로
   * 바뀌면 읽던 알림이 사라진다. 첫 조회만 자리표시자를 쓴다.
   */
  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    // 자리표시자는 위쪽 렌더 중 조정(authQueryKey 비교)에서 이미 켰다. 폴링 회차는
    // `first: false`로 들어와 로딩을 건드리지 않는다(아래 finally 참고).

    async function load(token: string, first: boolean) {
      try {
        const events = await fetchRiskMonitoringEvents(token, {
          days: ALERT_EVENT_DAYS,
          limit: ALERT_EVENT_LIMIT,
        })
        if (!cancelled) setMonitoringEvents(events)
      } catch (err) {
        console.error('리스크 이벤트 조회 실패', err)
      } finally {
        if (!cancelled && first) setAlertsLoading(false)
      }
    }

    void load(accessToken, true)
    const timer = window.setInterval(() => void load(accessToken, false), ALERT_REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [accessToken, reloadKey])

  /** 되돌리기. 완료 처리와 같은 reloadKey를 올려 KPI·표·이 목록을 한꺼번에 맞춘다 —
      한쪽만 갱신하면 표에는 돌아왔는데 KPI는 그대로인 어긋난 화면이 된다. */
  async function handleUndoAcknowledge(item: AcknowledgedItem) {
    if (!accessToken) return
    setPendingAssessmentId(item.assessment_id)
    try {
      await unacknowledgeAssessment(accessToken, item.assessment_id)
      setReloadKey((key) => key + 1)
    } catch (err) {
      console.error('되돌리기 실패', err)
    } finally {
      setPendingAssessmentId(null)
    }
  }

  function handlePreviewMouseEnter() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setIsPreviewing(true)
  }

  function handlePreviewMouseLeave() {
    closeTimeoutRef.current = setTimeout(() => {
      setIsPreviewing(false)
      closeTimeoutRef.current = null
    }, PREVIEW_CLOSE_DELAY_MS)
  }

  useEffect(() => {
    if (!isPreviewing) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
        setIsPreviewing(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPreviewing])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  return (
    <div className={styles.page}>
      <Header
        accountExtra={
          <AlertsBellButton
            count={alerts.length}
            onOpenAlerts={handleOpenAlerts}
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
          />
        }
      />
      <div className={styles.body}>
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          {/* ── 목업에 있는 구성 (위) ─────────────────────────────── */}
          <PurchasingDashboardHeader asOf={materialAsOf} />
          <PurchasingKpiRow kpi={kpi} isLoading={kpiLoading} />
          {/* 환율은 한 종을 골라 넘기지 않는다 — 어느 통화를 보여줄지는 마퀴가 순환으로 정한다.
              USD만 넘기던 예전 방식에서는 수집해 둔 28종 중 27종이 화면에 안 나왔다. */}
          <LiveNewsMarquee items={marqueeItems.slice(0, MARQUEE_COUNT)} rates={exchangeRates.rates} />
          {riskBoardLoading ? (
            <div className={styles.riskBoardLoading}>지도 데이터를 불러오는 중입니다…</div>
          ) : (
            /* 마커를 누르면 우측 "뉴스 상세" 탭이 그 이벤트로 바뀐다. onSelectItem을 넘겼으므로
               카드 안쪽 상세 패널은 자동으로 펼쳐지지 않는다(같은 내용이 두 군데 뜨는 것 방지). */
            <GlobalRiskBoard
              items={riskBoardItems}
              onSelect={(detail) => {
                if (!detail || detail.events.length === 0) return
                const articles = detail.events.map(fromRiskBoardItem)
                setSelectedNews(articles[0])
                setSelectedNewsItems(articles)
                openAlertsPanel()
              }}
            />
          )}
          <LatestNewsPanel
            items={newsItems}
            isLoading={newsLoading}
            selectedId={selectedNews?.id}
            onSelect={(item) => handleSelectArticle(fromNewsFeedItem(item))}
            page={newsPage}
            pageSize={NEWS_FEED_PAGE_SIZE}
            total={newsTotal}
            onPageChange={setNewsPage}
          />
          <ImportDependencyRow
            importDependency={importDependency}
            priceSeries={priceSeries}
            priceSummaries={priceSummaries}
            isPriceLoading={priceLoading}
            period={period}
            onPeriodChange={setPeriod}
            selectedMaterial={alertMaterial}
          />

          {/* 원자재 7종 · 최종 합성 점수(외부신호+ERP노출+계약공백). 아래 게이지 행과 자리가
              붙어 있지만 **점수의 뜻이 다르다** — 게이지는 ERP 노출도 단독 점수다. */}
          <MaterialRiskSummaryTable
            items={materialRiskSummary}
            isLoading={materialRiskLoading}
            pendingAssessmentId={pendingAssessmentId}
            onAcknowledge={handleAcknowledge}
          />
          {/* 같은 배열을 게이지로도 읽는다. 기본은 접힘 — 펼쳐두면 바로 위 표와 같은 값이
              두 벌로 보여 그때는 진짜 중복이 된다. */}
          <MaterialRiskGaugeGrid items={materialRiskSummary} />
          {/* 위 표에서 "대응 완료"로 내려간 항목이 여기로 옮겨진다. 되돌릴 자리가 여기뿐이다.
              옆이 아니라 아래에 두는 이유: main 컬럼이 SideNav(220) + 우측 패널(320) + 도트
              레일(40)에 이미 눌려 있어, 5칸짜리 표 옆에 300px를 떼면 "주요 이슈" 칸이 먼저
              줄어든다. 게다가 이 목록은 대개 비어 있어서 빈 카드가 폭을 상시 점유한다. */}
          <AcknowledgedPanel
            items={acknowledged}
            isLoading={acknowledgedLoading}
            pendingAssessmentId={pendingAssessmentId}
            onUndo={handleUndoAcknowledge}
          />

          {/* ── 목업에 없는 기존 구성 (아래) ───────────────────────
              목업이 화면 전체를 반영한 것이 아니라, 지우지 않고 아래로 내렸다.

              MaterialRiskOverviewSection은 2026-08-03에 제거했다. 옆에 붙어 있던
              "외부 리스크 종합 점수"·"ERP 영향 점수" 카드가 상단 KPI와 **같은 필드**를
              같은 방식으로 다시 그렸고(kpi.external_signal_score_avg /
              erp_exposure_score_avg), 게이지는 위 표와 단위가 어긋난 데다 하드코딩
              placeholder까지 섞여 있었다. 게이지는 표 바로 아래 접기 UI로 옮겼다. */}
          <MaterialRiskStatusPanel materials={materials} />
          <ErpImpactPanel materials={materials} />
          <PurchasePriorityPanel materials={materials} isLoading={materialsLoading} />
          <SupplierOverviewPanel overview={supplierOverview} isLoading={supplierLoading} />
        </main>
        <PageSectionDots variant="withAside" sections={SECTION_DOTS_SECTIONS} />
        <DashboardSidePanel
          selectedNews={selectedNews}
          selectedNewsItems={selectedNewsItems}
          isNewsLoading={newsLoading}
          isAlertsLoading={alertsLoading}
          isBriefingsLoading={briefingsLoading}
          alerts={alerts}
          briefings={briefings}
          expanded={alertsExpanded}
          focusAlertsToken={alertsFocusToken}
          isPreviewing={isPreviewing}
          onPreviewMouseEnter={handlePreviewMouseEnter}
          onPreviewMouseLeave={handlePreviewMouseLeave}
        />
      </div>
      <Footer />
    </div>
  )
}
