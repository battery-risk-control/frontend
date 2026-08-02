import { fetchAiBriefingSummaryDashboard } from '../../../api/planning.api'
import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './AiBriefingSummaryPage.module.css'

/**
 * 2계층 AI 브리핑 탭. 1계층이 생성한 브리핑을 등급·사업부 단위로 취합해 보고한다(생성이
 * 아니라 취합·보고 역할 — product-overview.md 2계층 책임 정의와 일치).
 */
export function AiBriefingSummaryPage() {
  const dashboard = fetchAiBriefingSummaryDashboard()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>AI 브리핑 취합</h1>
            <p className={styles.subheading}>1계층이 생성한 브리핑을 등급·사업부 단위로 취합해 보고합니다</p>
          </div>
          <KpiSummaryCards items={dashboard.kpi_summary} />
          <div className={styles.grid2}>
            <RankedBarChart title="사업부별 브리핑 분포" items={dashboard.by_unit} />
            <section className={styles.insightCard} aria-labelledby="recent-briefings-heading">
              <h2 id="recent-briefings-heading" className={styles.insightTitle}>
                최근 브리핑
              </h2>
              <ul className={styles.briefingList}>
                {dashboard.recent.map((item) => (
                  <li key={item.risk_event_id} className={styles.briefingItem}>
                    <div className={styles.briefingHeader}>
                      <RiskGradeBadge grade={item.grade} />
                      <span className={styles.briefingUnit}>{item.business_unit}</span>
                    </div>
                    <p className={styles.briefingHeadline}>{item.headline}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
