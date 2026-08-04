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
  /** 가격 조회가 아직 끝나지 않았는지. 차트 자리에 자리표시자를 띄운다. */
  isPriceLoading?: boolean
  /**
   * 선택된 기간 라벨(제어형, 선택). 넘기면 페이지가 소유한 상태를 그대로 쓴다 — 비로그인
   * 대시보드(tier1 이식, 2026-08-03)처럼 가격이 실 API라 탭이 바뀔 때 페이지가 차트·요약
   * 카드를 같은 days로 함께 다시 불러야 하는 화면용이다.
   */
  period?: string
  onPeriodChange?: (period: string) => void
}

/**
 * 수입 의존도(도넛) + 원자재 가격 추이 2컬럼 행(데모 화면ID UX-01-DB, surin 비율 그대로
 * 340px 1fr). 가격 추이는 components/widgets/로 승격된 MaterialPriceDetail을 그대로 재사용한다.
 *
 * 기간 탭 상태는 **`period`/`onPeriodChange`를 넘기지 않으면** 이 컴포넌트가 내부 `useState`로
 * 스스로 채운다(비제어형, 구매팀 대시보드 — 가격 데이터가 아직 mock이라 다시 부를 실 API가
 * 없다). **넘기면** 그 상태를 그대로 쓴다(제어형, 비로그인 대시보드 — `/public/price-trends
 * ?days=`·`/public/price-summaries?days=`를 쓰므로 탭이 바뀌면 페이지가 차트와 요약 카드를
 * 같은 days로 함께 다시 부른다). 두 화면이 같은 컴포넌트를 서로 다른 방식으로 쓰는 것뿐이라
 * prop을 optional로 둬서 기존 호출부(`PurchasingDashboardPage.tsx`)를 무수정으로 유지한다.
 *
 * 사용 예:
 *   <ImportDependencyRow importDependency={data} priceSeries={series} priceSummaries={summaries} />
 *   <ImportDependencyRow importDependency={data} priceSeries={series} priceSummaries={summaries}
 *     period={period} onPeriodChange={setPeriod} />
 */
export function ImportDependencyRow({
  importDependency,
  priceSeries,
  priceSummaries,
  isPriceLoading = false,
  period: controlledPeriod,
  onPeriodChange: controlledOnPeriodChange,
}: ImportDependencyRowProps) {
  const [internalPeriod, setInternalPeriod] = useState(DEFAULT_PERIOD)
  const period = controlledPeriod ?? internalPeriod
  const onPeriodChange = controlledOnPeriodChange ?? setInternalPeriod

  return (
    <div className={styles.row}>
      <ImportDependencyPanel data={importDependency} />
      <MaterialPriceDetail
        series={priceSeries}
        summaries={priceSummaries}
        isLoading={isPriceLoading}
        period={period}
        onPeriodChange={onPeriodChange}
      />
    </div>
  )
}
