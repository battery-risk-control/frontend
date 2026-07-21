import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { RiskEvent } from '../../../api/types'
import styles from './AlertsPanel.module.css'

interface AlertsPanelProps {
  events: RiskEvent[]
}

/**
 * 주요 알림 및 빠른 작업. 등급이 '심각'이거나 신뢰도가 '경고'인 risk_event를 우선 노출한다.
 *
 * 사용 예:
 *   <AlertsPanel events={events} />
 */
export function AlertsPanel({ events }: AlertsPanelProps) {
  const alerts = events.filter((event) => event.grade === '심각' || event.confidence_label === '경고')

  return (
    <aside className={styles.panel} aria-labelledby="alerts-heading">
      <h2 id="alerts-heading" className={styles.title}>
        주요 알림 및 빠른 작업
      </h2>
      {alerts.length === 0 ? (
        <p className={styles.empty}>표시할 알림이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {alerts.map((event) => (
            <li key={event.risk_event_id} className={styles.item}>
              <div className={styles.badges}>
                <RiskGradeBadge grade={event.grade} />
                <ConfidenceBadge label={event.confidence_label} />
              </div>
              <p className={styles.summary}>{event.market_context.event_summary}</p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
