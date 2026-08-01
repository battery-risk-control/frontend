import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { ProcurementRiskKpi } from '../../../api/types'
import styles from './KpiSummaryPanel.module.css'

interface KpiSummaryPanelProps {
  kpi: ProcurementRiskKpi
}

/**
 * 상단 KPI 요약. 멀티에이전트(Chain B) 구매 리스크 평가 집계(`ProcurementRiskKpi`)를
 * 그대로 보여준다 — 심각/주의 건수, ERP 영향도·외부 위험 평균 점수, 검증 통과 브리핑 건수.
 * 심각/주의/ERP영향도/외부위험 4칸은 "최근 24시간" 보조 수치를 작은 텍스트로 함께 표시한다
 * (검증 브리핑 칸은 24h 변형 없음). 본값(24h 아닌 값)은 카테고리별 시간제한 없는 최신 스냅샷
 * 기준이라 미해소 리스크는 24시간이 지나도 사라지지 않는다 — 보조 수치는 이를 대체하지 않는다.
 *
 * 사용 예:
 *   <KpiSummaryPanel kpi={procurementRiskKpi} />
 */
export function KpiSummaryPanel({ kpi }: KpiSummaryPanelProps) {
  return (
    <ScrollCard headingId="kpi-summary-heading" title="상단 KPI 요약">
      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt className={styles.label}>심각</dt>
          <dd className={`${styles.value} ${styles.critical}`}>{kpi.critical_count}건</dd>
          <span className={styles.subLabel}>24시간 내 {kpi.critical_count_24h}건</span>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>주의</dt>
          <dd className={`${styles.value} ${styles.warning}`}>{kpi.warning_count}건</dd>
          <span className={styles.subLabel}>24시간 내 {kpi.warning_count_24h}건</span>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>ERP 영향도</dt>
          <dd className={styles.value}>{kpi.erp_exposure_score_avg ?? '-'}점</dd>
          <span className={styles.subLabel}>24시간 평균 {kpi.erp_exposure_score_avg_24h ?? '-'}점</span>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>외부 위험</dt>
          <dd className={styles.value}>{kpi.external_signal_score_avg ?? '-'}점</dd>
          <span className={styles.subLabel}>24시간 평균 {kpi.external_signal_score_avg_24h ?? '-'}점</span>
        </div>
        <div className={styles.stat}>
          <dt className={styles.label}>검증 브리핑</dt>
          <dd className={styles.value}>{kpi.verified_briefing_count}건</dd>
        </div>
      </dl>
    </ScrollCard>
  )
}
