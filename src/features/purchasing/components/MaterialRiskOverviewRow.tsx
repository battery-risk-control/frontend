import { RiskGauge } from '../../../components/ui/RiskGauge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskGaugeItem, ScoreCardItem } from '../../../api/types'
import styles from './MaterialRiskOverviewRow.module.css'

interface MaterialRiskOverviewRowProps {
  gauges: MaterialRiskGaugeItem[]
  scoreCards: ScoreCardItem[]
}

/**
 * 원자재 리스크 개요 5칸 그리드(데모 화면ID UX-01-DB 상단 행, surin 이식) — 게이지 카드 3장 +
 * 점수 카드 2장. 점수 카드는 이 위치에서만 쓰여 별도 export 컴포넌트로 분리하지 않고
 * 파일 내부 헬퍼(ScoreCard)로 둔다.
 *
 * 사용 예:
 *   <MaterialRiskOverviewRow gauges={gauges} scoreCards={scoreCards} />
 */
export function MaterialRiskOverviewRow({ gauges, scoreCards }: MaterialRiskOverviewRowProps) {
  return (
    <div className={styles.grid}>
      {gauges.map((gauge) => (
        <ScrollCard
          key={gauge.name}
          headingId={`material-risk-gauge-${gauge.name}-heading`}
          title={gauge.name}
          caption={gauge.basis}
        >
          <div className={styles.gaugeBody}>
            <RiskGradeBadge grade={gauge.grade} />
            <RiskGauge grade={gauge.grade} />
            {gauge.changeLabel && <span className={styles.changeLabel}>{gauge.changeLabel}</span>}
          </div>
        </ScrollCard>
      ))}
      {scoreCards.map((card) => (
        <ScoreCard key={card.label} card={card} />
      ))}
    </div>
  )
}

function ScoreCard({ card }: { card: ScoreCardItem }) {
  return (
    <ScrollCard headingId={`score-card-${card.label}-heading`} title={card.label}>
      <div className={styles.scoreBody}>
        <div className={styles.scoreValue}>
          {card.score}
          <span className={styles.scoreMax}>/100</span>
        </div>
        <div className={styles.scoreFooter}>
          <RiskGradeBadge grade={card.grade} />
          {card.diffLabel && <span className={styles.diffLabel}>{card.diffLabel}</span>}
        </div>
      </div>
    </ScrollCard>
  )
}
