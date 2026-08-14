import type {
  ExecutiveKpi,
} from '../../../api/executive.types'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import styles from './ExecutiveKpiPanel.module.css'

interface ExecutiveKpiPanelProps {
  kpi: ExecutiveKpi
  topRiskScore?: number
}

interface KpiItem {
  label: string
  value: string
  tone: 'critical' | 'warning' | 'primary' | 'success'
  /**
   * 카드 하단 24h 보조 줄. 1계층 KPI와 같은 취지로, 건수 카드는 "최근 24시간 수집 건수"를,
   * 최고 위험 점수 카드는 "최근 24시간 최고 점수"를 보여준다. 큰 숫자와 모집단이 달라 뺄셈
   * 하면 안 되는 값이라 회색·작은 글씨로만 둔다.
   */
  sub: string
}

export function ExecutiveKpiPanel({
  kpi,
  topRiskScore,
}: ExecutiveKpiPanelProps) {
  // 심각·주의·검증완료·검토필요 카드는 모두 "24시간 총 수집 건수"를 공유한다(요구사항).
  // 값이 없으면(예: 24h 필드가 없는 구버전 응답) 0으로 폴백해 "undefined건"이 뜨지 않게 한다.
  const collected24h = `${kpi.collected_count_24h ?? 0}건`
  const maxScore24h =
    kpi.max_risk_score_24h == null ? '—' : `${kpi.max_risk_score_24h.toFixed(1)}점`

  const items: KpiItem[] = [
    {
      label: '심각',
      value: `${kpi.critical_count}건`,
      tone: 'critical',
      sub: collected24h,
    },
    {
      label: '주의',
      value: `${kpi.warning_count}건`,
      tone: 'warning',
      sub: collected24h,
    },
    {
      label: topRiskScore == null ? '평균 위험 점수' : '최고 위험 점수',
      value:
        `${(topRiskScore ?? kpi.average_risk_score).toFixed(1)}점`,
      tone: 'primary',
      sub: maxScore24h,
    },
    {
      label: '검증 완료 브리핑',
      value:
        `${kpi.verified_briefing_count}건`,
      tone: 'success',
      sub: collected24h,
    },
    {
      label: '검토 필요',
      value:
        `${kpi.review_required_count}건`,
      tone: 'warning',
      sub: collected24h,
    },
  ]

  return (
    <section
      className={styles.panel}
      aria-label="핵심 위험 요약"
    >
      <div className={styles.grid}>
        {items.map((item) => (
          <article
            key={item.label}
            className={styles.card}
          >
            <span className={styles.label}>
              {item.label}
            </span>

            <div className={styles.valueBlock}>
              <strong
                className={
                  styles[item.tone]
                }
              >
                {item.value}
              </strong>

              <span className={styles.subValue}>
                <span className={styles.subLabel}>24h</span>
                {item.sub}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/**
 * 로딩 자리표시자. 실제 패널과 같은 `.panel/.grid/.card`(auto-fit)를 재사용해 타일 5개(실제 KPI와
 * 동수)를 그린다 — 폭·간격·개수가 일치해 도착 시 레이아웃이 튀지 않는다.
 */
export function ExecutiveKpiPanelSkeleton() {
  return (
    <section
      className={styles.panel}
      aria-busy="true"
      aria-label="핵심 위험 요약 불러오는 중"
    >
      <div className={styles.grid}>
        {Array.from({ length: 5 }, (_, index) => (
          <article key={index} className={styles.card}>
            <span className={styles.label}>
              <Skeleton width="60%" />
            </span>
            <strong>
              <Skeleton variant="title" width="45%" />
            </strong>
          </article>
        ))}
      </div>
    </section>
  )
}
