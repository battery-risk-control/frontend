import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import styles from './DonutChart.module.css'

interface DonutDatum {
  label: string
  value: number
  color: string
}

interface DonutTooltipProps {
  active?: boolean
  payload?: Array<{ value?: number; payload?: DonutDatum }>
  /** 활성 지점(커서)의 차트 좌표(px). recharts가 주입한다. */
  coordinate?: { x?: number; y?: number }
  /** 차트 중심(px) = size/2. recharts의 viewBox가 커스텀 content엔 안 넘어와(undefined) 직접 받는다. */
  half?: number
}

/**
 * 커스텀 hover 툴팁. 색상 점 + 국가명 + 굵은 % 를 알약형 카드로 보여준다(2026-08-07). 각 조각(커서)
 * 옆에 뜨되, <b>커서가 중심 기준 어느 방향이냐에 따라 바깥쪽으로 밀어</b> 가운데 값(86%)을 덮지 않는다
 * — 왼쪽 조각이면 왼쪽으로, 위쪽이면 위로 뻗는다. 조각은 링(중심에서 떨어진 곳)에만 있으므로
 * 바깥으로 미는 한 중앙 구멍과 겹치지 않는다. 중심은 size/2(half)로 판단한다 — recharts가
 * 커스텀 content에 viewBox를 주지 않아 예전엔 중심이 (0,0)으로 잡혀 항상 중앙 쪽으로 밀렸다(실측).
 */
function DonutTooltip({ active, payload, coordinate, half = 0 }: DonutTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0]?.payload
  if (!datum) return null
  const x = coordinate?.x ?? half
  const y = coordinate?.y ?? half
  // 커서가 중심보다 왼쪽/위면 툴팁을 그 방향(바깥)으로 뻗게 해 중앙을 피한다.
  const translateX = x < half ? 'calc(-100% - 6px)' : '6px'
  const translateY = y < half ? 'calc(-100% - 6px)' : '6px'
  return (
    <div className={styles.tooltip} style={{ transform: `translate(${translateX}, ${translateY})` }}>
      <span className={styles.tooltipDot} style={{ backgroundColor: datum.color }} />
      <span className={styles.tooltipLabel}>{datum.label}</span>
      <span className={styles.tooltipValue}>{datum.value}%</span>
    </div>
  )
}

interface DonutChartProps {
  data: DonutDatum[]
  centerLabel?: string
  centerValue?: string
  /** 도넛 지름(px). 반지름은 %로 잡아 이 값에 비례해 링이 커진다. 기본 180. */
  size?: number
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
export function DonutChart({ data, centerLabel, centerValue, size = 180 }: DonutChartProps) {
  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* isAnimationActive={false} — recharts 3 + React 19 조합에서 진입 애니메이션이
              시작되지 않아 조각이 빈 <g>로만 남고 path가 그려지지 않는다(실측: 도넛이 통째로
              공백). 애니메이션을 끄면 첫 프레임부터 최종 형태로 그린다. */}
          {/* 반지름을 %로 두어 size에 비례해 링이 커진다(기존 180px에서 55/80px과 같은 비율). */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="61%"
            outerRadius="89%"
            paddingAngle={1}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          {/* 커스텀 툴팁을 <b>커서(마우스를 올린 조각) 옆</b>에 띄운다(2026-08-07). 위치 고정을 풀어
              각 원자재 조각 쪽에서 결과가 뜨게 한다. pointerEvents:none으로 마우스 추적을 방해하지 않는다. */}
          {/* zIndex로 인접 카드·범례 위로(맨 앞으로) 올린다. 카드 본문 overflow는 visible이라 잘리지 않는다. */}
          <Tooltip
            isAnimationActive={false}
            content={<DonutTooltip half={size / 2} />}
            offset={0}
            wrapperStyle={{ pointerEvents: 'none', zIndex: 40 }}
          />
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
