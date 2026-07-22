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
const MATERIAL_FILTER_OPTIONS = ['전체', '니켈', '리튬', '코발트']
// GlobalRiskBoard mock에 등장하는 5개국을 그대로 재사용한 표시용 목록(실제 필터링 로직 없음).
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
 * 원자재 가격 추이 "상세보기"(Phase 9.3) — surin RiskMonitoring.tsx의 가격 섹션(필터
 * 드롭다운/요약 카드/기간 버튼/멀티라인 차트)을 시각적으로 이식한 컴포넌트. 이번 단계의
 * 최우선 목표는 시각 이식이고 데이터 정합성은 2차 목표 — 필터 드롭다운과 기간 버튼은
 * 실제로 열리고 선택 상태가 바뀌지만(표시 전용), 차트/카드 데이터를 실제로 바꾸지는
 * 않는다. 요약 카드의 가격만 MaterialPriceSeries 마지막 포인트에서 직접 유도해 항상
 * 일치시키고, 등락률/리스크 지수/등급은 mock 임시값(fetchMaterialPriceSummaries)이다.
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

  const rows = toChartRows(series)

  // 표시 전용 — 실제 필터링 로직은 후속 작업. 선택한 라벨만 버튼에 반영하고 차트/카드는 그대로 둔다.
  function handleSelectMaterialFilter(option: string) {
    setMaterialFilterLabel(option)
    setMaterialFilterOpen(false)
  }

  // 표시 전용 — 실제 필터링 로직은 후속 작업.
  function handleSelectCountryFilter(option: string) {
    setCountryFilterLabel(option)
    setCountryFilterOpen(false)
  }

  return (
    <div className={styles.panel}>
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
              {MATERIAL_FILTER_OPTIONS.map((option) => (
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
            {series.map((materialSeries, index) => (
              <Line
                key={materialSeries.material}
                type="monotone"
                dataKey={materialSeries.material}
                stroke={`var(${SERIES_VARS[index % SERIES_VARS.length]})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
