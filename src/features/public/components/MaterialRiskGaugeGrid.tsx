import { useState } from 'react'
import { RiskGauge } from '../../../components/ui/RiskGauge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import type { MaterialRiskSummaryItem, RiskGrade } from '../../../api/types'
import styles from './MaterialRiskGaugeGrid.module.css'

interface MaterialRiskGaugeGridProps {
  /** 위 표와 **같은 배열**을 받는다. 따로 조회하면 두 칸이 다른 시점을 가리킬 수 있다. */
  items: MaterialRiskSummaryItem[]
}

/** 백엔드 등급 코드 → 화면 3단계 배지. MaterialRiskSummaryTable과 같은 표를 쓴다. */
const GRADE_BY_LEVEL: Record<string, RiskGrade> = {
  CRITICAL: '심각',
  WARNING: '주의',
  NORMAL: '정상',
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={expanded ? `${styles.chevron} ${styles.chevronExpanded}` : styles.chevron}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/**
 * 원자재별 리스크 점수의 게이지 보기 — 위 표와 **같은 값을 다르게 읽는** 도구다.
 *
 * 표는 숫자를 정확히 읽는 곳이고 이쪽은 7종을 한눈에 훑는 곳이다. 같은 숫자를 다른 방식으로
 * 그리는 건 중복이 아니라 표현 전환이지만, **펼쳐둔 채로 두면 진짜 중복이 된다** — 그래서
 * 기본이 접힘이다.
 *
 * 사용 예:
 *   <MaterialRiskGaugeGrid items={materialRiskSummary} />
 */
export function MaterialRiskGaugeGrid({ items }: MaterialRiskGaugeGridProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={styles.section}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls="material-risk-gauge-grid"
        >
          {expanded ? '게이지 접기' : '게이지로 보기'}
          <ChevronIcon expanded={expanded} />
        </button>
      </div>

      <div className={expanded ? `${styles.detail} ${styles.detailExpanded}` : styles.detail}>
        <div className={styles.detailInner}>
          <div id="material-risk-gauge-grid" className={styles.grid}>
            {items.map((item) => {
              const grade = item.risk_level ? GRADE_BY_LEVEL[item.risk_level] : null
              return (
                <div key={item.material_category} className={styles.card}>
                  <span className={styles.name}>{item.material_name}</span>
                  {grade && item.risk_score !== null ? (
                    <>
                      <RiskGradeBadge grade={grade} />
                      <span className={styles.score}>{item.risk_score.toFixed(1)}</span>
                      <RiskGauge grade={grade} />
                    </>
                  ) : (
                    /* 평가가 없으면 게이지를 그리지 않는다. 0점 게이지는 "위험이 없다"로
                       읽히는데 실제로는 "아직 확인하지 못했다"이다(위 표의 "—"와 같은 규칙). */
                    <span className={styles.unassessed}>아직 분석된 뉴스가 없습니다.</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
