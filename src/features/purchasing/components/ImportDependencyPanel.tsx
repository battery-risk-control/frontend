import { DonutChart } from '../../../components/ui/DonutChart'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { ImportDependencyData } from '../../../api/types'
import styles from './ImportDependencyPanel.module.css'

interface ImportDependencyPanelProps {
  data: ImportDependencyData
}

/**
 * 수입 의존도 도넛차트(데모 화면ID UX-01-DB, surin importDependency 이식). DonutChart는
 * 고정 180x180px 컨테이너라 ScrollCard 기본 scrollable(true) 그대로 둬도 되먹임 리사이즈가
 * 재현되지 않는다(사전 실측 확인 완료).
 *
 * 사용 예:
 *   <ImportDependencyPanel data={data} />
 */
export function ImportDependencyPanel({ data }: ImportDependencyPanelProps) {
  return (
    <ScrollCard
      headingId="import-dependency-heading"
      title={data.year ? `수입 의존도 (${data.year})` : '수입 의존도'}
    >
      <div className={styles.body}>
        <DonutChart data={data.breakdown} centerValue={`${data.total}%`} centerLabel="전체 수입 의존도" />
        <ul className={styles.legend}>
          {data.breakdown.map((item) => (
            <li key={item.label} className={styles.legendItem}>
              <span className={styles.legendLabel}>
                <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className={styles.legendValue}>{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ScrollCard>
  )
}
