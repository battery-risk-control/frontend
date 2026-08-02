import { MaterialPriceDetail } from '../../../components/widgets/MaterialPriceDetail'
import { ImportDependencyPanel } from './ImportDependencyPanel'
import type { ImportDependencyData, MaterialPriceSeries, MaterialPriceSummary } from '../../../api/types'
import styles from './ImportDependencyRow.module.css'

interface ImportDependencyRowProps {
  importDependency: ImportDependencyData
  priceSeries: MaterialPriceSeries[]
  priceSummaries: MaterialPriceSummary[]
  /** 선택된 기간 라벨. 조회는 페이지가 소유하므로 여기서는 내려주고 통지만 한다. */
  period: string
  onPeriodChange: (period: string) => void
}

/**
 * 수입 의존도(도넛) + 원자재 가격 추이 2컬럼 행(데모 화면ID UX-01-DB, surin 비율 그대로
 * 340px 1fr). 가격 추이는 components/widgets/로 승격된 MaterialPriceDetail을 그대로 재사용한다.
 *
 * 기간 탭 상태를 **페이지가 소유한다**(2026-08-02, 실 API 전환). 예전에는 이 컴포넌트가
 * 상태만 들고 있었는데, 가격 데이터가 mock이라 탭을 눌러도 다시 부를 API가 없어서였다. 이제
 * `/public/price-trends?days=`·`/public/price-summaries?days=`를 쓰므로 탭이 바뀌면 페이지가
 * 차트와 요약 카드를 **같은 days로 함께** 다시 부른다 — 공개 대시보드와 동일한 구조다.
 * 한쪽만 기간이 바뀌면 차트는 6개월인데 요약 카드는 1개월 등락을 말하는 상태가 된다.
 *
 * 사용 예:
 *   <ImportDependencyRow importDependency={data} priceSeries={series} priceSummaries={summaries}
 *     period={period} onPeriodChange={setPeriod} />
 */
export function ImportDependencyRow({
  importDependency,
  priceSeries,
  priceSummaries,
  period,
  onPeriodChange,
}: ImportDependencyRowProps) {
  return (
    <div className={styles.row}>
      <ImportDependencyPanel data={importDependency} />
      <MaterialPriceDetail
        series={priceSeries}
        summaries={priceSummaries}
        period={period}
        onPeriodChange={onPeriodChange}
      />
    </div>
  )
}
