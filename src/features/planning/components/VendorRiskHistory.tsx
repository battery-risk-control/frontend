import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { VendorRiskHistoryItem } from '../../../api/types'
import styles from './VendorRiskHistory.module.css'

interface VendorRiskHistoryProps {
  items: VendorRiskHistoryItem[]
}

/**
 * 협력사 리스크 이력 및 탐색(Figma 패널명). vendor_risk_history 리스트를
 * RiskGradeBadge/ConfidenceBadge와 함께 보여준다.
 *
 * 사용 예:
 *   <VendorRiskHistory items={dashboard.vendor_risk_history} />
 */
export function VendorRiskHistory({ items }: VendorRiskHistoryProps) {
  return (
    <section className={styles.panel} aria-labelledby="vendor-risk-history-heading">
      <h2 id="vendor-risk-history-heading" className={styles.title}>
        협력사 리스크 이력 및 탐색
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.vendor_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.vendorName}>{item.vendor_name}</span>
              <span className={styles.vendorId}>{item.vendor_id}</span>
              <RiskGradeBadge grade={item.latest_grade} />
              <ConfidenceBadge label={item.confidence_label} />
            </div>
            <p className={styles.count}>최근 90일 리스크 이력 {item.risk_count_90d}건</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
