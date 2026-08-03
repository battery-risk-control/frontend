import { useEffect, useRef, useState } from 'react'
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
  toMaterialRiskGauges,
  toScoreCards,
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
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { AlertsBellButton } from '../../../components/layout/AlertsBellButton'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { PageSectionDots } from '../../../components/ui/PageSectionDots/PageSectionDots'
import { useAlertsPanelState } from '../../../lib/useAlertsPanelState'
import { useAuthState } from '../../../lib/useAuthState'
import { buildDashboardAlerts } from '../../../lib/dashboardAlerts'
import { fromNewsFeedItem, fromRiskBoardItem } from '../../../lib/selectedArticle'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { DEFAULT_PERIOD, PERIOD_DAYS } from '../../../lib/materialPricePeriods'
import { PurchasingDashboardHeader } from '../components/PurchasingDashboardHeader'
import { PurchasingKpiRow } from '../components/PurchasingKpiRow'
import { LiveNewsMarquee } from '../components/LiveNewsMarquee'
import { LatestNewsPanel } from '../components/LatestNewsPanel'
import { MaterialRiskOverviewSection } from '../components/MaterialRiskOverviewSection'
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
  { id: '원자재 리스크 개요', headingId: 'material-risk-summary-heading' },
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

  // 주요 알림은 두 원천이 섞인다 — 멀티에이전트 판정이 심각·주의인 뉴스 + 변동성이 큰 자재(정보).
  // 가격 쪽은 기간 탭(period)에 따라 함께 바뀐다. 같은 구간에서 파생한 값이라 그게 맞다.
  const alerts = buildDashboardAlerts(monitoringEvents, priceSeries, priceSummaries)
  const gauges = toMaterialRiskGauges(materials)
  const scoreCards = toScoreCards(kpi)

  const { expanded: alertsExpanded, toggle: toggleAlertsExpanded } = useAlertsPanelState()
  const [isPreviewing, setIsPreviewing] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 공개 API — 토큰이 필요 없으므로 마운트 시 한 번만 부른다(기간 탭에 반응하는 가격 2종 제외).
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
    fetchPublicNewsFeedCount()
      .then((total) => {
        if (!cancelled) setNewsTotal(total)
      })
      .catch((err) => {
        console.error('뉴스 건수 조회 실패', err)
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
  }, [])

  // 가격 차트·요약 카드만 기간 탭에 반응한다. 위 훅과 분리한 이유는 지도·뉴스·환율까지 탭을
  // 누를 때마다 다시 부를 이유가 없어서다. 둘을 반드시 **같은 days로** 부른다.
  useEffect(() => {
    let cancelled = false
    // 기간 탭을 바꾸면 다시 불러오므로 로딩을 되켠다. 초기값 true만으로는 첫 조회에만
    // 자리표시자가 뜨고, 이후 재조회는 이전 구간 데이터를 띄운 채로 조용히 바뀐다.
    setPriceLoading(true)
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
  }, [period])

  // 뉴스 목록은 페이지가 바뀔 때마다 다시 부른다. 위 공개 API 묶음에서 떼어낸 이유는 그쪽이
  // 마운트 1회용인데 여기만 newsPage에 의존하기 때문이다 — 같이 두면 화살표를 누를 때마다
  // 환율·지도·가격까지 전부 다시 불린다.
  useEffect(() => {
    let cancelled = false
    // 화살표로 페이지를 넘길 때마다 다시 불러오므로 로딩을 되켠다 — 이게 없으면 첫 조회
    // 이후로는 자리표시자가 영영 안 뜨고, 넘긴 뒤에도 이전 페이지 목록이 그대로 남아
    // "화살표가 안 먹는다"처럼 보인다.
    setNewsLoading(true)
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
  }, [newsPage])

  // 인증 API — 토큰이 준비된 뒤에만 부른다. RequireAuth가 이 화면을 지키므로 실제로는 항상
  // 값이 있지만, 없을 때 401을 만들지 않도록 가드를 둔다.
  //
  // `reloadKey`는 "대응 완료" 후 KPI와 원자재 요약을 다시 부르기 위한 것이다. 두 조회가 같은
  // 테이블(procurement_risk_assessments)을 서로 다른 기준으로 집계하므로, 한쪽만 갱신하면
  // 화면 안에서 건수와 표가 어긋난 채로 남는다.
  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    // "대응 완료" 후 reloadKey로 다시 부를 때도 자리표시자가 떠야 한다.
    setKpiLoading(true)
    setMaterialRiskLoading(true)
    setSupplierLoading(true)
    setMaterialsLoading(true)
    setAlertsLoading(true)
    setBriefingsLoading(true)
    setAcknowledgedLoading(true)
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
        if (!cancelled) setMaterials(overview.materials)
      })
      .catch((err) => {
        console.error('자재별 위험 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setMaterialsLoading(false)
      })
    fetchRiskMonitoringEvents(accessToken, { days: ALERT_EVENT_DAYS, limit: ALERT_EVENT_LIMIT })
      .then((events) => {
        if (!cancelled) setMonitoringEvents(events)
      })
      .catch((err) => {
        console.error('리스크 이벤트 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setAlertsLoading(false)
      })
    fetchRecentAiBriefings(accessToken, RECENT_BRIEFING_LIMIT)
      .then((items) => {
        if (!cancelled) setBriefings(items)
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
  }, [accessToken, reloadKey])

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
            expanded={alertsExpanded}
            onToggle={toggleAlertsExpanded}
            onMouseEnter={handlePreviewMouseEnter}
            onMouseLeave={handlePreviewMouseLeave}
          />
        }
      />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          {/* ── 목업에 있는 구성 (위) ─────────────────────────────── */}
          <PurchasingDashboardHeader asOfDate={exchangeRates.rate_date} />
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
              onSelectItem={(item) => setSelectedNews(fromRiskBoardItem(item))}
            />
          )}
          <LatestNewsPanel
            items={newsItems}
            isLoading={newsLoading}
            selectedId={selectedNews?.id}
            onSelect={(item) => setSelectedNews(fromNewsFeedItem(item))}
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
          />

          {/* 원자재 7종 · 최종 합성 점수(외부신호+ERP노출+계약공백). 아래 게이지 행과 자리가
              붙어 있지만 **점수의 뜻이 다르다** — 게이지는 ERP 노출도 단독 점수다. */}
          <div className={styles.materialRiskRow}>
            <MaterialRiskSummaryTable
              items={materialRiskSummary}
              isLoading={materialRiskLoading}
              pendingAssessmentId={pendingAssessmentId}
              onAcknowledge={handleAcknowledge}
            />
            {/* 왼쪽 표에서 "대응 완료"로 내려간 항목이 여기로 올라온다. 되돌릴 자리가 여기뿐이다. */}
            <AcknowledgedPanel
              items={acknowledged}
              isLoading={acknowledgedLoading}
              pendingAssessmentId={pendingAssessmentId}
              onUndo={handleUndoAcknowledge}
            />
          </div>

          {/* ── 목업에 없는 기존 구성 (아래) ───────────────────────
              목업이 화면 전체를 반영한 것이 아니라, 지우지 않고 아래로 내렸다. */}
          <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
          <MaterialRiskStatusPanel materials={materials} />
          <ErpImpactPanel materials={materials} />
          <PurchasePriorityPanel materials={materials} isLoading={materialsLoading} />
          <SupplierOverviewPanel overview={supplierOverview} isLoading={supplierLoading} />
        </main>
        <PageSectionDots variant="withAside" sections={SECTION_DOTS_SECTIONS} />
        <DashboardSidePanel
          selectedNews={selectedNews}
          isNewsLoading={newsLoading}
          isAlertsLoading={alertsLoading}
          isBriefingsLoading={briefingsLoading}
          alerts={alerts}
          briefings={briefings}
          expanded={alertsExpanded}
          isPreviewing={isPreviewing}
          onPreviewMouseEnter={handlePreviewMouseEnter}
          onPreviewMouseLeave={handlePreviewMouseLeave}
        />
      </div>
      <Footer />
    </div>
  )
}
