import { useState } from 'react'
import { MaterialPriceDetail } from '../../../components/widgets/MaterialPriceDetail'
import { ImportDependencyPanel } from './ImportDependencyPanel'
import type { ImportDependencyData, MaterialPriceSeries, MaterialPriceSummary } from '../../../api/types'
import { DEFAULT_PERIOD } from '../../../lib/materialPricePeriods'
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
 * 기간 탭은 여기서 **선택 상태만** 관리한다 — 비로그인 대시보드(minji 이식, 2026-08-03)와
 * 달리 이 화면의 가격 데이터는 아직 mock(`purchasing.api.ts`)이라 다시 부를 실 API가 없다.
 * 실 API로 전환할 때 이 상태를 상위 페이지로 올리고 `PERIOD_DAYS[period]`로 재조회를 걸면
 * 비로그인 대시보드와 같은 동작이 된다.
 *
 * 사용 예:
 *   <ImportDependencyRow importDependency={data} priceSeries={series} priceSummaries={summaries} />
 */
export function ImportDependencyRow({ importDependency, priceSeries, priceSummaries }: ImportDependencyRowProps) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)

  return (
    <div className={styles.row}>
      <ImportDependencyPanel data={importDependency} />
      <MaterialPriceDetail
        series={priceSeries}
        summaries={priceSummaries}
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  )
}
