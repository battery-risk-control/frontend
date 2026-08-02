import { fetchContractStatusDashboard } from '../../../api/planning.api'
import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { EntityBadgeList } from '../components/EntityBadgeList'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './ContractStatusPage.module.css'

/**
 * 2계층 계약 현황 탭. 사업부별 계약 커버리지와 만료 리스크를 전사 관점에서 본다(1계층
 * 계약·RAG는 조항 검색 중심이라 사업부 축이 없음).
 */
export function ContractStatusPage() {
  const dashboard = fetchContractStatusDashboard()

  const coverageItems = dashboard.coverage_by_unit.map((item) => ({
    name: item.business_unit,
    value: item.contract_count,
    value_suffix: '건',
    tone: 'neutral' as const,
  }))

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>계약 현황</h1>
            <p className={styles.subheading}>사업부별 계약 커버리지와 만료 리스크를 전사 관점에서 봅니다</p>
          </div>
          <KpiSummaryCards items={dashboard.kpi_summary} />
          <div className={styles.grid2}>
            <RankedBarChart title="사업부별 계약 커버리지" items={coverageItems} />
            <EntityBadgeList title="만료 임박 계약" items={dashboard.expiring} />
          </div>
        </main>
      </div>
    </div>
  )
}
