import type {
  ExecutiveOverviewResponse,
} from '../../../api/executive.types'
import styles from './ExecutiveSummaryPanel.module.css'

interface ExecutiveSummaryPanelProps {
  dashboard: ExecutiveOverviewResponse | null
  loading: boolean
}

export function ExecutiveSummaryPanel({
  dashboard,
  loading,
}: ExecutiveSummaryPanelProps) {
  return (
    <aside
      className={styles.panel}
      aria-labelledby="executive-summary-heading"
    >
      <div className={styles.header}>
        <h2 id="executive-summary-heading">
          경영 요약
        </h2>
      </div>

      {loading && (
        <p className={styles.empty}>
          데이터를 조회하고 있습니다.
        </p>
      )}

      {!loading &&
        !dashboard && (
          <p className={styles.empty}>
            표시할 요약 데이터가 없습니다.
          </p>
        )}

      {!loading &&
        dashboard && (
          <div className={styles.content}>
            <SummaryItem
              label="심각 위험"
              value={
                `${dashboard.kpi.critical_count}건`
              }
              tone="critical"
            />

            <SummaryItem
              label="주의 위험"
              value={
                `${dashboard.kpi.warning_count}건`
              }
              tone="warning"
            />

            <SummaryItem
              label="평균 위험 점수"
              value={
                `${dashboard.kpi.average_risk_score.toFixed(1)}점`
              }
              tone="primary"
            />

            <SummaryItem
              label="검증 통과"
              value={
                `${dashboard.verification_summary.passed_count}건`
              }
              tone="success"
            />

            <SummaryItem
              label="검토 필요"
              value={
                `${dashboard.verification_summary.review_required_count}건`
              }
              tone="warning"
            />

            <div className={styles.notice}>
              <strong>
                데이터 기준
              </strong>

              <p>
                저장된 ERP·계약 RAG·멀티에이전트
                분석 결과를 기준으로 집계합니다.
              </p>
            </div>
          </div>
        )}
    </aside>
  )
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone:
    | 'critical'
    | 'warning'
    | 'primary'
    | 'success'
}) {
  return (
    <div className={styles.item}>
      <span>
        {label}
      </span>

      <strong className={styles[tone]}>
        {value}
      </strong>
    </div>
  )
}
