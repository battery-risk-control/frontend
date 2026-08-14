import type { KpiSummaryItem } from '../../../api/types'
import { formatScore } from '../../../lib/formatScore'
import styles from './KpiSummaryCards.module.css'

interface KpiSummaryCardsProps {
  items: KpiSummaryItem[]
  onItemClick?: (item: KpiSummaryItem) => void
}

/** 백엔드가 내려준 tone → 색 클래스. 화면이 기준을 지어내면 안 되는 지표(재고일수 등)에 쓴다. */
const TONE_CLASS: Record<NonNullable<KpiSummaryItem['tone']>, string> = {
  critical: styles.critical,
  warning: styles.slow,
  normal: styles.fast,
}

/** 위험 비율/율(%)·점수: 높을수록 나쁨 — risk_node 등급 컷(≥70 심각/≥40 주의)과 동일. */
function riskScaleClass(value: number): string {
  if (value >= 70) return styles.critical
  if (value >= 40) return styles.slow
  return styles.fast
}

/**
 * 값 색상 규칙.
 *  1. 백엔드 `tone`이 있으면 그대로 쓴다(예: 평균 재고일수는 재고÷안전재고 비율로 백엔드가 판정).
 *  2. 없으면 라벨 규칙으로 칠한다.
 *
 * 라벨로 분기하므로 카드 개수가 바뀌어도(kpi_summary 배열이 늘거나 줄어도) 규칙에 없는 카드는
 * 자동으로 기본 색이 된다. `평균 재고일수`는 라벨 규칙에서 제외 — 오직 백엔드 tone으로만 색을 준다
 * (절대 재고일수 기준은 코드에 없기 때문).
 */
function toneClass(item: KpiSummaryItem): string | undefined {
  if (item.tone) return TONE_CLASS[item.tone]

  switch (item.label) {
    // 위험 강조 — 항상 빨강
    case '심각 등급 비중':
    case '심각 자재':
      return styles.critical

    // 등급 건수 — 심각=빨강 / 주의=주황(있을 때) / 정상=초록. 0건이면 초록(양호).
    case '심각':
      return item.value > 0 ? styles.critical : styles.fast
    case '주의':
      return item.value > 0 ? styles.slow : styles.fast
    case '정상':
      return styles.fast

    // 위험 비율(%)·점수 — 높을수록 나쁨: ≥70 빨강 / ≥40 주황 / else 초록
    case '심각 비중':
    case '전체 수입 의존도':
    case '최고 위험 점수':
      return riskScaleClass(item.value)

    // ACTIVE 계약 — 1건 이상이면 초록(유효 계약 있음 = 양호), 0건이면 빨강(유효 계약 없음 = 위험)
    case 'ACTIVE':
      return item.value > 0 ? styles.fast : styles.critical

    // 긍정 진행률(%) — 높을수록 좋음: ≥70 초록 / ≥40 주황 / else 빨강
    case '다변화 진행률':
      if (item.value >= 70) return styles.fast
      if (item.value >= 40) return styles.slow
      return styles.critical

    // 평균 대응 소요(일) — 짧을수록 좋음
    case '평균 대응 소요':
      if (item.value <= 2) return styles.fast
      if (item.value <= 5) return styles.slow
      return styles.critical

    // 단일국가 과의존 — 1건 이상이면 빨강, 0건이면 초록(과의존 자재 없음 = 양호)
    case '단일국가 과의존':
      return item.value > 0 ? styles.critical : styles.fast

    // 만료 임박 — 1건 이상이면 빨강, 0건이면 초록(임박 계약 없음 = 양호)
    case '만료 임박':
      return item.value > 0 ? styles.critical : styles.fast

    // REVIEW 상태 — 1건 이상이면 주황, 0건이면 초록(심사 중 공급사 없음 = 양호)
    case 'REVIEW 상태':
      return item.value > 0 ? styles.slow : styles.fast

    default:
      return undefined
  }
}

/**
 * KPI 요약 카드. kpi_summary 배열을 경영진 첫 카드(ExecutiveKpiPanel)와 같은 그리드·구분선
 * (border-left) 레이아웃으로 렌더링한다 — 두 카드가 같은 화면에 위아래로 놓여도 결이 맞는다.
 *
 * 사용 예:
 *   <KpiSummaryCards items={dashboard.kpi_summary} />
 */
export function KpiSummaryCards({ items, onItemClick }: KpiSummaryCardsProps) {
  return (
    <section className={styles.panel} aria-labelledby="kpi-summary-cards-heading">
      <h2 id="kpi-summary-cards-heading" className={styles.title}>
        KPI 요약 카드
      </h2>
      <div className={styles.grid}>
        {items.map((item) => (
          <article key={item.label} className={styles.card}
            role={onItemClick ? 'button' : undefined} tabIndex={onItemClick ? 0 : undefined}
            onClick={() => onItemClick?.(item)}
            onKeyDown={(event) => {
              if (onItemClick && (event.key === 'Enter' || event.key === ' ')) onItemClick(item)
            }}>
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
