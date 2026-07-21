import type { SavingsSimulation as SavingsSimulationData } from '../../../api/types'
import styles from './SavingsSimulation.module.css'

interface SavingsSimulationProps {
  simulation: SavingsSimulationData
}

function formatKrwInEok(value: number): string {
  return `약 ${(value / 100_000_000).toFixed(1)}억원`
}

/**
 * 예산 절감 시뮬레이션. is_simulation:true를 화면에도 "시뮬레이션" 문구로 반드시 표기한다 —
 * product-overview.md 비예측 원칙에 따라 이 표기는 절대 생략하지 않는다.
 *
 * 사용 예:
 *   <SavingsSimulation simulation={dashboard.savings_simulation} />
 */
export function SavingsSimulation({ simulation }: SavingsSimulationProps) {
  return (
    <section className={styles.panel} aria-labelledby="savings-simulation-heading">
      <h2 id="savings-simulation-heading" className={styles.title}>
        예산 절감 시뮬레이션
      </h2>
      <span className={styles.simulationBadge}>시뮬레이션 값 — 예측이 아닌 가정 기반 추정치</span>
      <p className={styles.value}>{formatKrwInEok(simulation.estimated_saving_krw)}</p>
      <p className={styles.assumption}>{simulation.baseline_assumption}</p>
    </section>
  )
}
