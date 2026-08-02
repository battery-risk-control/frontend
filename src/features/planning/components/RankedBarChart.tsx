import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RankedBarItem } from '../../../api/types'
import styles from './RankedBarChart.module.css'

interface RankedBarChartProps {
  title: string
  caption?: string
  items: RankedBarItem[]
}

const TONE_COLOR: Record<NonNullable<RankedBarItem['tone']>, string> = {
  critical: 'var(--color-risk-critical)',
  warning: 'var(--color-risk-warning)',
  normal: 'var(--color-risk-normal)',
  neutral: 'var(--color-primary)',
}

/**
 * "이름 + 막대 + 값" 단일 계열 막대 비교 — `ComparisonChart`의 Recharts 패턴을 일반화해
 * 2계층 7탭(자재 순위/국가 의존도/공급사 랭킹/계약 커버리지/신뢰도 분포 등)이 공유한다.
 * `tone`이 있으면 그 리스크 색상으로, 없으면 브랜드 색(neutral)으로 막대를 칠한다.
 *
 * 사용 예:
 *   <RankedBarChart title="자재별 위험 순위" items={ranking} />
 */
export function RankedBarChart({ title, caption, items }: RankedBarChartProps) {
  return (
    <section className={styles.panel} aria-labelledby={`${title}-heading`}>
      <h2 id={`${title}-heading`} className={styles.title}>
        {title}
      </h2>
      {caption && <p className={styles.caption}>{caption}</p>}
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-bg)' }}
              isAnimationActive={false}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}
            />
            <Bar dataKey="value" maxBarSize={16} radius={[0, 4, 4, 0]}>
              {items.map((item) => (
                <Cell key={item.name} fill={TONE_COLOR[item.tone ?? 'neutral']} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: unknown) => {
                  if (value === null || value === undefined) return ''
                  const match = items.find((item) => item.value === value)
                  return `${value}${match?.value_suffix ?? ''}`
                }}
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
