import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskGaugeItem } from '../../../api/types'
import styles from './MaterialRiskSummaryCard.module.css'

interface MaterialRiskSummaryCardProps {
  gauges: MaterialRiskGaugeItem[]
  expanded: boolean
  onToggle: () => void
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/**
 * 자재 리스크 게이지 그룹 요약 카드 — 각 자재의 grade/changeLabel만 미니 리스트로 보여준다.
 * "더보기" 토글은 상태를 직접 갖지 않고 `expanded`/`onToggle`을 부모(MaterialRiskOverviewSection)로부터
 * 받는다 — 하단 상세 그리드(MaterialRiskOverviewRow)의 펼침 상태와 한 곳에서 관리하기 위함.
 *
 * 사용 예:
 *   <MaterialRiskSummaryCard gauges={gauges} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
 */
export function MaterialRiskSummaryCard({ gauges, expanded, onToggle }: MaterialRiskSummaryCardProps) {
  return (
    <ScrollCard
      headingId="material-risk-summary-heading"
      title="원자재 리스크 요약"
      actions={
        <button
          type="button"
          className={styles.toggleButton}
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? '접기' : '더보기'}
          <ChevronIcon expanded={expanded} />
        </button>
      }
    >
      <ul className={styles.list}>
        {gauges.map((gauge) => (
          <li key={gauge.name} className={styles.item}>
            <span className={styles.name}>{gauge.name}</span>
            <RiskGradeBadge grade={gauge.grade} />
            {gauge.changeLabel && <span className={styles.changeLabel}>{gauge.changeLabel}</span>}
          </li>
        ))}
      </ul>
    </ScrollCard>
  )
}
