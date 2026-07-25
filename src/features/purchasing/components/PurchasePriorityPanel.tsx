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
    <ScrollCard
      headingId="purchase-priority-heading"
      title="구매 대응 우선순위"
      // mock 임시값 — 리스트 항목 4개 초과 시 스크롤 트리거용 실측 높이(design-tokens.md
      // "카드 레이아웃·스크롤 규칙" d). 현재 mock 6건 기준 실측(4개+gap3=364px)에 여유를
      // 둔 값 — 항목 내용이 크게 바뀌면 재측정 필요.
      maxBodyHeight={368}
    >
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
