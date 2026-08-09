import type {
  ExecutiveKpi,
} from '../../../api/executive.types'
import styles from './ExecutiveKpiPanel.module.css'

interface ExecutiveKpiPanelProps {
  kpi: ExecutiveKpi
  topRiskScore?: number
}

interface KpiItem {
  label: string
  value: string
  tone: 'critical' | 'warning' | 'primary' | 'success'
}

export function ExecutiveKpiPanel({
  kpi,
  topRiskScore,
}: ExecutiveKpiPanelProps) {
  const items: KpiItem[] = [
    {
      label: '심각 위험',
      value: `${kpi.critical_count}건`,
      tone: 'critical',
    },
    {
      label: '주의 위험',
      value: `${kpi.warning_count}건`,
      tone: 'warning',
    },
    {
      label: topRiskScore == null ? '평균 위험 점수' : '최고 위험 점수',
      value:
        `${(topRiskScore ?? kpi.average_risk_score).toFixed(1)}점`,
      tone: 'primary',
    },
    {
      label: '검증 완료 브리핑',
      value:
        `${kpi.verified_briefing_count}건`,
      tone: 'success',
    },
    {
      label: '검토 필요',
      value:
        `${kpi.review_required_count}건`,
      tone: 'warning',
    },
  ]

  return (
    <section
      className={styles.panel}
      aria-label="핵심 위험 요약"
    >
      <div className={styles.grid}>
        {items.map((item) => (
          <article
            key={item.label}
            className={styles.card}
          >
            <span className={styles.label}>
              {item.label}
            </span>

            <strong
              className={
                styles[item.tone]
              }
            >
              {item.value}
            </strong>
          </article>
        ))}
      </div>
    </section>
  )
}
