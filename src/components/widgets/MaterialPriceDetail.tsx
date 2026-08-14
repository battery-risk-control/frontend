import { useState, type ReactNode } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Skeleton } from '../ui/Skeleton/Skeleton'
import { ScrollCard } from '../ui/ScrollCard/ScrollCard'
import { RiskGradeBadge } from '../ui/RiskGradeBadge'
import type { MaterialPriceSeries, MaterialPriceSummary } from '../../api/types'
import { PERIOD_OPTIONS } from '../../lib/materialPricePeriods'
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
  /**
   * 레이아웃(2026-08-06 item 6).
   *  - 'inline'(기본): 필터+요약카드+차트를 한 카드에 담는 기존 구조(롤백 경로).
   *  - 'split': 상단 [leadingPanel | 원자재 가격 추이(필터+요약카드)] + 하단 전체폭 [가격 추이 그래프].
   *             수입 의존도 도넛 아래 여백을 그래프가 채우도록 그래프를 별도 섹션으로 분리한다.
   */
  layout?: 'inline' | 'split'
  /** split 레이아웃에서 상단 좌측(도넛 등)에 놓을 슬롯. inline에서는 무시된다. */
  leadingPanel?: ReactNode
  /**
   * 외부에서 특정 원자재를 미리 선택해 그래프를 한 자재(단일 선)로 좁힌다. 주요 알림의
   * "○○ 가격 변동성 주의"를 눌렀을 때 그 자재만 보이도록 페이지가 넘긴다. 값이 바뀌면 반영하되,
   * 이후 사용자가 필터/카드로 다시 바꾸는 것은 막지 않는다.
   */
  selectedMaterial?: string
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

/**
 * 모든 계열의 포인트를 x축(date) 기준으로 합쳐 정렬한다. 예전에는 series[0]의 인덱스에 맞춰
 * 다른 계열을 끼웠는데(자재마다 거래일이 같다는 가정), "1일" 시간별에서는 거래소(미국·호주)마다
 * 시각이 달라 인덱스가 어긋난다. date를 키로 합집합을 만들고, 없는 지점은 undefined로 둬
 * (0으로 채우면 선이 바닥까지 떨어진다) 차트가 connectNulls로 건너뛰게 한다. KST 시각 문자열과
 * 날짜 문자열 모두 사전식 정렬이 곧 시간순이다.
 */
