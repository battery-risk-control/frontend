import { useState } from 'react'
import { MaterialRiskOverviewRow } from './MaterialRiskOverviewRow'
import { MaterialRiskSummaryCard } from './MaterialRiskSummaryCard'
import type { MaterialRiskGaugeItem, ScoreCardItem } from '../../../api/types'
import styles from './MaterialRiskOverviewSection.module.css'

interface MaterialRiskOverviewSectionProps {
  gauges: MaterialRiskGaugeItem[]
  scoreCards: ScoreCardItem[]
}

/**
 * 자재 리스크 게이지 그룹 요약 + 더보기(Disclosure). 상단에 항상 보이는
 * `MaterialRiskSummaryCard`(자재별 grade+changeLabel 미니 리스트) + "더보기" 토글을 두고,
 * 그 아래 기존 `MaterialRiskOverviewRow`(5칸 상세 그리드, 무수정 재사용)를 애니메이션과 함께
 * 접기/펼치기 한다. 기본 펼침 상태(요약 도입 전에도 상세 그리드가 항상 보이던 UX를 그대로
 * 유지) — 더보기는 "전체 상세 게이지 숨기기/보기" 역할이다.
 *
 * 사용 예:
 *   <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
 */
export function MaterialRiskOverviewSection({ gauges, scoreCards }: MaterialRiskOverviewSectionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={styles.section}>
      <MaterialRiskSummaryCard gauges={gauges} expanded={expanded} onToggle={() => setExpanded((prev) => !prev)} />
      <div className={expanded ? `${styles.detail} ${styles.detailExpanded}` : styles.detail}>
        <div className={styles.detailInner}>
          <MaterialRiskOverviewRow gauges={gauges} scoreCards={scoreCards} />
        </div>
      </div>
    </div>
  )
}
