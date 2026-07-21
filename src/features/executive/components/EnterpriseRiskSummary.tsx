import type { EnterpriseRiskSummaryItem } from '../../../api/types'
import styles from './EnterpriseRiskSummary.module.css'

interface EnterpriseRiskSummaryProps {
  items: EnterpriseRiskSummaryItem[]
}

const TREND_LABEL: Record<EnterpriseRiskSummaryItem['trend'], string> = {
  상승: '▲ 상승',
  유지: '― 유지',
  하락: '▼ 하락',
}

const TREND_CLASS: Record<EnterpriseRiskSummaryItem['trend'], 'up' | 'flat' | 'down'> = {
  상승: 'up',
  유지: 'flat',
  하락: 'down',
}

/**
 * 전사 리스크 요약. 2계층 통계를 압축한 요약 뷰(enterprise_risk_summary).
 *
 * 사용 예:
 *   <EnterpriseRiskSummary items={dashboard.enterprise_risk_summary} />
 */
export function EnterpriseRiskSummary({ items }: EnterpriseRiskSummaryProps) {
  return (
    <section className={styles.panel} aria-labelledby="enterprise-risk-summary-heading">
      <h2 id="enterprise-risk-summary-heading" className={styles.title}>
        전사 리스크 요약
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.business_unit} className={styles.item}>
            <span className={styles.unit}>{item.business_unit}</span>
            <span className={styles.score}>{item.exposure_score}점</span>
            <span className={`${styles.trend} ${styles[TREND_CLASS[item.trend]]}`}>
              {TREND_LABEL[item.trend]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
