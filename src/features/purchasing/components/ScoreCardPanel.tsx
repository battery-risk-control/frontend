import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { ScoreCardItem } from '../../../api/types'
import styles from './ScoreCardPanel.module.css'

interface ScoreCardPanelProps {
  card: ScoreCardItem
}

/**
 * 원자재 리스크 개요 요약 행의 점수 카드 — "원자재" 카드와 형제 관계로 항상 노출되며 더보기
 * 대상이 아니다. Phase 9.4에서는 MaterialRiskOverviewRow 내부 비export 헬퍼였으나, "원자재"
 * 카드만 더보기를 갖도록 구조를 재정의하며 독립 컴포넌트로 분리했다.
 *
 * 사용 예:
 *   <ScoreCardPanel card={card} />
 */
export function ScoreCardPanel({ card }: ScoreCardPanelProps) {
  return (
    <ScrollCard headingId={`score-card-${card.label}-heading`} title={card.label}>
      <div className={styles.scoreBody}>
        <div className={styles.scoreValue}>
          {card.score}
          <span className={styles.scoreMax}>/100</span>
        </div>
        <div className={styles.scoreFooter}>
          {card.grade && <RiskGradeBadge grade={card.grade} />}
          {card.diffLabel && <span className={styles.diffLabel}>{card.diffLabel}</span>}
        </div>
      </div>
    </ScrollCard>
  )
}
