import { fetchPlanningDashboard } from '../../../api/planning.api'
import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { ComparisonChart } from '../components/ComparisonChart'
import { VendorRiskHistory } from '../components/VendorRiskHistory'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './PlanningDashboardPage.module.css'

/**
 * 2계층 경영기획팀 대시보드 (Seq 25) — "전략 대시보드" 탭. Figma "경영기획팀 대시보드" 프레임
 * 기준으로 좌측 사이드바(7탭 공용, `PLANNING_SIDE_NAV_ITEMS`) + 단일 컬럼(KPI 요약 카드 →
 * 핵심 시각화 및 비교 → 협력사 리스크 이력 및 탐색) 구조를 따른다. 2026-08-02 — 사이드바를
 * 2항목 해시 placeholder에서 7탭 실제 라우트로 확장.
 */
export function PlanningDashboardPage() {
  const dashboard = fetchPlanningDashboard()

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
              <span className={styles.filterPill}>사업부 전체</span>
              <span className={styles.filterPill}>2026년 2분기</span>
              <span className={styles.filterPill}>달력</span>
              <span className={styles.filterPill}>알림</span>
            </div>
          </header>
          <KpiSummaryCards items={dashboard.kpi_summary} />
          <ComparisonChart items={dashboard.risk_exposure_by_unit} />
          <VendorRiskHistory items={dashboard.vendor_risk_history} />
        </main>
      </div>
    </div>
  )
}
