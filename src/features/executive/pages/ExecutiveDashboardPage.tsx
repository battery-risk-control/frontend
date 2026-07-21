import { fetchExecutiveDashboard } from '../../../api/executive.api'
import { CumulativeRiskKpi } from '../components/CumulativeRiskKpi'
import { SavingsSimulation } from '../components/SavingsSimulation'
import { EnterpriseRiskSummary } from '../components/EnterpriseRiskSummary'
import styles from './ExecutiveDashboardPage.module.css'

/**
 * 3계층 경영진 대시보드 (Seq 26). Figma "경영진 대시보드" 프레임 레이아웃 그대로 —
 * 상단 누적 리스크 탐지 KPI(3박스 가로) → 하단 좌우 분할(예산 절감 시뮬레이션 / 전사 리스크 요약).
 */
export function ExecutiveDashboardPage() {
  const dashboard = fetchExecutiveDashboard()

  return (
    <main id="main-content" className={styles.page}>
      <CumulativeRiskKpi kpi={dashboard.cumulative_risk_kpi} />
      <div className={styles.bottomRow}>
        <SavingsSimulation simulation={dashboard.savings_simulation} />
        <EnterpriseRiskSummary items={dashboard.enterprise_risk_summary} />
      </div>
    </main>
  )
}
