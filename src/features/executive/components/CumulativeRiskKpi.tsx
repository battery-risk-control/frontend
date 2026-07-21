import type { CumulativeRiskKpi as CumulativeRiskKpiData } from '../../../api/types'
import styles from './CumulativeRiskKpi.module.css'

interface CumulativeRiskKpiProps {
  kpi: CumulativeRiskKpiData
}

/**
 * 누적 리스크 탐지 KPI. Figma "경영진 대시보드" 프레임 기준 3개 박스
 * (이번 분기 탐지 건수 / 심각 등급 건수 / 평균 대응 소요)를 가로로 배치한다.
 *
 * 사용 예:
 *   <CumulativeRiskKpi kpi={dashboard.cumulative_risk_kpi} />
 */
export function CumulativeRiskKpi({ kpi }: CumulativeRiskKpiProps) {
  return (
    <section className={styles.panel} aria-labelledby="cumulative-risk-kpi-heading">
      <h2 id="cumulative-risk-kpi-heading" className={styles.title}>
        누적 리스크 탐지 KPI
      </h2>
      <div className={styles.boxes}>
        <div className={styles.box}>
          <span className={styles.label}>이번 분기 탐지 건수</span>
          <span className={styles.value}>
            {kpi.detected_count}
            <span className={styles.unit}>건</span>
          </span>
        </div>
        <div className={styles.box}>
          <span className={styles.label}>심각 등급 건수</span>
          <span className={styles.value}>
            {kpi.critical_count}
            <span className={styles.unit}>건</span>
          </span>
        </div>
        <div className={styles.box}>
          <span className={styles.label}>평균 대응 소요</span>
          <span className={styles.value}>
            {kpi.avg_response_days}
            <span className={styles.unit}>일</span>
          </span>
        </div>
      </div>
    </section>
  )
}
