import { useRef, useState } from 'react'
import { MaterialRiskOverviewRow } from './MaterialRiskOverviewRow'
import { MaterialRiskSummaryCard } from './MaterialRiskSummaryCard'
import { ScoreCardPanel } from './ScoreCardPanel'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import { useHorizontalDragScroll } from '../../../lib/useHorizontalDragScroll'
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
 * 형제 카드 3장뿐이라도 SideNav 펼침 등으로 부모(`.main`) 폭이 좁아지면 줄바꿈되던 문제가
 * 있어(auto-fit grid), `MaterialRiskOverviewRow`와 동일한 "형제 카드 캐러셀형"
 * (design-tokens.md "스크롤 UI 노출 원칙")으로 전환했다 — display:flex+nowrap+overflow-x:auto,
 * 네이티브 스크롤바 노출, `useHorizontalDragScroll` 공용 훅으로 grab-to-scroll 드래그,
 * `useScrollOverflowHint(axis:'horizontal')`로 좌우 힌트.
 *
 * 사용 예:
 *   <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
 */
export function MaterialRiskOverviewSection({ gauges, scoreCards }: MaterialRiskOverviewSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const rowRef = useRef<HTMLDivElement>(null)
  const { hasOverflowTop: hasOverflowLeft, hasOverflowBottom: hasOverflowRight } = useScrollOverflowHint(
    rowRef,
    true,
    'horizontal',
  )
  const drag = useHorizontalDragScroll(rowRef)

  return (
    <div className={styles.section}>
      <div className={styles.rowWrapper}>
        <div
          ref={rowRef}
          className={drag.isDragging ? `${styles.row} ${styles.dragging}` : styles.row}
          onMouseDown={drag.onMouseDown}
          onMouseMove={drag.onMouseMove}
          onMouseUp={drag.onMouseUp}
          onMouseLeave={drag.onMouseLeave}
        >
          <MaterialRiskSummaryCard gauges={gauges} expanded={expanded} onToggle={() => setExpanded((prev) => !prev)} />
          {scoreCards.map((card) => (
            <ScoreCardPanel key={card.label} card={card} />
          ))}
        </div>
        {hasOverflowLeft && (
          <div className={styles.overflowHintLeft} aria-hidden="true">
            <span className={styles.overflowArrow}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </span>
          </div>
        )}
        {hasOverflowRight && (
          <div className={styles.overflowHintRight} aria-hidden="true">
            <span className={styles.overflowArrow}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        )}
      </div>
      <div className={expanded ? `${styles.detail} ${styles.detailExpanded}` : styles.detail}>
        <div className={styles.detailInner}>
          <MaterialRiskOverviewRow gauges={gauges} />
        </div>
      </div>
    </div>
  )
}
