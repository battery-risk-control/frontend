import type { KpiSummaryItem } from '../../../api/types'
import { formatScore } from '../../../lib/formatScore'
import styles from './KpiSummaryCards.module.css'

interface KpiSummaryCardsProps {
  items: KpiSummaryItem[]
}

/**
 * 값 색상 규칙(라벨 기준):
 *  - `심각 등급 비중`(%)은 항상 빨강 — 위험 비중은 낮을수록 좋으므로 상시 강조한다.
 *  - `평균 대응 소요`(일)는 대응 속도로 색을 나눈다 — ≤2일 초록(빠름), 3~5일 주황(보통),
 *    ≥6일 빨강(느림).
 *  - 그 외(`탐지된 리스크` 등)는 기본 색.
 *
 * 라벨로 분기하므로 카드 개수가 바뀌어도(kpi_summary 배열이 늘거나 줄어도) 색 규칙에 해당하지
 * 않는 카드는 자동으로 기본 색이 된다.
 */
function toneClass(item: KpiSummaryItem): string | undefined {
  if (item.label === '심각 등급 비중') return styles.critical
  if (item.label === '평균 대응 소요') {
    if (item.value <= 2) return styles.fast
    if (item.value <= 5) return styles.slow
    return styles.critical
  }
  return undefined
}

/**
 * KPI 요약 카드. kpi_summary 배열을 경영진 첫 카드(ExecutiveKpiPanel)와 같은 그리드·구분선
 * (border-left) 레이아웃으로 렌더링한다 — 두 카드가 같은 화면에 위아래로 놓여도 결이 맞는다.
 *
 * 사용 예:
 *   <KpiSummaryCards items={dashboard.kpi_summary} />
 */
export function KpiSummaryCards({ items }: KpiSummaryCardsProps) {
  return (
    <section className={styles.panel} aria-labelledby="kpi-summary-cards-heading">
      <h2 id="kpi-summary-cards-heading" className={styles.title}>
        KPI 요약 카드
      </h2>
      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.label} className={styles.card}>
            <span className={styles.label}>{item.label}</span>
            <strong className={[styles.value, toneClass(item)].filter(Boolean).join(' ')}>
              {formatScore(item.value)}
              <span className={styles.unit}>{item.unit}</span>
            </strong>
          </article>
        ))}
      </div>
    </section>
  )
}
