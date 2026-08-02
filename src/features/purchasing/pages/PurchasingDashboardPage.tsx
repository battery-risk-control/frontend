import { useEffect, useRef, useState } from 'react'
import {
  fetchExchangeRates,
  fetchGlobalRiskBoard,
  fetchImportDependency,
  fetchMaterialPriceSummaries,
  fetchMaterialPriceTrends,
  fetchMaterialRiskGauges,
  fetchNewsFeed,
  fetchRiskEvents,
  fetchScoreCards,
} from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { AlertsBellButton } from '../../../components/layout/AlertsBellButton'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import type { SelectedDetail } from '../../../components/widgets/GlobalRiskBoard'
import { SupplyNewsFeed } from '../../../components/widgets/SupplyNewsFeed'
import { PageSectionDots } from '../../../components/ui/PageSectionDots/PageSectionDots'
import { useAlertsPanelState } from '../../../lib/useAlertsPanelState'
import { selectAlertEvents } from '../../../lib/selectAlertEvents'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { KpiSummaryPanel } from '../components/KpiSummaryPanel'
import { NewsExchangeTicker } from '../components/NewsExchangeTicker'
import { MaterialRiskOverviewSection } from '../components/MaterialRiskOverviewSection'
import { ImportDependencyRow } from '../components/ImportDependencyRow'
import { AlertsPanel } from '../components/AlertsPanel'
import styles from './PurchasingDashboardPage.module.css'

/** 관제 맵 확대 배율(2차 데모) — 기존 220px 기준 1.5배. GlobalRiskBoard는 공개 대시보드와
 * 공유하는 컴포넌트라 CSS 기본값을 직접 바꾸지 않고 prop으로 이 화면에만 override한다. */
const GLOBAL_RISK_BOARD_MAP_HEIGHT = 330

/** 미리보기 표시/숨김 디바운스 — 트리거(헤더 벨)와 콘텐츠(AlertsPanel 미리보기)가 화면상
 * 떨어져 있어(도트 인디케이터처럼 인접하지 않음) DOM 포함 관계 트릭 대신, 둘 중 하나라도
 * 호버 중이면 유지하고 둘 다 벗어난 뒤 이 시간만큼 지나야 닫는 디바운스 방식을 쓴다. */
const PREVIEW_CLOSE_DELAY_MS = 150

// alerts-heading(우측 알림 패널)/quick-actions-heading(빠른 작업 패널)은 항상 뷰포트 밖으로
// 스크롤되지 않는 별도 영역이라 제외. 2차 데모 재배치(2026-07-29)에 맞춰 갱신 — 원자재
// 공급사 리스크 현황/ERP 영향/구매 대응 우선순위는 본문에서 제거돼 제외, 뉴스속보 티커/
// 실시간 뉴스 목록을 신규 추가.
const SECTION_DOTS_SECTIONS = [
  { id: '상단 KPI 요약', headingId: 'kpi-summary-heading' },
  { id: '뉴스속보 티커', headingId: 'news-exchange-ticker-heading' },
  { id: '글로벌 리스크 맵', headingId: 'global-risk-board-heading' },
  { id: '실시간 뉴스 목록', headingId: 'supply-news-feed-heading' },
  { id: '수입 의존도', headingId: 'import-dependency-heading' },
  { id: '원자재 가격 추이', headingId: 'material-price-detail-heading' },
  { id: '원자재 리스크 요약', headingId: 'material-risk-summary-heading' },
]

