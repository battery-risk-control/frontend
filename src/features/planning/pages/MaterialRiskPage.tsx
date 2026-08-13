import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { QueryState } from '../components/QueryState'
import { useMaterialRisk } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './MaterialRiskPage.module.css'

const GRADE_TONE = { 심각: 'critical', 주의: 'warning', 정상: 'normal' } as const

/**
 * 2계층 자재 위험 탭. 전사 자재 순위 + 최고 위험 자재의 사업부별 노출 매트릭스를 비교해
 * 대응 우선순위를 정한다(1계층 원자재 위험 화면은 자재 1건 단위 상세 조회 중심이라 다름).
 */
export function MaterialRiskPage() {
  const query = useMaterialRisk()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>자재 위험 심층 분석</h1>
            <p className={styles.subheading}>자재별 위험도와 사업부 노출을 비교해 대응 우선순위를 정합니다</p>
          </div>
          <QueryState query={query}>
            {(dashboard) => {
              const rankingItems = dashboard.ranking.map((item) => ({
                name: item.material,
                value: item.score,
                value_suffix: '점',
                tone: GRADE_TONE[item.grade],
              }))
              const unitExposureItems = dashboard.top_material_unit_exposure.map((item) => ({
                name: item.business_unit,
                value: item.exposure_score,
                value_suffix: '점',
              }))

              return (
                <>
                  <KpiSummaryCards items={dashboard.kpi_summary} />
                  <div className={styles.grid2}>
                    <RankedBarChart title="자재별 위험 순위" caption="전사 기준 위험 점수" items={rankingItems} />
                    <RankedBarChart
                      title="사업부별 노출 매트릭스"
                      caption="소속 자재 평균 위험 점수"
                      items={unitExposureItems}
                    />
                  </div>
                  <div className={styles.insightCard}>
                    <h2 className={styles.insightTitle}>분기 대비 변화</h2>
                    <p className={styles.insightBody}>{dashboard.quarter_change_label}</p>
                  </div>
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
