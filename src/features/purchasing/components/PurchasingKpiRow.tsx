import type { PurchasingKpiSummary } from '../../../api/types'
import styles from './PurchasingKpiRow.module.css'

interface PurchasingKpiRowProps {
  /** 조회 전이거나 실패했으면 null — 모든 칸이 "—"가 된다. */
  kpi: PurchasingKpiSummary | null
}

type Tone = 'critical' | 'warning' | 'erp' | 'external' | 'briefing'

interface KpiCell {
  label: string
  /** null이면 "—"로 렌더한다. 0과 "값 없음"은 다른 상태라 구분한다. */
  value: number | null
  unit: string
  tone: Tone
}

const TONE_CLASS: Record<Tone, string> = {
  critical: styles.critical,
  warning: styles.warning,
  erp: styles.erp,
  external: styles.external,
  briefing: styles.briefing,
}

/**
 * KPI 5칸을 만든다.
 *
 * 평균 점수는 백엔드가 **평가 0건이면 null**로 준다. 0으로 바꾸지 않고 그대로 넘겨 "—"가
 * 나오게 한다 — "ERP 영향도 0점"은 "영향이 없다"로 읽히는데 실제로는 "아직 평가하지 않았다"다.
 * 건수(심각·주의·검증 브리핑)는 COUNT라 항상 값이 있고, 0건은 진짜 0건이라 0으로 표시한다.
 */
function toCells(kpi: PurchasingKpiSummary | null): KpiCell[] {
  return [
    { label: '심각', value: kpi?.critical_count ?? null, unit: '건', tone: 'critical' },
    { label: '주의', value: kpi?.warning_count ?? null, unit: '건', tone: 'warning' },
    {
      label: 'ERP 영향도',
      value: round(kpi?.erp_exposure_score_avg),
      unit: '점',
      tone: 'erp',
    },
    {
      label: '외부 위험',
      value: round(kpi?.external_signal_score_avg),
      unit: '점',
      tone: 'external',
    },
    {
      label: '검증 브리핑',
      value: kpi?.verified_briefing_count ?? null,
      unit: '건',
      tone: 'briefing',
    },
  ]
}

function round(score: number | null | undefined): number | null {
  return score === null || score === undefined ? null : Math.round(score)
}

/**
 * 구매팀 대시보드 상단 KPI 5칸(목업 최상단 행) — 심각·주의 건수, ERP 영향도, 외부 위험,
 * 검증 브리핑 건수.
 *
 * 원천은 `GET /api/v1/purchasing-dashboard/kpi-summary` 하나다. 건수의 모집단은 **자재
 * 대분류(8종)별 최신 평가 1건**이라 누적 이력이 아니라 현재 상태를 센다 — 같은 자재를 여러 번
 * 평가해도 "지금 심각한 자재"는 하나로 센다.
 *
 * 기존 `KpiSummaryPanel`(mock risk_event 등급 집계, 전체/심각/주의/정상 4칸)을 대체한다.
 *
 * 사용 예:
 *   <PurchasingKpiRow kpi={kpi} />
 */
export function PurchasingKpiRow({ kpi }: PurchasingKpiRowProps) {
  return (
    <section className={styles.section} aria-labelledby="kpi-summary-heading">
      <h2 id="kpi-summary-heading" className={styles.srOnly}>
        상단 KPI 요약
      </h2>
      <dl className={styles.grid}>
        {toCells(kpi).map((cell) => (
          <div key={cell.label} className={styles.cell}>
            <dt className={styles.label}>{cell.label}</dt>
            <dd className={`${styles.value} ${TONE_CLASS[cell.tone]}`}>
              {cell.value === null ? '—' : cell.value}
              {cell.value !== null && <span className={styles.unit}>{cell.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
