import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { RiskEvent } from '../../../api/types'
import styles from './ErpImpactPanel.module.css'

interface ErpImpactPanelProps {
  events: RiskEvent[]
}

/**
 * ERP 영향 자재 재고 계약 분석. erp_view(재고 소진 일수, 대체 공급사 후보)와
 * quality_check(품질 인증 기준 충족 여부)를 함께 보여준다.
 *
 * 사용 예:
 *   <ErpImpactPanel events={events} />
 */
export function ErpImpactPanel({ events }: ErpImpactPanelProps) {
  return (
    <ScrollCard
      headingId="erp-impact-heading"
      title="ERP 영향 자재 재고 계약 분석"
      // mock 임시값 — 리스트 항목 4개 초과 시 스크롤 트리거용 실측 높이(design-tokens.md
      // "카드 레이아웃·스크롤 규칙" d). 현재 mock 6건 기준 실측(4개+gap3=354px)에 여유를
      // 둔 값 — 항목 내용이 크게 바뀌면 재측정 필요.
      maxBodyHeight={360}
    >
      <ul className={styles.list}>
        {events.map((event) => (
          <li key={event.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.materialCode}>{event.erp_view.affected_material_code}</span>
              <span className={styles.stockDays}>재고 소진까지 {event.erp_view.safety_stock_days}일</span>
              <span
                className={`${styles.qcStatus} ${
                  event.quality_check.status === 'pass' ? styles.pass : styles.fail
                }`}
              >
                품질 검증 {event.quality_check.status === 'pass' ? '통과' : '미통과'}
              </span>
            </div>
            <p className={styles.reason}>{event.quality_check.reason}</p>
            {event.erp_view.alt_sourcing_candidates.length > 0 && (
              <p className={styles.candidates}>
                대체 공급사 후보: {event.erp_view.alt_sourcing_candidates.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </ScrollCard>
  )
}
