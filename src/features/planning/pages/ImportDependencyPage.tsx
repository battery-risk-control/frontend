import { fetchImportDependencyDashboard } from '../../../api/planning.api'
import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { EntityBadgeList } from '../components/EntityBadgeList'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './ImportDependencyPage.module.css'

/**
 * 2계층 수입 의존도 탭. 국가·사업부 이중 관점에서 공급망 집중도를 점검한다(1계층 수입
 * 의존도 패널은 자재 1건의 국가 breakdown만 보여줘 사업부 축이 없음).
 */
export function ImportDependencyPage() {
  const dashboard = fetchImportDependencyDashboard()

  const countryItems = dashboard.by_country.map((item) => ({
    name: item.country,
    value: item.share_ratio,
    value_suffix: '%',
    tone: item.share_ratio >= 80 ? ('critical' as const) : item.share_ratio >= 55 ? ('warning' as const) : ('normal' as const),
  }))
  const unitItems = dashboard.by_unit.map((item) => ({
    name: item.business_unit,
    value: item.share_ratio,
    value_suffix: '%',
    tone: item.share_ratio >= 80 ? ('critical' as const) : ('normal' as const),
  }))

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>수입 의존도 분석</h1>
            <p className={styles.subheading}>국가·사업부 이중 관점에서 공급망 집중도를 점검합니다</p>
          </div>
          <KpiSummaryCards items={dashboard.kpi_summary} />
          <div className={styles.grid2}>
            <RankedBarChart title="국가별 의존도" caption="전 자재 가중 평균" items={countryItems} />
            <RankedBarChart title="사업부별 의존 매트릭스" caption={`${dashboard.by_country[0]?.country ?? ''} 기준`} items={unitItems} />
          </div>
          <EntityBadgeList title="대체 공급망 후보" items={dashboard.alternative_suppliers} />
        </main>
      </div>
    </div>
  )
}
