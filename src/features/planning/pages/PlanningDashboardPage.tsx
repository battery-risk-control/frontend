import { useCallback, useMemo, useState } from 'react'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { SidePanelToggleButton } from '../../../components/layout/SidePanelToggleButton'
import { DashboardSidePanel } from '../../purchasing/components/DashboardSidePanel'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { ComparisonChart } from '../components/ComparisonChart'
import { VendorRiskHistory } from '../components/VendorRiskHistory'
import { QueryState } from '../components/QueryState'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { useStrategyDashboard, useGlobalRiskBoard } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import { useAlertsPanelState } from '../../../lib/useAlertsPanelState'
import { fromRiskBoardItem } from '../../../lib/selectedArticle'
import type { SelectedArticle } from '../../../api/types'
import styles from './PlanningDashboardPage.module.css'

const ALL_UNITS = '전체'

/**
 * 2계층 경영기획팀 대시보드 (Seq 25) — "전략 대시보드" 탭. Figma "경영기획팀 대시보드" 프레임
 * 기준으로 좌측 사이드바(7탭 공용, `PLANNING_SIDE_NAV_ITEMS`) + 단일 컬럼(KPI 요약 카드 →
 * 핵심 시각화 및 비교 → 협력사 리스크 이력 및 탐색) 구조를 따른다.
 */
export function PlanningDashboardPage() {
  const query = useStrategyDashboard()
  const mapQuery = useGlobalRiskBoard()
  const [selectedUnit] = useState(ALL_UNITS)
  const [selectedNews, setSelectedNews] = useState<SelectedArticle | null>(null)

  const { expanded: alertsExpanded, open: openAlertsPanel } = useAlertsPanelState()

  const handleSelectArticle = useCallback(
    (article: SelectedArticle) => {
      setSelectedNews(article)
      openAlertsPanel()
    },
    [openAlertsPanel]
  )

  const filteredExposure = useMemo(() => {
    if (!query.data) return []
    if (selectedUnit === ALL_UNITS) return query.data.risk_exposure_by_unit
    return query.data.risk_exposure_by_unit.filter((item) => item.business_unit === selectedUnit)
  }, [query.data, selectedUnit])

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <header className={styles.topBar}>
            <h1 className={styles.heading}>경영기획팀 대시보드</h1>
            <div className={styles.filters}>
              <span className={styles.staticUnitLabel}>사업부 전체</span>
            </div>
          </header>
          <QueryState query={query}>
            {(dashboard) => <KpiSummaryCards items={dashboard.kpi_summary} />}
          </QueryState>
          <QueryState query={mapQuery}>
            {(items) => (
              <GlobalRiskBoard
                items={items}
                onSelectItem={(item) => handleSelectArticle(fromRiskBoardItem(item))}
              />
            )}
          </QueryState>
          <QueryState query={query}>
            {(dashboard) => (
              <>
                <ComparisonChart items={filteredExposure} />
                <VendorRiskHistory items={dashboard.vendor_risk_history} />
              </>
            )}
          </QueryState>
        </main>
        <SidePanelToggleButton />
        <DashboardSidePanel
          selectedNews={selectedNews}
          alerts={[]}
          briefings={[]}
          expanded={alertsExpanded}
          isPreviewing={false}
          onPreviewMouseEnter={() => {}}
          onPreviewMouseLeave={() => {}}
          showUploadCard={false}
          // 경영기획팀엔 리스크 모니터링 화면이 없어 "전체 보기"·기사 브리핑 버튼을 모두
          // 경영기획팀 AI 브리핑(/planning/briefings)으로 보낸다(구매팀 전용 라우트로 넘어가
          // RequireAuth 계층 불일치 모달이 뜨던 문제 해소).
          alertsMoreTo="/planning/briefings"
          newsBriefingLabel="이 기사의 브리핑 확인"
          newsBriefingTo={() => '/planning/briefings'}
        />
      </div>
      <Footer />
    </div>
  )
}
