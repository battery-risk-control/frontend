import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RankedBarItem } from '../../../api/types'
import { formatScore } from '../../../lib/formatScore'
import styles from './RankedBarChart.module.css'

/** 항목 하나당 확보할 세로 공간(px) — 이보다 작아지면 막대가 얇아지고, 항목이 많아지면 이만큼씩 늘어난다. */
const ROW_HEIGHT_PX = 48
const MIN_CHART_HEIGHT_PX = 160

interface RankedBarChartProps {
  title: string
  caption?: string
  items: RankedBarItem[]
  /** 제목 행 오른쪽에 들어갈 컨트롤(예: 드릴다운 대상 선택 드롭다운) — 미제공 시 제목만 표시. */
  titleAction?: ReactNode
  /** 막대 색상(tone)이 무슨 뜻인지 알려주는 범례 — 제공되면 캡션 아래 색점+텍스트 칩으로 렌더링. */
  legend?: { tone: NonNullable<RankedBarItem['tone']>; label: string }[]
  /** 경영진 공급망 그래프와 동일한 파란 그라데이션 막대 스타일. */
  executiveDependencyStyle?: boolean
}

const TONE_COLOR: Record<NonNullable<RankedBarItem['tone']>, string> = {
  critical: 'var(--color-risk-critical)',
  warning: 'var(--color-risk-warning)',
  normal: 'var(--color-risk-normal)',
  neutral: 'var(--color-primary)',
  reference: 'var(--color-confidence-reference)',
}

/**
 * "이름 + 막대 + 값" 단일 계열 막대 비교 — `ComparisonChart`의 Recharts 패턴을 일반화해
 * 2계층 7탭(자재 순위/국가 의존도/공급사 랭킹/계약 커버리지/신뢰도 분포 등)이 공유한다.
 * `tone`이 있으면 그 리스크 색상으로, 없으면 브랜드 색(neutral)으로 막대를 칠한다.
 *
 * 사용 예:
 *   <RankedBarChart title="자재별 위험 순위" items={ranking} />
 */
export function RankedBarChart({ title, caption, items, titleAction, legend, executiveDependencyStyle = false }: RankedBarChartProps) {
  const chartHeight = Math.max(items.length * ROW_HEIGHT_PX, MIN_CHART_HEIGHT_PX)

  return (
    <section className={styles.panel} aria-labelledby={`${title}-heading`}>
      <div className={styles.titleRow}>
        <h2 id={`${title}-heading`} className={styles.title}>
          {title}
        </h2>
        {titleAction}
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
      {legend && (
        <ul className={styles.legend}>
          {legend.map((entry) => (
            <li key={entry.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: TONE_COLOR[entry.tone] }} />
              {entry.label}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.chartArea} style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={items}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
            barCategoryGap="30%"
          >
            {executiveDependencyStyle && (
              <defs>
                <linearGradient id="executive-dependency-bar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1557b0" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            )}
            <CartesianGrid horizontal={false} stroke="var(--color-border)" />
            <XAxis type="number" hide domain={[0, 'dataMax + 15']} />
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
              formatter={(value: unknown) => {
                if (value === null || value === undefined) return ''
                const match = items.find((item) => item.value === value)
                return `${formatScore(Number(value))}${match?.value_suffix ?? ''}`
              }}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}
            />
            <Bar dataKey="value" maxBarSize={28} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {items.map((item) => (
                <Cell
                  key={item.name}
                  fill={executiveDependencyStyle ? 'url(#executive-dependency-bar)' : TONE_COLOR[item.tone ?? 'neutral']}
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: unknown) => {
                  if (value === null || value === undefined) return ''
                  const match = items.find((item) => item.value === value)
                  return `${formatScore(Number(value))}${match?.value_suffix ?? ''}`
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
