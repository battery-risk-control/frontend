import type { RiskEvent } from '../../../api/types'
import styles from './KpiSummaryPanel.module.css'

interface KpiSummaryPanelProps {
  events: RiskEvent[]
}

/**
 * 상단 KPI 요약. risk_event 목록에서 등급별 건수를 집계해 보여준다.
 *
 * 사용 예:
 *   <KpiSummaryPanel events={events} />
 */
export function KpiSummaryPanel({ events }: KpiSummaryPanelProps) {
  const criticalCount = events.filter((event) => event.grade === '심각').length
  const warningCount = events.filter((event) => event.grade === '주의').length
  const normalCount = events.filter((event) => event.grade === '정상').length

  return (
    <section className={styles.panel} aria-labelledby="kpi-summary-heading">
      <h2 id="kpi-summary-heading" className={styles.title}>
        상단 KPI 요약
      </h2>
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.label}>전체 리스크</dt>
          <dd className={styles.value}>{events.length}건</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>심각</dt>
          <dd className={`${styles.value} ${styles.critical}`}>{criticalCount}건</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>주의</dt>
          <dd className={`${styles.value} ${styles.warning}`}>{warningCount}건</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>정상</dt>
          <dd className={`${styles.value} ${styles.normal}`}>{normalCount}건</dd>
        </div>
      </dl>
    </section>
  )
}
