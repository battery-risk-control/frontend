import { useEffect, useRef, useState } from 'react'
import {
  fetchPublicExchangeRates,
  fetchPublicImportDependency,
  fetchPublicNewsFeed,
  fetchPublicPriceSummaries,
  fetchPublicPriceTrends,
  fetchPublicRiskBoard,
} from '../../../api/public.api'
import {
  fetchPurchasingKpiSummary,
  toMaterialRiskGauges,
  toScoreCards,
} from '../../../api/purchasingDashboard.api'
import { fetchMaterialRiskOverview } from '../../../api/materialRisk.api'
import { fetchRiskMonitoringEvents } from '../../../api/riskMonitoring.api'
import { fetchRecentAiBriefings } from '../../../api/aiBriefing.api'
import type {
  AiBriefingListItem,
  ExchangeRateBoard,
  GlobalRiskBoardItem,
  ImportDependencyData,
  MaterialPriceSeries,
  MaterialPriceSummary,
  MaterialRiskItem,
  NewsFeedItem,
  PurchasingKpiSummary,
  RiskMonitoringEvent,
  SelectedArticle,
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

/** 마퀴에 흘릴 헤드라인 수. 목업 기준이며 아래 "최신 뉴스" 목록과 같은 응답을 잘라 쓴다. */
const MARQUEE_COUNT = 5

/** "최신 뉴스" 목록에 요청할 건수. 백엔드가 1~100으로 강제로 자른다. */
const NEWS_FEED_LIMIT = 20

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
  { id: '원자재 리스크 요약', headingId: 'material-risk-summary-heading' },
  { id: '원자재 공급사 리스크 현황', headingId: 'material-risk-heading' },
  { id: 'ERP 영향', headingId: 'erp-impact-heading' },
  { id: '구매 대응 우선순위', headingId: 'purchase-priority-heading' },
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
  const [materials, setMaterials] = useState<MaterialRiskItem[]>([])
  const [monitoringEvents, setMonitoringEvents] = useState<RiskMonitoringEvent[]>([])
  const [briefings, setBriefings] = useState<AiBriefingListItem[]>([])

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
    fetchPublicNewsFeed(NEWS_FEED_LIMIT)
      .then((items) => {
        if (cancelled) return
        setNewsItems(items)
        // 목업처럼 첫 기사를 미리 띄워 우측 패널이 빈 채로 시작하지 않게 한다.
        // 이미 사용자가 지도 마커를 눌러 골랐다면 덮어쓰지 않는다.
        setSelectedNews((current) => current ?? (items[0] ? fromNewsFeedItem(items[0]) : null))
      })
      .catch((err) => {
        console.error('뉴스 속보 조회 실패', err)
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
    const days = PERIOD_DAYS[period]
    fetchPublicPriceTrends(days)
      .then((series) => {
        if (!cancelled) setPriceSeries(series)
      })
      .catch((err) => {
        console.error('원자재 가격 추이 조회 실패', err)
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

  // 인증 API — 토큰이 준비된 뒤에만 부른다. RequireAuth가 이 화면을 지키므로 실제로는 항상
  // 값이 있지만, 없을 때 401을 만들지 않도록 가드를 둔다.
  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    fetchPurchasingKpiSummary(accessToken)
      .then((summary) => {
        if (!cancelled) setKpi(summary)
      })
      .catch((err) => {
        console.error('KPI 요약 조회 실패', err)
      })
    fetchMaterialRiskOverview(accessToken)
      .then((overview) => {
        if (!cancelled) setMaterials(overview.materials)
      })
      .catch((err) => {
        console.error('자재별 위험 조회 실패', err)
      })
    fetchRiskMonitoringEvents(accessToken, { days: ALERT_EVENT_DAYS, limit: ALERT_EVENT_LIMIT })
      .then((events) => {
        if (!cancelled) setMonitoringEvents(events)
      })
      .catch((err) => {
        console.error('리스크 이벤트 조회 실패', err)
      })
    fetchRecentAiBriefings(accessToken, RECENT_BRIEFING_LIMIT)
      .then((items) => {
        if (!cancelled) setBriefings(items)
      })
      .catch((err) => {
        console.error('최근 브리핑 조회 실패', err)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken])

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
          <PurchasingKpiRow kpi={kpi} />
          {/* 환율은 한 종을 골라 넘기지 않는다 — 어느 통화를 보여줄지는 마퀴가 순환으로 정한다.
              USD만 넘기던 예전 방식에서는 수집해 둔 28종 중 27종이 화면에 안 나왔다. */}
          <LiveNewsMarquee items={newsItems.slice(0, MARQUEE_COUNT)} rates={exchangeRates.rates} />
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
            selectedId={selectedNews?.id}
            onSelect={(item) => setSelectedNews(fromNewsFeedItem(item))}
          />
          <ImportDependencyRow
            importDependency={importDependency}
            priceSeries={priceSeries}
            priceSummaries={priceSummaries}
            period={period}
            onPeriodChange={setPeriod}
          />

          {/* ── 목업에 없는 기존 구성 (아래) ───────────────────────
              목업이 화면 전체를 반영한 것이 아니라, 지우지 않고 아래로 내렸다. */}
          <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
          <MaterialRiskStatusPanel materials={materials} />
          <ErpImpactPanel materials={materials} />
          <PurchasePriorityPanel materials={materials} />
        </main>
        <PageSectionDots variant="withAside" sections={SECTION_DOTS_SECTIONS} />
        <DashboardSidePanel
          selectedNews={selectedNews}
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
