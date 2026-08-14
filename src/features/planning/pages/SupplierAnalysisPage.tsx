import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { QueryState } from '../components/QueryState'
import { useSupplierAnalysis } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './SupplierAnalysisPage.module.css'

/**
 * 2계층 공급사 분석 탭. 협력사별 리스크 이력 랭킹과 연결 사업부를 비교한다(product-overview.md
 * "협력사별 리스크 이력 추이" 요구사항에 직접 대응).
 */
export function SupplierAnalysisPage() {
  const query = useSupplierAnalysis()

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
          <QueryState query={query}>
            {(dashboard) => {
              const rankingItems = dashboard.ranking.map((item) => ({
                name: item.vendor_name,
                value: item.risk_count_90d,
                value_suffix: '건',
                tone: item.approved_status === 'REVIEW' ? ('warning' as const) : ('normal' as const),
              }))
              // 사업부 연결 현황 — 공급사 개별(14곳)로 보면 항목이 너무 많아지므로, 연결된
              // 사업부 단위로 리스크 이력 건수를 합산해 보여준다(1위 공급사만 보여주던 것에서 확장).
              const riskByUnit = new Map<string, number>()
              for (const vendor of dashboard.ranking) {
                for (const unit of vendor.linked_units) {
                  riskByUnit.set(unit, (riskByUnit.get(unit) ?? 0) + vendor.risk_count_90d)
                }
              }
              const linkedUnitItems = Array.from(riskByUnit.entries()).map(([unit, riskCount]) => ({
                name: unit,
                value: riskCount,
                value_suffix: '건',
                tone: 'neutral' as const,
              }))

              return (
                <>
                  <KpiSummaryCards items={dashboard.kpi_summary} />
                  <div className={styles.grid2}>
                    <RankedBarChart
                      title="리스크 이력 랭킹"
                      caption="최근 90일 이벤트 건수"
                      items={rankingItems}
                      legend={[
                        { tone: 'warning', label: 'REVIEW' },
                        { tone: 'normal', label: 'APPROVED' },
                      ]}
                    />
                    <RankedBarChart
                      title="사업부 연결 현황"
                      caption="연결 공급사 리스크 이력 합계"
                      items={linkedUnitItems}
                    />
                  </div>
                  <section className={styles.insightCard} aria-labelledby="supplier-list-heading">
                    <h2 id="supplier-list-heading" className={styles.insightTitle}>공급사 리스트</h2>
                    <ul className={styles.supplierList}>
                      {dashboard.ranking.map((supplier) => (
                        <li key={supplier.vendor_id} className={styles.supplierItem}>
                          <div><strong>{supplier.vendor_name}</strong><span>{supplier.linked_units.join(' · ')}</span></div>
                          <div><span>최근 90일 {supplier.risk_count_90d}건</span><b>{supplier.approved_status}</b></div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )
            }}
          </QueryState>
        </main>
      </div>
      <Footer />
    </div>
  )
}
