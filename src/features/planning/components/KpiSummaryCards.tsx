import type { KpiSummaryItem } from '../../../api/types'
import styles from './KpiSummaryCards.module.css'

interface KpiSummaryCardsProps {
  items: KpiSummaryItem[]
}

/**
 * KPI 요약 카드. kpi_summary 배열을 그대로 카드로 렌더링한다 —
 * 카드 개수가 바뀌어도 컴포넌트 수정 없이 대응 가능(mock-schemas.md 설계 의도).
 *
 * 사용 예:
 *   <KpiSummaryCards items={dashboard.kpi_summary} />
 */
export function KpiSummaryCards({ items }: KpiSummaryCardsProps) {
  return (
    <section className={styles.panel} aria-labelledby="kpi-summary-cards-heading">
      <h2 id="kpi-summary-cards-heading" className={styles.title}>
        KPI 요약 카드
      </h2>
      <div className={styles.cards}>
        {items.map((item) => (
          <div key={item.label} className={styles.card}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>
              {item.value}
              <span className={styles.unit}>{item.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
