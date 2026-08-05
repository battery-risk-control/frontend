import type { MaterialRiskRankItem } from '../../../api/types'
import styles from './ExecutivePriorityAlert.module.css'

interface ExecutivePriorityAlertProps {
  risk?: MaterialRiskRankItem
  reviewRequiredCount: number
  onClick?: () => void
}

export function ExecutivePriorityAlert({
  risk,
  reviewRequiredCount,
  onClick,
}: ExecutivePriorityAlertProps) {
  if (!risk) {
    return (
      <section className={`${styles.alert} ${styles.empty}`} aria-label="핵심 위험 알림">
        <span className={styles.badge}>현황</span>
        <div>
          <strong>분석된 핵심 위험 데이터가 없습니다.</strong>
          <p>새로운 위험 평가가 저장되면 가장 중요한 항목을 여기에 표시합니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      className={styles.alert}
      aria-label="핵심 위험 알림"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) onClick()
      }}
    >
      <span className={styles.badge}>{risk.grade}</span>
      <div className={styles.content}>
        <strong>{risk.material} 공급망 위험 우선 확인</strong>
        <p>
          종합 위험 {risk.score.toFixed(1)}점
          <span aria-hidden="true"> · </span>
          위험 순위 {risk.rank}위
          <span aria-hidden="true"> · </span>
          검토 필요 {reviewRequiredCount}건
        </p>
      </div>
    </section>
  )
}