function toChartRows(series: MaterialPriceSeries[]): ChartRow[] {
  if (series.length === 0) return []
  const byDate = new Map<string, ChartRow>()
  for (const materialSeries of series) {
    for (const point of materialSeries.points) {
      let row = byDate.get(point.date)
      if (!row) {
        row = { date: point.date }
        byDate.set(point.date, row)
      }
      row[materialSeries.material] = point.price_index
    }
  }
  return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

/**
 * y축 도메인: 기준선 100을 세로 중앙에 두기 위해 100을 축으로 대칭 범위를 만든다.
 * dataMin/dataMax 중 100에서 더 먼 쪽을 반폭으로 삼고 15% 여백을 더한다 — 그러면 값이 전부
 * 100 위/아래 어디에 몰려 있어도 100 선이 정확히 가운데에 온다. 데이터가 없거나 평평하면
 * 반폭이 0이 되므로 최소 1을 보장해 축이 한 점으로 접히지 않게 한다.
 */
function centeredDomain([dataMin, dataMax]: readonly [number, number]): [number, number] {
  const half = Math.max(100 - dataMin, dataMax - 100, 1)
  const pad = half * 0.15
  return [Math.floor(100 - half - pad), Math.ceil(100 + half + pad)]
}

/** x축 라벨: "1일" 시간별(...T22:30)이면 HH:mm, 일·주·월 등 날짜(YYYY-MM-DD)면 MM-DD. */
function formatAxisLabel(value: string): string {
  return value.includes('T') ? (value.split('T')[1]?.slice(0, 5) ?? value) : value.slice(5)
}

/**
 * 원자재 가격 추이(Phase 9.3) — surin RiskMonitoring.tsx의 가격 섹션(필터 드롭다운/
 * 요약 카드/기간 버튼/멀티라인 차트)을 시각적으로 이식한 컴포넌트. "원자재" 드롭다운은
 * 실제로 차트 계열을 필터링한다(특정 자재 선택 시 그 계열만 표시, "전체"면 전부 표시).
 *
 * 요약 카드(2026-08-06 개편):
 *  - **국가·지역 드롭다운을 카드에도 반영한다**(item 3). 국가를 고르면 그 나라에서 조달하는
 *    자재의 카드만 남아 가독성을 높인다(예: 알루미늄만 조달하는 나라 → 알루미늄 카드만).
 *  - **카드를 클릭하면 그 자재만 그래프에 남긴다**(item 4, 드롭다운에서 그 자재를 고른 것과 동일).
 *    이미 선택된 카드를 다시 누르면 "전체"로 되돌린다.
 * 예전에는 카드가 필터와 무관하게 항상 전체 자재를 보여줬으나(당시 사용자 확인), 위 요청으로 바꿨다.
 *
 * "국가·지역" 드롭다운도 **실제로 동작한다**(2026-08-01). 국가를 고르면 그 나라에서 조달하는
 * 자재의 선만 남는다 — 국가별 가격을 보여주는 게 아니다(자재당 시계열은 하나뿐이고 그 값도 기업
 * 주가 프록시라 채굴국과 연결되지 않는다). 자재 필터와는 AND로 걸린다.
 *
 * 기간 버튼은 **실제로 동작한다**(2026-08-01). 백엔드 `/public/price-trends?days=`가 구간 조회를
 * 지원한다. 조회는 페이지가 소유하므로 이 컴포넌트는 선택된 라벨을 받아 표시하고 클릭을 통지만
 * 한다 — 기간이 바뀌면 페이지가 차트·요약을 **같은 days로 함께** 다시 불러야 둘이 어긋나지 않는다.
 * 요약 카드의 가격만 MaterialPriceSeries 마지막 포인트에서 직접 유도해 항상 일치시키고,
 * 등락률/리스크 지수/등급은 mock 임시값(fetchMaterialPriceSummaries)이다.
 *
 * 레이아웃은 `layout` prop이 정한다. 'split'(item 6)은 그래프를 전체폭 별도 섹션으로 내려
 * 수입 의존도 도넛 아래 여백을 채운다. 'inline'은 기존 단일 카드 구조로 롤백 경로다.
 *
 * 사용 예:
 *   <MaterialPriceDetail series={series} summaries={summaries} period={p} onPeriodChange={setP}
 *     layout="split" leadingPanel={<ImportDependencyPanel data={data} />} />
 */
export function MaterialPriceDetail({
  series,
  summaries,
  period,
  onPeriodChange,
  isLoading = false,
  layout = 'inline',
  leadingPanel,
  selectedMaterial,
}: MaterialPriceDetailProps) {
  const [materialFilterOpen, setMaterialFilterOpen] = useState(false)
  const [materialFilterLabel, setMaterialFilterLabel] = useState(selectedMaterial ?? ALL_OPTION)
  // 외부에서 넘어온 선택 자재가 바뀌면 그 자재로 그래프를 좁힌다(주요 알림 클릭 → 단일 선).
  // effect 대신 렌더 중 "이전 prop 비교" 패턴을 쓴다(React 공식 권장 — 불필요한 재렌더를 피함).
  // 이후 사용자가 필터/카드로 다시 바꾸는 것은 막지 않는다.
  const [prevSelectedMaterial, setPrevSelectedMaterial] = useState(selectedMaterial)
  if (selectedMaterial !== prevSelectedMaterial) {
    setPrevSelectedMaterial(selectedMaterial)
    if (selectedMaterial) setMaterialFilterLabel(selectedMaterial)
  }
  const [countryFilterOpen, setCountryFilterOpen] = useState(false)
  const [countryFilterLabel, setCountryFilterLabel] = useState('전체')

  const materialFilterOptions = [ALL_OPTION, ...series.map((materialSeries) => materialSeries.material)]
  const countryFilterOptions = toCountryOptions(series)
  // 요약 카드는 국가 필터만 반영한다(item 3) — 자재 필터/카드 클릭은 그래프만 좁히고,
  // 카드는 그 나라의 자재를 계속 보여줘야 다른 카드로 갈아탈 수 있다.
  const countryFilteredSeries = filterByCountry(series, countryFilterLabel)
  // 두 필터는 AND로 걸린다 — "칠레 + 니켈"처럼 교집합이 없으면 빈 차트가 되는 것이 맞다.
  // (칠레에서 니켈을 조달하지 않는다는 사실 자체가 정보다.)
  const filteredSeries = filterByCountry(
    materialFilterLabel === ALL_OPTION
      ? series
      : series.filter((s) => s.material === materialFilterLabel),
    countryFilterLabel,
  )
  const rows = toChartRows(filteredSeries)
  // "1일" 탭만 지수 기준이 다르다(당일 시가=100). 다른 기간은 6개월 전=100으로 고정돼 있어
  // 값을 직접 비교하면 안 되므로, 이 탭에서만 안내문구를 띄운다.
  const isIntraday = period === '1일'
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

  // 카드 클릭(item 4): 그 자재로 그래프를 좁힌다. 같은 카드를 다시 누르면 전체로 되돌린다.
  function handleToggleMaterial(material: string) {
    setMaterialFilterLabel((prev) => (prev === material ? ALL_OPTION : material))
  }

  const filterRow = (
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

      {/* 기간 버튼은 우측 끝으로 밀어 필터 드롭다운과 시각적으로 분리한다(item 2). */}
      <div className={styles.periodGroup}>
        {PERIOD_OPTIONS.map((label) => (
          <button
            key={label}
            type="button"
            className={label === period ? styles.periodButtonActive : styles.periodButton}
            onClick={() => onPeriodChange(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  const summaryGrid = (
    <div className={styles.summaryGrid}>
      {countryFilteredSeries.map((materialSeries) => {
        const summary = summaries.find((item) => item.material === materialSeries.material)
        const lastPoint = materialSeries.points.at(-1)
        const isSelected = materialFilterLabel === materialSeries.material
        return (
          <div
            key={materialSeries.material}
            className={isSelected ? `${styles.summaryCard} ${styles.summaryCardActive}` : styles.summaryCard}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            onClick={() => handleToggleMaterial(materialSeries.material)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleToggleMaterial(materialSeries.material)
              }
            }}
          >
            {/* 등급 배지(정상/주의/심각)를 자재명과 같은 행 우측 상단에 둔다(2026-08-07). 예전에는
                "리스크 지수" 줄에 있어 한 줄을 더 차지했는데, 위로 올려 칸을 더 컴팩트하게 만든다. */}
            <div className={styles.summaryHeader}>
              <span className={styles.summaryMaterial}>{materialSeries.material}</span>
              {summary && <RiskGradeBadge grade={summary.grade} size="md" />}
            </div>
            {/* 지수와 등락%를 한 행에 큰 글씨로 나란히(item 5). */}
            <div className={styles.summaryPriceRow}>
              <span className={styles.summaryPrice}>{lastPoint?.price_index ?? '—'}</span>
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
            <div className={styles.summaryUnit}>{materialSeries.unit}</div>
            {summary && (
              // "리스크 지수"와 점수(0/100)를 한 줄에 좌우로 둔다(2026-08-07).
              <div className={styles.summaryScoreRow}>
                <span className={styles.summaryScoreLabel}>리스크 지수</span>
                <span className={styles.summaryScore}>
                  {summary.risk_score}
                  <span className={styles.summaryScoreMax}>/100</span>
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const basisNotice = isIntraday ? (
    <p className={styles.basisNotice}>
      ※ ‘1일’ 탭의 지수는 <strong>당일 시가를 100</strong>으로 둔 별도 기준입니다. 다른 기간(6개월 전=100)과
      기준이 달라 수치를 직접 비교할 수 없습니다.
    </p>
  ) : null

  const chart = (
    <>
      {basisNotice}
      <div className={styles.chartArea} aria-busy={isLoading || undefined}>
      {isLoading ? (
        <Skeleton variant="block" width="100%" height="100%" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatAxisLabel}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              width={36}
              domain={centeredDomain}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              isAnimationActive={false}
              labelFormatter={(label) =>
                typeof label === 'string' && label.includes('T') ? label.replace('T', ' ') : label
              }
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
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
      </div>
    </>
  )

  // split(item 6): 상단 [leadingPanel | 필터+요약카드], 하단 전체폭 그래프.
  // splitContainer는 컨테이너 쿼리 기준점 — 뷰포트가 아니라 이 영역의 실제 폭으로 쌓임 여부를
  // 정한다(사이드바·알림패널로 뷰포트는 넓어도 이 영역이 좁아질 수 있어서다).
  if (layout === 'split') {
    return (
      <div className={styles.splitContainer}>
        <div className={styles.splitLayout}>
          {leadingPanel && <div className={styles.leadingCell}>{leadingPanel}</div>}
          <div className={styles.summaryCell}>
            {/* fillHeight: 수입 의존도 도넛 카드와 높이를 동적으로 맞춘다 — 그리드가 두 셀을 같은
                높이로 늘리므로, 카드가 셀을 채우면 낮은 쪽이 높은 쪽에 맞춰 늘어난다(2026-08-07). */}
            <ScrollCard headingId="material-price-detail-heading" title="원자재 가격 추이" scrollable={false} fillHeight>
              {filterRow}
              {summaryGrid}
            </ScrollCard>
          </div>
          <div className={styles.chartCell}>
            <ScrollCard headingId="material-price-chart-heading" title="원자재 가격 추이 그래프" scrollable={false}>
              {chart}
            </ScrollCard>
          </div>
        </div>
      </div>
    )
  }

  // inline(기본, 롤백 경로): 필터+요약카드를 pinnedTop에, 차트를 본문에 담은 단일 카드.
  return (
    <ScrollCard
      headingId="material-price-detail-heading"
      title="원자재 가격 추이"
      scrollable={false}
      pinnedTop={
        <>
          {filterRow}
          {summaryGrid}
        </>
      }
    >
      {chart}
    </ScrollCard>
  )
}
