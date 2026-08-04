import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { QueryState } from '../components/QueryState'
import { useDataQuality } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import { formatScore } from '../../../lib/formatScore'
import styles from './DataQualityPage.module.css'

/**
 * 2계층 데이터 품질 탭. 집계 수치를 얼마나 신뢰할지 판단하는 근거 — 경영기획팀 특유의
 * 관점(하이브리드 신뢰도 표시 원칙, product-overview.md)을 집계 레벨로 확장한 화면.
 */
export function DataQualityPage() {
  const query = useDataQuality()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>데이터 품질</h1>
            <p className={styles.subheading}>집계 수치를 얼마나 신뢰할지 판단하는 근거입니다</p>
          </div>
          <QueryState query={query}>
            {(status) => {
              // ERP 연동/RAG 인덱스/마지막 갱신은 숫자가 아닌 상태 텍스트라 숫자 전용인
              // KpiSummaryCards에 안 맞아 별도 상태 카드로 표시한다. 자재 커버리지만 진짜
              // 숫자라 KpiSummaryCards를 그대로 쓴다.
              const kpi_summary = [
                { label: '자재 커버리지', value: status.material_coverage_count, unit: `/${status.material_coverage_total}종` },
              ]
              const statusCards = [
                { label: 'ERP 연동', value: status.erp_sync_status },
                { label: 'RAG 인덱스', value: status.rag_index_status },
                { label: '마지막 갱신', value: status.last_updated_label },
              ]

              const confidenceItems = status.confidence_distribution.map((item) => ({
                name: item.label,
                value: item.ratio,
                value_suffix: '%',
                tone: item.label === '경고' ? ('warning' as const) : item.label === '확정' ? ('neutral' as const) : ('reference' as const),
              }))

              const warningRatio = status.confidence_distribution.find((item) => item.label === '경고')?.ratio ?? 0

              return (
                <>
                  <div className={styles.grid3}>
                    {statusCards.map((card) => (
                      <div key={card.label} className={styles.insightCard}>
                        <h2 className={styles.insightTitle}>{card.label}</h2>
                        <p className={styles.insightBody}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <KpiSummaryCards items={kpi_summary} />
                  <RankedBarChart
                    title="신뢰도 라벨 분포"
                    caption="확정/참고/경고"
                    items={confidenceItems}
                    legend={[
                      { tone: 'neutral', label: '확정' },
                      { tone: 'reference', label: '참고' },
                      { tone: 'warning', label: '경고' },
                    ]}
                  />
                  <div className={styles.insightCard}>
                    <h2 className={styles.insightTitle}>주의</h2>
                    <p className={styles.insightBody}>
                      경고 라벨 비중 {formatScore(warningRatio)}% — 출처 교차검증 실패 건은 의사결정 시 참고 정도로만 활용을 권고합니다.
                    </p>
                  </div>
                </>
              )
            }}
          </QueryState>
        </main>
      </div>
    </div>
  )
}
