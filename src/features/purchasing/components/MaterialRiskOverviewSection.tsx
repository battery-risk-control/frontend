import { useState } from 'react'
import { MaterialRiskOverviewRow } from './MaterialRiskOverviewRow'
import { MaterialRiskSummaryCard } from './MaterialRiskSummaryCard'
import { ScoreCardPanel } from './ScoreCardPanel'
import type { MaterialRiskGaugeItem, ScoreCardItem } from '../../../api/types'
import styles from './MaterialRiskOverviewSection.module.css'

interface MaterialRiskOverviewSectionProps {
  gauges: MaterialRiskGaugeItem[]
  scoreCards: ScoreCardItem[]
}

/**
 * 원자재 리스크 개요 요약 행 — 형제 카드 3장(현재 기준): [원자재(더보기 있음)]
 * [외부 리스크 종합 점수(더보기 없음)] [ERP 영향 점수(더보기 없음)]. "원자재" 카드
 * (`MaterialRiskSummaryCard`)의 더보기를 펼치면 그 아래 자재 게이지 상세 그리드
 * (`MaterialRiskOverviewRow`)만 애니메이션과 함께 확장된다 — 점수 카드(`ScoreCardPanel`)는
 * 항상 노출 상태를 유지하고 더보기 대상에서 제외된다(점수 카드는 형제 관계일 뿐 더보기
 * 내부 콘텐츠가 아니다). 기본 펼침 상태(요약 도입 전에도 상세 그리드가 항상 보이던 UX 유지).
 *
 * 사용 예:
 *   <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
 */
export function MaterialRiskOverviewSection({ gauges, scoreCards }: MaterialRiskOverviewSectionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={styles.section}>
      <div className={styles.row}>
        <MaterialRiskSummaryCard gauges={gauges} expanded={expanded} onToggle={() => setExpanded((prev) => !prev)} />
        {scoreCards.map((card) => (
          <ScoreCardPanel key={card.label} card={card} />
        ))}
      </div>
      <div className={expanded ? `${styles.detail} ${styles.detailExpanded}` : styles.detail}>
        <div className={styles.detailInner}>
          <MaterialRiskOverviewRow gauges={gauges} />
        </div>
      </div>
    </div>
  )
}
