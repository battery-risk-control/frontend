import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import type { PurchasingKpiSummary } from '../../../api/types'
import styles from './PurchasingKpiRow.module.css'

interface PurchasingKpiRowProps {
  /** 조회 전이거나 실패했으면 null — 모든 칸이 "—"가 된다. */
  kpi: PurchasingKpiSummary | null
  /** 아직 조회가 끝나지 않았는지. "—"(값 없음)와 구분해 자리표시자를 보여준다. */
  isLoading?: boolean
}

type Tone = 'critical' | 'warning' | 'erp' | 'external' | 'briefing'

interface KpiCell {
  label: string
  /** null이면 "—"로 렌더한다. 0과 "값 없음"은 다른 상태라 구분한다. */
  value: number | null
  unit: string
  tone: Tone
  /**
   * 최근 24시간 값. 24시간 줄이 아예 없는 칸(검증 브리핑)은 `undefined`로 두고 보조 줄 자체를
   * 렌더하지 않는다. `null`은 "값을 못 구했다"라 "—"로 표시한다.
   */
  value24h?: number | null
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
 *
 * `검증 브리핑`에는 24시간 값이 없다. 백엔드 `recent_24h` CTE가 `review_passed`를 세지 않는다 —
 * 없는 값을 0으로 채우면 "24시간 동안 검증된 브리핑이 하나도 없다"로 읽힌다.
 */
function toCells(kpi: PurchasingKpiSummary | null): KpiCell[] {
  return [
    {
      label: '심각',
      value: kpi?.critical_count ?? null,
      unit: '건',
      tone: 'critical',
      value24h: kpi ? kpi.critical_count_24h : null,
    },
    {
      label: '주의',
      value: kpi?.warning_count ?? null,
      unit: '건',
      tone: 'warning',
      value24h: kpi ? kpi.warning_count_24h : null,
    },
    {
      label: 'ERP 영향도',
      value: round(kpi?.erp_exposure_score_avg),
      unit: '점',
      tone: 'erp',
      value24h: round(kpi?.erp_exposure_score_avg_24h),
    },
    {
      label: '외부 위험',
      value: round(kpi?.external_signal_score_avg),
      unit: '점',
      tone: 'external',
      value24h: round(kpi?.external_signal_score_avg_24h),
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
 * 원천은 `GET /api/v1/purchasing-dashboard/kpi-summary` 하나다. 큰 숫자의 모집단은 **자재
 * 대분류(8종)별 최신 평가 1건**이라 누적 이력이 아니라 현재 상태를 센다 — 같은 자재를 여러 번
 * 평가해도 "지금 심각한 자재"는 하나로 센다. 아래 작은 글씨는 **최근 24시간에 들어온 평가 원본
 * 전체**라 모집단이 다르다.
 *
 * **두 값을 빼서 "전일 대비"로 읽으면 안 된다.** 하나는 대분류별 최신 1건 스냅샷이고 다른
 * 하나는 시간 윈도우 안의 원본 행 전체라, 차이가 증감을 뜻하지 않는다(백엔드 DTO에 같은 경고가
 * 있다). 그래서 라벨을 `24h`로만 쓰고 ▲▼ 같은 증감 기호를 붙이지 않는다.
 *
 * 기존 `KpiSummaryPanel`(mock risk_event 등급 집계, 전체/심각/주의/정상 4칸)을 대체한다.
 *
 * 사용 예:
 *   <PurchasingKpiRow kpi={kpi} />
 */
export function PurchasingKpiRow({ kpi, isLoading = false }: PurchasingKpiRowProps) {
  return (
    <section
      className={styles.section}
      aria-labelledby="kpi-summary-heading"
      aria-busy={isLoading || undefined}
    >
      <h2 id="kpi-summary-heading" className={styles.srOnly}>
        상단 KPI 요약{isLoading ? ' 불러오는 중' : ''}
      </h2>
      <dl className={styles.grid}>
        {toCells(kpi).map((cell) => (
          <div key={cell.label} className={styles.cell}>
            <dt className={styles.label}>{cell.label}</dt>
            <dd className={styles.valueBlock}>
              <span className={`${styles.value} ${TONE_CLASS[cell.tone]}`}>
                {/* 로딩 중에는 '—'를 쓰지 않는다. 그건 "조회했는데 값이 없다"는 뜻이라
                    아직 오는 중인 것과 구분돼야 한다. */}
                {isLoading ? (
                  <Skeleton variant="title" width="2.2em" />
                ) : (
                  <>
                    {cell.value === null ? '—' : cell.value}
                    {cell.value !== null && <span className={styles.unit}>{cell.unit}</span>}
                  </>
                )}
              </span>
              {cell.value24h !== undefined && (
                <span className={styles.subValue}>
                  <span className={styles.subLabel}>24h</span>
                  {cell.value24h === null ? '—' : `${cell.value24h}${cell.unit}`}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
