import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { RiskEvent } from '../../../api/types'
import styles from './MaterialRiskStatusPanel.module.css'

interface MaterialRiskStatusPanelProps {
  events: RiskEvent[]
}

/**
 * 원자재 공급사 리스크 현황. risk_event 목록을 나열하고 각 항목에
 * RiskGradeBadge/ConfidenceBadge로 등급·신뢰도를 함께 표시한다.
 *
 * 사용 예:
 *   <MaterialRiskStatusPanel events={events} />
 */
export function MaterialRiskStatusPanel({ events }: MaterialRiskStatusPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="material-risk-heading">
      <h2 id="material-risk-heading" className={styles.title}>
        원자재 공급사 리스크 현황
      </h2>
      <ul className={styles.list}>
        {events.map((event) => (
          <li key={event.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.material}>{event.market_context.material}</span>
              <span className={styles.materialCode}>{event.erp_view.affected_material_code}</span>
              <RiskGradeBadge grade={event.grade} />
              <ConfidenceBadge label={event.confidence_label} />
            </div>
            <p className={styles.summary}>{event.market_context.event_summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
