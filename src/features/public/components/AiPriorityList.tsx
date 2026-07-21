import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { AiRecommendation, RiskGrade } from '../../../api/types'
import styles from './AiPriorityList.module.css'

interface AiPriorityListProps {
  recommendations: AiRecommendation[]
}

const GRADE_SEVERITY: Record<RiskGrade, number> = {
  심각: 3,
  주의: 2,
  정상: 1,
}

/**
 * AI 기반 권고 조치 리스트. 등급(심각 > 주의 > 정상) 순으로 정렬해 보여준다.
 *
 * 사용 예:
 *   <AiPriorityList recommendations={recommendations} />
 */
export function AiPriorityList({ recommendations }: AiPriorityListProps) {
  const ranked = [...recommendations].sort(
    (a, b) => GRADE_SEVERITY[b.grade] - GRADE_SEVERITY[a.grade],
  )

  return (
    <section className={styles.panel} aria-labelledby="ai-priority-list-heading">
      <h2 id="ai-priority-list-heading" className={styles.title}>
        AI 기반 권고 조치 리스트
      </h2>
      <ol className={styles.list}>
        {ranked.map((item) => (
          <li key={item.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.material}>{item.material}</span>
              <RiskGradeBadge grade={item.grade} />
              <ConfidenceBadge label={item.confidence_label} />
            </div>
            <p className={styles.recommendation}>{item.recommendation}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
