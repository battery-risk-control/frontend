import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import styles from './DonutChart.module.css'

interface DonutDatum {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutDatum[]
  centerLabel?: string
  centerValue?: string
}

/**
 * 도넛 차트(surin DonutChart 이식, recharts Pie/Cell). 컨테이너가 고정 180x180px라
 * ScrollCard의 overflow:auto 본문 안에 들어가도 ResponsiveContainer 폭 재측정 되먹임이
 * 재현되지 않는다(사전 실측 확인 완료, MaterialPriceDetail의 width:100% 케이스와 다름) —
 * 그래서 scrollable={false}가 필요 없다.
 *
 * 사용 예:
 *   <DonutChart data={[{ label: '중국', value: 54.1, color: '#2f5adb' }]} centerValue="82.3%" centerLabel="전체 수입 의존도" />
 */
export function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  return (
    <div className={styles.wrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* isAnimationActive={false} — recharts 3 + React 19 조합에서 진입 애니메이션이
              시작되지 않아 조각이 빈 <g>로만 남고 path가 그려지지 않는다(실측: 도넛이 통째로
              공백). 애니메이션을 끄면 첫 프레임부터 최종 형태로 그린다. */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={1}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className={styles.centerOverlay}>
          <span className={styles.centerValue}>{centerValue}</span>
          {centerLabel && <span className={styles.centerLabel}>{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}
