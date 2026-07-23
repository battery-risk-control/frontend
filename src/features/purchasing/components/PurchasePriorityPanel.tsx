import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { RiskEvent, RiskGrade } from '../../../api/types'
import styles from './PurchasePriorityPanel.module.css'

interface PurchasePriorityPanelProps {
  events: RiskEvent[]
}

const GRADE_SEVERITY: Record<RiskGrade, number> = {
  심각: 3,
  주의: 2,
  정상: 1,
}

/**
 * 구매 대응 우선순위. 별도 우선순위 스키마가 없으므로 risk_event 목록을
 * 등급(심각 > 주의 > 정상) → 재고 소진 일수(적을수록 긴급) 순으로 정렬해 파생한다.
 *
 * 사용 예:
 *   <PurchasePriorityPanel events={events} />
 */
export function PurchasePriorityPanel({ events }: PurchasePriorityPanelProps) {
  const ranked = [...events].sort((a, b) => {
    const severityDiff = GRADE_SEVERITY[b.grade] - GRADE_SEVERITY[a.grade]
    if (severityDiff !== 0) return severityDiff
    return a.erp_view.safety_stock_days - b.erp_view.safety_stock_days
  })

  return (
    <ScrollCard headingId="purchase-priority-heading" title="구매 대응 우선순위">
      <ol className={styles.list}>
        {ranked.map((event, index) => (
          <li key={event.risk_event_id} className={styles.item}>
            <span className={styles.rank}>{index + 1}</span>
            <div className={styles.body}>
              <span className={styles.material}>{event.market_context.material}</span>
              <span className={styles.stockDays}>재고 소진까지 {event.erp_view.safety_stock_days}일</span>
              {event.erp_view.alt_sourcing_candidates[0] && (
                <span className={styles.recommendation}>
                  권장 대체 공급사: {event.erp_view.alt_sourcing_candidates[0]}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </ScrollCard>
  )
}
