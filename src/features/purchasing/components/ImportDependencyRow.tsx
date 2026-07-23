import { MaterialPriceDetail } from '../../../components/widgets/MaterialPriceDetail'
import { ImportDependencyPanel } from './ImportDependencyPanel'
import type { ImportDependencyData, MaterialPriceSeries, MaterialPriceSummary } from '../../../api/types'
import styles from './ImportDependencyRow.module.css'

interface ImportDependencyRowProps {
  importDependency: ImportDependencyData
  priceSeries: MaterialPriceSeries[]
  priceSummaries: MaterialPriceSummary[]
}

/**
 * 수입 의존도(도넛) + 원자재 가격 추이 2컬럼 행(데모 화면ID UX-01-DB, surin 비율 그대로
 * 340px 1fr). 가격 추이는 components/widgets/로 승격된 MaterialPriceDetail을 그대로 재사용한다.
 *
 * 사용 예:
 *   <ImportDependencyRow importDependency={data} priceSeries={series} priceSummaries={summaries} />
 */
export function ImportDependencyRow({ importDependency, priceSeries, priceSummaries }: ImportDependencyRowProps) {
  return (
    <div className={styles.row}>
      <ImportDependencyPanel data={importDependency} />
      <MaterialPriceDetail series={priceSeries} summaries={priceSummaries} />
    </div>
  )
}