/**
 * 1계층 구매팀 대시보드 (Seq 24). 2차 데모(2026-07-29) 재배치 — 좌측 사이드바(`PURCHASING_
 * SIDE_NAV_ITEMS`, `lib/purchasingNav.ts` 공용 정의) + 단일 컬럼 본문 + 우측 알림 패널
 * (`AlertsPanel`, "주요 알림"/"빠른 작업" 두 서브섹션 — 수정 1, `QuickActionsPanel`은 별도
 * 형제가 아니라 이 패널의 자식). 본문 순서: KPI 요약 → 뉴스속보·환율정보 롤링 티커
 * (`NewsExchangeTicker`) → 글로벌 리스크 관제 맵(1.5배 확대) → 실시간 뉴스 목록(승격된
 * `SupplyNewsFeed`, 필터링 없음) → 수입 의존도+가격 추이 → 원자재 리스크 요약(기존 2번
 * 위치에서 맨 아래로 이동). 원자재 공급사 리스크 현황/ERP 영향/구매 대응 우선순위는 Phase
 * 11(2026-07-29)에서 SideNav 전용으로 이동한다며 본문에서 제거됐으나 실제로는 SideNav
 * 연결이 끝나지 않아 어디에도 렌더링되지 않는 상태로 방치돼 있었다(`MaterialRiskStatusPanel`/
 * `ErpImpactPanel`/`PurchasePriorityPanel` 컴포넌트 자체는 그대로 유지) — 2026-08-02,
 * `/purchasing/material-risk`·`/purchasing/erp-impact`·`/purchasing/priority` 실제
 * 라우트로 연결해 해결(C3 부분 해결, `docs/roadmap-candidates.md` 참고). 뉴스 티커·실시간
 * 뉴스 목록 모두 `fetchNewsFeed()` 하나를 표현만 다르게(롤링 / 정적 리스트) 재사용한다(신규
 * 뉴스 함수 없음).
 *
 * 알림 패널(`AlertsPanel`)의 펼침/접힘은 `AlertsPanelContext`(페이지 이동 간 유지)로,
 * 접힌 상태에서 헤더 벨(`AlertsBellButton`) 호버 시 뜨는 미리보기는 이 페이지의 로컬
 * `isPreviewing` 상태로 관리한다(2026-07-27, 오류 및 기능 미흡 발견 #7) — 트리거(헤더,
 * 최상단)와 콘텐츠(AlertsPanel, 우측 sticky 컬럼)가 화면상 떨어져 있어 도트 인디케이터의
 * DOM 포함 관계 트릭 대신, 트리거·콘텐츠 어느 쪽을 호버해도 유지되고 둘 다 벗어난 뒤
 * `PREVIEW_CLOSE_DELAY_MS`만큼 지나야 닫히는 디바운스 방식을 쓴다. `Escape`로도 닫힌다.
 */
export function PurchasingDashboardPage() {
  const events = fetchRiskEvents()
  const gauges = fetchMaterialRiskGauges()
  const scoreCards = fetchScoreCards()
  const riskBoardItems = fetchGlobalRiskBoard()
  const importDependency = fetchImportDependency()
  const priceSeries = fetchMaterialPriceTrends()
  const priceSummaries = fetchMaterialPriceSummaries()
  const newsItems = fetchNewsFeed()
  const exchangeRates = fetchExchangeRates()
  const alerts = selectAlertEvents(events)

  const {
    expanded: alertsExpanded,
    isNarrowViewport: alertsPanelNarrowViewport,
    toggle: toggleAlertsExpanded,
    expand: expandAlerts,
  } = useAlertsPanelState()
  const [isPreviewing, setIsPreviewing] = useState(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 마커/국가 클릭 결과(2차 데모 수정 2-3) — GlobalRiskBoard의 onSelect 콜백으로 받아
  // AlertsPanel의 "빠른 작업 > 마커뉴스" 서브섹션으로 그대로 내려준다.
  const [markerNews, setMarkerNews] = useState<SelectedDetail | null>(null)

  function handleMarkerSelect(detail: SelectedDetail | null) {
    setMarkerNews(detail)
    // 접혀있어도 마커 클릭 시 자동 펼침(2-4) — toggle이 아니라 expand(강제 펼침)를 써야
    // 이미 펼쳐진 상태에서 또 클릭해도 접히지 않는다.
    if (detail) expandAlerts()
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
            disabled={alertsPanelNarrowViewport}
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
          <h1 className={styles.heading}>구매팀 대시보드</h1>
          <KpiSummaryPanel events={events} />
          <NewsExchangeTicker news={newsItems} exchangeRates={exchangeRates} />
          <GlobalRiskBoard
            items={riskBoardItems}
            mapHeight={GLOBAL_RISK_BOARD_MAP_HEIGHT}
            onSelect={handleMarkerSelect}
          />
          <SupplyNewsFeed items={newsItems} />
          <ImportDependencyRow
            importDependency={importDependency}
            priceSeries={priceSeries}
            priceSummaries={priceSummaries}
          />
          <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
        </main>
        <PageSectionDots variant="withAside" sections={SECTION_DOTS_SECTIONS} />
        <AlertsPanel
          expanded={alertsExpanded}
          isPreviewing={isPreviewing}
          onPreviewMouseEnter={handlePreviewMouseEnter}
          onPreviewMouseLeave={handlePreviewMouseLeave}
          markerNews={markerNews}
          onCloseMarkerNews={() => setMarkerNews(null)}
        />
      </div>
      <Footer />
    </div>
  )
}
