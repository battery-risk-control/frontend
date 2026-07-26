import { RiskGauge } from '../../../components/ui/RiskGauge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskGaugeItem } from '../../../api/types'
import styles from './MaterialRiskOverviewRow.module.css'

interface MaterialRiskOverviewRowProps {
  gauges: MaterialRiskGaugeItem[]
}

/**
 * 원자재 리스크 개요 상세 그리드(데모 화면ID UX-01-DB, surin 이식) — 실제 게이지 데이터가 있는
 * 자재 카드(gauges)만 렌더링한다. 점수 카드(외부 리스크 종합/ERP 영향)는 "원자재" 카드와 형제
 * 관계인 별도 컴포넌트(ScoreCardPanel)로 분리돼 더 이상 이 그리드에 포함되지 않는다.
 *
 * 사용 예:
 *   <MaterialRiskOverviewRow gauges={gauges} />
 */
export function MaterialRiskOverviewRow({ gauges }: MaterialRiskOverviewRowProps) {
  return (
    <div className={styles.grid}>
      {gauges.map((gauge) => (
        <ScrollCard
          key={gauge.name}
          headingId={`material-risk-gauge-${gauge.name}-heading`}
          title={gauge.name}
          caption={gauge.basis}
        >
          <div className={styles.gaugeBody}>
            <RiskGradeBadge grade={gauge.grade} />
            <RiskGauge grade={gauge.grade} />
            {gauge.changeLabel && <span className={styles.changeLabel}>{gauge.changeLabel}</span>}
          </div>
        </ScrollCard>
      ))}
    </div>
  )
}
