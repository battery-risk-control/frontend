import { useState } from 'react'
import type { MaterialPriceSeries, MaterialPriceSummary } from '../../../api/types'
import { MaterialPriceTrend } from './MaterialPriceTrend'
import { MaterialPriceDetail } from './MaterialPriceDetail'
import styles from './MaterialPriceSection.module.css'

interface MaterialPriceSectionProps {
  series: MaterialPriceSeries[]
  summaries: MaterialPriceSummary[]
}

type ViewMode = 'summary' | 'detail'

/**
 * 원자재 가격 추이 "전체보기(기존 MaterialPriceTrend)/상세보기(surin RiskMonitoring
 * 스타일 이식, MaterialPriceDetail)" 토글 래퍼(Phase 9.3). 두 하위 컴포넌트는 손대지
 * 않고 그대로 감싸서 전환만 한다.
 *
 * 사용 예:
 *   <MaterialPriceSection series={series} summaries={summaries} />
 */
export function MaterialPriceSection({ series, summaries }: MaterialPriceSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('summary')

  return (
    <div className={styles.wrapper}>
      <div className={styles.toggleRow}>
        <button
          type="button"
          className={viewMode === 'summary' ? styles.toggleButtonActive : styles.toggleButton}
          onClick={() => setViewMode('summary')}
        >
          전체보기
        </button>
        <button
          type="button"
          className={viewMode === 'detail' ? styles.toggleButtonActive : styles.toggleButton}
          onClick={() => setViewMode('detail')}
        >
          상세보기
        </button>
      </div>
      {viewMode === 'summary' ? (
        <MaterialPriceTrend series={series} />
      ) : (
        <MaterialPriceDetail series={series} summaries={summaries} />
      )}
    </div>
  )
}
