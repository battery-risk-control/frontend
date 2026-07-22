import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import type { MaterialPriceSeries, MaterialPriceSummary } from '../../../api/types'
import styles from './MaterialPriceDetail.module.css'

interface MaterialPriceDetailProps {
  series: MaterialPriceSeries[]
  summaries: MaterialPriceSummary[]
}

interface ChartRow {
  date: string
  [material: string]: string | number
}

const PERIOD_OPTIONS = ['1주', '1개월', '3개월', '6개월', '사용자 설정']
// GlobalRiskBoard mock에 등장하는 5개국을 그대로 재사용한 표시용 목록 — 국가·지역 필터는
// 의도적으로 표시 전용이라(사용자 확인 완료) 실제 자재-국가 연결 데이터가 아니어도 무방하다.
const COUNTRY_FILTER_OPTIONS = ['전체', '인도네시아', '칠레', '콩고민주공화국', '필리핀', '호주']
const SERIES_VARS = ['--mpd-series-1', '--mpd-series-2', '--mpd-series-3']

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function toChartRows(series: MaterialPriceSeries[]): ChartRow[] {
  if (series.length === 0) return []
  return series[0].points.map((point, index) => {
    const row: ChartRow = { date: point.date }
    for (const materialSeries of series) {
      row[materialSeries.material] = materialSeries.points[index]?.price_index ?? 0
    }
    return row
  })
}

/**
 * 원자재 가격 추이(Phase 9.3) — surin RiskMonitoring.tsx의 가격 섹션(필터 드롭다운/
 * 요약 카드/기간 버튼/멀티라인 차트)을 시각적으로 이식한 컴포넌트. "원자재" 드롭다운은
 * 실제로 차트 계열을 필터링한다(특정 자재 선택 시 그 계열만 표시, "전체"면 전부 표시) —
 * 단 요약 카드 3장은 필터와 무관하게 항상 전체 자재를 보여준다(사용자 확인 완료).
 * "국가·지역" 드롭다운과 기간 버튼은 선택 상태만 바뀔 뿐 의도적으로 미구현 —
 * 표시 전용이며 후속 작업이 아니라 확정된 범위 결정이다(사용자 확인 완료).
 * 요약 카드의 가격만 MaterialPriceSeries 마지막 포인트에서 직접 유도해 항상 일치시키고,
 * 등락률/리스크 지수/등급은 mock 임시값(fetchMaterialPriceSummaries)이다.
 *
 * 사용 예:
 *   <MaterialPriceDetail series={series} summaries={summaries} />
 */
export function MaterialPriceDetail({ series, summaries }: MaterialPriceDetailProps) {
  const [period, setPeriod] = useState('1개월')
  const [materialFilterOpen, setMaterialFilterOpen] = useState(false)
  const [materialFilterLabel, setMaterialFilterLabel] = useState('전체')
  const [countryFilterOpen, setCountryFilterOpen] = useState(false)
  const [countryFilterLabel, setCountryFilterLabel] = useState('전체')

  const materialFilterOptions = ['전체', ...series.map((materialSeries) => materialSeries.material)]
  const filteredSeries =
    materialFilterLabel === '전체' ? series : series.filter((s) => s.material === materialFilterLabel)
  const rows = toChartRows(filteredSeries)
  // 자재별 색상은 필터와 무관하게 전체 series 기준 순서로 고정 — 니켈만 필터링해도
  // "전체" 상태에서 보이던 것과 같은 색으로 표시되도록 한다.
  const materialColorVar = new Map(
    series.map((materialSeries, index) => [materialSeries.material, SERIES_VARS[index % SERIES_VARS.length]]),
  )

  function handleSelectMaterialFilter(option: string) {
    setMaterialFilterLabel(option)
    setMaterialFilterOpen(false)
  }

  // 표시 전용 — 의도적으로 미구현(사용자 확인 완료). 실제 자재-국가 필터링 로직을 추가하지 않는다.
  function handleSelectCountryFilter(option: string) {
    setCountryFilterLabel(option)
    setCountryFilterOpen(false)
  }

  return (
    <section className={styles.panel} aria-labelledby="material-price-detail-heading">
      <h2 id="material-price-detail-heading" className={styles.title}>
        원자재 가격 추이
      </h2>
      <div className={styles.filterRow}>
        <div className={styles.dropdownWrap}>
          <button
            type="button"
            className={styles.filterButton}
            onClick={() => setMaterialFilterOpen((open) => !open)}
          >
            <span className={styles.filterLabel}>원자재</span>
            {materialFilterLabel}
            <ChevronIcon />
          </button>
          {materialFilterOpen && (
            <ul className={styles.dropdownMenu}>
              {materialFilterOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleSelectMaterialFilter(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.dropdownWrap}>
          <button
            type="button"
            className={styles.filterButton}
            onClick={() => setCountryFilterOpen((open) => !open)}
          >
            <span className={styles.filterLabel}>국가·지역</span>
            {countryFilterLabel}
            <ChevronIcon />
          </button>
          {countryFilterOpen && (
            <ul className={styles.dropdownMenu}>
              {COUNTRY_FILTER_OPTIONS.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleSelectCountryFilter(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.periodGroup}>
          {PERIOD_OPTIONS.map((label) => (
            <button
              key={label}
              type="button"
              className={label === period ? styles.periodButtonActive : styles.periodButton}
              onClick={() => setPeriod(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.summaryGrid}>
        {series.map((materialSeries) => {
          const summary = summaries.find((item) => item.material === materialSeries.material)
          const lastPoint = materialSeries.points.at(-1)
          return (
            <div key={materialSeries.material} className={styles.summaryCard}>
              <div className={styles.summaryMaterial}>{materialSeries.material}</div>
              <div className={styles.summaryPrice}>{lastPoint?.price_index ?? '—'}</div>
              <div className={styles.summaryUnit}>
                {materialSeries.unit}
                {summary && (
                  <span
                    className={summary.change_label.startsWith('▲') ? styles.summaryChangeUp : styles.summaryChangeDown}
                  >
                    {summary.change_label}
                  </span>
                )}
              </div>
              {summary && (
                <>
                  <div className={styles.summaryScoreRow}>
                    <span className={styles.summaryScoreLabel}>리스크 지수</span>
                    <RiskGradeBadge grade={summary.grade} />
                  </div>
                  <div className={styles.summaryScore}>
                    {summary.risk_score}
                    <span className={styles.summaryScoreMax}>/100</span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => value.slice(5)}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis width={36} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}
            />
            {filteredSeries.map((materialSeries) => (
              <Line
                key={materialSeries.material}
                type="monotone"
                dataKey={materialSeries.material}
                stroke={`var(${materialColorVar.get(materialSeries.material)})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
