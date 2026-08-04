import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from '../ui/Skeleton/Skeleton'
import { ScrollCard } from '../ui/ScrollCard/ScrollCard'
import { RiskGradeBadge } from '../ui/RiskGradeBadge'
import type { MaterialPriceSeries, MaterialPriceSummary } from '../../api/types'
import { PERIOD_DAYS, PERIOD_OPTIONS } from '../../lib/materialPricePeriods'
import styles from './MaterialPriceDetail.module.css'

interface MaterialPriceDetailProps {
  series: MaterialPriceSeries[]
  /**
   * 아직 조회가 끝나지 않았는지. 빈 차트는 "그 구간에 거래가 없었다"로 읽혀서,
   * 도착 전 상태와 반드시 구분해야 한다.
   */
  isLoading?: boolean
  summaries: MaterialPriceSummary[]
  /** 선택된 기간 라벨. 조회는 페이지가 소유하므로 이 컴포넌트는 표시·통지만 한다. */
  period: string
  onPeriodChange: (period: string) => void
}

interface ChartRow {
  date: string
  [material: string]: string | number
}

const ALL_OPTION = '전체'
const SERIES_VARS = ['--mpd-series-1', '--mpd-series-2', '--mpd-series-3']

/**
 * 국가 목록을 응답에서 만든다. 예전에는 GlobalRiskBoard mock의 5개국이 하드코딩돼 있었는데
 * 실제 조달국(15개국)과 달라 캐나다·독일·일본 등이 목록에 아예 없었다. 응답에서 만들면
 * 공급사가 늘어도 프론트 수정 없이 항목이 따라온다.
 */
function toCountryOptions(series: MaterialPriceSeries[]): string[] {
  const names = new Set<string>()
  for (const materialSeries of series) {
    for (const country of materialSeries.countries ?? []) {
      names.add(country.country_name)
    }
  }
  return [ALL_OPTION, ...[...names].sort((a, b) => a.localeCompare(b, 'ko'))]
}

/** 국가를 고르면 그 나라에서 조달하는 자재의 선만 남긴다(가격이 국가별로 나뉘는 게 아니다). */
function filterByCountry(series: MaterialPriceSeries[], countryName: string): MaterialPriceSeries[] {
  if (countryName === ALL_OPTION) return series
  return series.filter((s) => (s.countries ?? []).some((c) => c.country_name === countryName))
}

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
 * "국가·지역" 드롭다운도 **실제로 동작한다**(2026-08-01). 원래는 표시 전용이었고 목록도
 * GlobalRiskBoard mock의 5개국이 하드코딩돼 있었으나, 백엔드가 자재별 조달국(`countries`)을
 * 내려주면서 연결했다(사용자 승인). 국가를 고르면 **그 나라에서 조달하는 자재의 선만 남는다** —
 * 국가별 가격을 보여주는 게 아니다(자재당 시계열은 하나뿐이고 그 값도 기업 주가 프록시라
 * 채굴국과 연결되지 않는다). 자재 필터와는 AND로 걸린다.
 *
 * 기간 버튼은 **실제로 동작한다**(2026-08-01). 원래는 표시 전용이었으나 백엔드
 * `/public/price-trends?days=`가 구간 조회를 지원하면서 연결했다(사용자 승인). 조회는 페이지가
 * 소유하므로 이 컴포넌트는 선택된 라벨을 받아 표시하고 클릭을 통지만 한다 — 기간이 바뀌면
 * 페이지가 차트·요약을 **같은 days로 함께** 다시 불러야 둘이 어긋나지 않는다.
 * "사용자 설정"만 날짜 범위 UI가 없어 비활성이다.
 * 요약 카드의 가격만 MaterialPriceSeries 마지막 포인트에서 직접 유도해 항상 일치시키고,
 * 등락률/리스크 지수/등급은 mock 임시값(fetchMaterialPriceSummaries)이다.
 * 필터行/요약카드는 ScrollCard의 pinnedTop(스크롤 밖 고정)에 배치한다. 차트는
 * `scrollable={false}`로 ScrollCard 본문 스크롤을 배제한다 — Recharts
 * ResponsiveContainer가 스크롤 컨테이너(overflow:auto) 안에 있으면 폭을 재측정하며
 * 카드가 계속 확장되는 문제가 트러블슈팅 중 확인돼, 이 컴포넌트는 스크롤 없이
 * 자유 높이로 렌더링한다.
 *
 * 사용 예:
 *   <MaterialPriceDetail series={series} summaries={summaries} />
 */
export function MaterialPriceDetail({
  series,
  summaries,
  period,
  onPeriodChange,
  isLoading = false,
}: MaterialPriceDetailProps) {
  const [materialFilterOpen, setMaterialFilterOpen] = useState(false)
  const [materialFilterLabel, setMaterialFilterLabel] = useState('전체')
  const [countryFilterOpen, setCountryFilterOpen] = useState(false)
  const [countryFilterLabel, setCountryFilterLabel] = useState('전체')

  const materialFilterOptions = [ALL_OPTION, ...series.map((materialSeries) => materialSeries.material)]
  const countryFilterOptions = toCountryOptions(series)
  // 두 필터는 AND로 걸린다 — "칠레 + 니켈"처럼 교집합이 없으면 빈 차트가 되는 것이 맞다.
  // (칠레에서 니켈을 조달하지 않는다는 사실 자체가 정보다.)
  const filteredSeries = filterByCountry(
    materialFilterLabel === ALL_OPTION
      ? series
      : series.filter((s) => s.material === materialFilterLabel),
    countryFilterLabel,
  )
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

  function handleSelectCountryFilter(option: string) {
    setCountryFilterLabel(option)
    setCountryFilterOpen(false)
  }

  return (
    <ScrollCard
      headingId="material-price-detail-heading"
      title="원자재 가격 추이"
      scrollable={false}
      pinnedTop={
        <>
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
                  {countryFilterOptions.map((option) => (
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
              {PERIOD_OPTIONS.map((label) => {
                const supported = label in PERIOD_DAYS
                return (
                  <button
                    key={label}
                    type="button"
                    className={label === period ? styles.periodButtonActive : styles.periodButton}
                    onClick={() => onPeriodChange(label)}
                    disabled={!supported}
                    title={supported ? undefined : '날짜 범위 선택은 아직 준비 중입니다.'}
                  >
                    {label}
                  </button>
                )
              })}
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
                        className={
                          summary.change_label.startsWith('▲') ? styles.summaryChangeUp : styles.summaryChangeDown
                        }
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
        </>
      }
    >
      <div className={styles.chartArea} aria-busy={isLoading || undefined}>
        {isLoading ? (
          <Skeleton variant="block" width="100%" height="100%" />
        ) : (
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
              isAnimationActive={false}
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
        )}
      </div>
    </ScrollCard>
  )
}
