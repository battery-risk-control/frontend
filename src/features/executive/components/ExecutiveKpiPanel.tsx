import type {
  ExecutiveKpi,
} from '../../../api/executive.types'
import styles from './ExecutiveKpiPanel.module.css'

interface ExecutiveKpiPanelProps {
  kpi: ExecutiveKpi
}

interface KpiItem {
  label: string
  value: string
  tone: 'critical' | 'warning' | 'primary' | 'success'
}

export function ExecutiveKpiPanel({
  kpi,
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
      label: '평균 위험 점수',
      value:
        `${kpi.average_risk_score.toFixed(1)}점`,
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
      aria-labelledby="executive-kpi-heading"
    >
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>
            Executive Summary
          </p>

          <h2
            id="executive-kpi-heading"
            className={styles.heading}
          >
            핵심 위험 요약
          </h2>
        </div>

        <p className={styles.updatedAt}>
          최근 평가:{' '}
          {formatAssessedAt(
            kpi.latest_assessed_at,
          )}
        </p>
      </div>

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

function formatAssessedAt(
  value: string | null,
): string {
  if (!value) {
    return '분석 데이터 없음'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date)
}