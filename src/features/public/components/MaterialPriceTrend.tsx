import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MaterialPriceSeries } from '../../../api/types'
import styles from './MaterialPriceTrend.module.css'

interface MaterialPriceTrendProps {
  series: MaterialPriceSeries[]
}

interface ChartRow {
  date: string
  [material: string]: string | number
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
 * 원자재 가격 추이. risk_event 스키마에는 가격 필드가 없어 데모용 합성 지수(기준일=100)를
 * 사용한다 — "비예측 원칙"에 따라 과거~현재 추이만 표시하며 미래 예측은 하지 않는다.
 * 3계열 이하이므로 범례 + 툴팁으로 식별성을 보장한다(dataviz 스킬 카테고리 팔레트 검증 완료).
 *
 * 사용 예:
 *   <MaterialPriceTrend series={series} />
 */
export function MaterialPriceTrend({ series }: MaterialPriceTrendProps) {
  const rows = toChartRows(series)
  const seriesColorVars = ['--mpt-series-1', '--mpt-series-2', '--mpt-series-3']

  return (
    <section className={styles.panel} aria-labelledby="material-price-trend-heading">
      <h2 id="material-price-trend-heading" className={styles.title}>
        원자재 가격 추이
      </h2>
      <p className={styles.caption}>데모용 합성 지수 · 기준일=100 · 예측값 아님</p>
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => value.slice(5)}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              width={40}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}
            />
            <Legend wrapperStyle={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }} />
            {series.map((materialSeries, index) => (
              <Line
                key={materialSeries.material}
                type="monotone"
                dataKey={materialSeries.material}
                stroke={`var(${seriesColorVars[index % seriesColorVars.length]})`}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 0, fill: `var(${seriesColorVars[index % seriesColorVars.length]})` }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
