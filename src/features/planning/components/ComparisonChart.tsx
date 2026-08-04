import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RiskExposureByUnit } from '../../../api/types'
import { formatScore } from '../../../lib/formatScore'
import styles from './ComparisonChart.module.css'

interface ComparisonChartProps {
  items: RiskExposureByUnit[]
}

/**
 * 핵심 시각화 및 비교 — 사업부별 리스크 노출도 비교(risk_exposure_by_unit).
 * "magnitude 비교"이므로 dataviz 스킬에 따라 카테고리 색이 아닌 단일 계열(브랜드 hue)로 표시하고,
 * 막대가 1개 계열이라 범례 없이 막대 끝 직접 라벨로 값을 보여준다.
 *
 * 사용 예:
 *   <ComparisonChart items={dashboard.risk_exposure_by_unit} />
 */
export function ComparisonChart({ items }: ComparisonChartProps) {
  return (
    <section className={styles.panel} aria-labelledby="comparison-chart-heading">
      <h2 id="comparison-chart-heading" className={styles.title}>
        핵심 시각화 및 비교
      </h2>
      <p className={styles.caption}>사업부별 리스크 노출도 점수</p>
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="business_unit"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              width={32}
              domain={[0, 'dataMax + 10']}
              tickFormatter={(value: number) => formatScore(value)}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-bg)' }}
              isAnimationActive={false}
              formatter={(value: unknown) => (value === null || value === undefined ? '' : `${formatScore(Number(value))}점`)}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}
            />
            <Bar
              dataKey="exposure_score"
              name="노출도 점수"
              fill="var(--color-primary)"
              maxBarSize={64}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="exposure_score"
                position="top"
                formatter={(value: unknown) => (value === null || value === undefined ? '' : `${formatScore(Number(value))}점`)}
                fill="var(--color-text)"
                fontSize={12}
                fontWeight="var(--font-weight-bold)"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
