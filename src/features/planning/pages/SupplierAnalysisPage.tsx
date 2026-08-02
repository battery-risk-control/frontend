import { fetchSupplierAnalysisDashboard } from '../../../api/planning.api'
import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { EntityBadgeList } from '../components/EntityBadgeList'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './SupplierAnalysisPage.module.css'

/**
 * 2계층 공급사 분석 탭. 협력사별 리스크 이력 랭킹과 연결 사업부를 비교한다(product-overview.md
 * "협력사별 리스크 이력 추이" 요구사항에 직접 대응).
 */
export function SupplierAnalysisPage() {
  const dashboard = fetchSupplierAnalysisDashboard()

  const rankingItems = dashboard.ranking.map((item) => ({
    name: item.vendor_name,
    value: item.risk_count_90d,
    value_suffix: '건',
    tone: item.approved_status === 'REVIEW' ? ('warning' as const) : ('normal' as const),
  }))
  const topVendor = dashboard.ranking[0]
  const linkedUnitItems = (topVendor?.linked_units ?? []).map((unit) => ({
    name: unit,
    value: topVendor?.risk_count_90d ?? 0,
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
            <h1 className={styles.heading}>공급사 리스크 분석</h1>
            <p className={styles.subheading}>협력사별 리스크 이력과 사업부 연결 현황을 비교합니다</p>
          </div>
          <KpiSummaryCards items={dashboard.kpi_summary} />
          <div className={styles.grid2}>
            <RankedBarChart title="리스크 이력 랭킹" caption="최근 90일 이벤트 건수" items={rankingItems} />
            <RankedBarChart title="사업부 연결 현황" caption={`${topVendor?.vendor_name ?? ''} 기준`} items={linkedUnitItems} />
          </div>
          <EntityBadgeList title="적격 공급사 추천" items={dashboard.recommended} />
        </main>
      </div>
    </div>
  )
}
