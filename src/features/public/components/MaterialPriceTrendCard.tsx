import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MaterialPriceSeries } from '../../../api/types'
import styles from './MaterialPriceTrendCard.module.css'

interface MaterialPriceTrendCardProps {
  series?: MaterialPriceSeries
}

/** `2026-07-27` → `07/27`. 목업의 축 표기에 맞춘다. */
function toShortDate(date: string): string {
  return date.slice(5).replace('-', '/')
}

/**
 * 원자재 가격 추이 컴팩트 카드. 자재 한 종의 단기 추이를 선 하나로 보여준다.
 *
 * 필터·요약카드가 붙은 `MaterialPriceDetail`(구매팀 화면)과는 별개 컴포넌트다 — 이쪽은
 * 공개 대시보드용 축약형이라 조작 요소가 없다.
 *
 * **단위 표기 주의.** 부제목에 `USD/ton`을 쓰면 안 된다. 백엔드가 내려주는 값은 자재의 톤당
 * 가격이 아니라 **대표 채굴/생산 기업 주가를 프록시로 삼은 지수**다(리튬·코발트 등은 공개 현물
 * 시세 API가 없어 학습 데이터 단계부터 이 방식을 써왔다). 절대값에는 의미가 없고 "기준일 대비
 * 몇 %"만 뜻이 있으므로, 기준일을 함께 적어 무엇과 비교한 값인지 드러낸다.
 *
 * y축 눈금을 감추는 것도 같은 이유다 — 지수 숫자를 크게 띄우면 가격으로 오독된다. 형태(오르는
 * 추세인가)만 읽히면 충분하다.
 *
 * 사용 예:
 *   <MaterialPriceTrendCard series={cobaltSeries} />
 */
export function MaterialPriceTrendCard({ series }: MaterialPriceTrendCardProps) {
  const points = series?.points ?? []

  if (!series || points.length === 0) {
    return (
      <section className={styles.card} aria-labelledby="material-price-trend-heading">
        <h2 id="material-price-trend-heading" className={styles.heading}>
          원자재 가격 추이
        </h2>
        <p className={styles.empty}>가격 데이터를 준비 중입니다.</p>
      </section>
    )
  }

  const rows = points.map((point) => ({ date: point.date, value: point.price_index }))
  // 축에는 구간 양 끝만 남긴다(목업과 동일). 점이 하나뿐이면 중복 눈금이 생기지 않게 하나만 쓴다.
  const edgeTicks =
    rows.length > 1 ? [rows[0].date, rows[rows.length - 1].date] : [rows[0].date]

  return (
    <section className={styles.card} aria-labelledby="material-price-trend-heading">
      <h2 id="material-price-trend-heading" className={styles.heading}>
        원자재 가격 추이
      </h2>
      <p className={styles.subtitle}>
        {series.material}
        {' · '}
        {series.base_date ? `지수(${toShortDate(series.base_date)}=100)` : series.unit}
        {' · 일별 갱신'}
      </p>
      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          {/* 좌우 여백은 축 라벨 폭의 절반 이상이어야 한다 — y축을 숨겨 좌측 거터가 없는 탓에,
              여백이 좁으면 양 끝 눈금(07/27)이 차트 밖으로 넘쳐 Recharts가 통째로 그리지 않는다. */}
          <LineChart data={rows} margin={{ top: 8, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              ticks={edgeTicks}
              tickFormatter={toShortDate}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            {/* 눈금은 숨기되 축 자체는 둔다 — 없애면 선이 카드 상하 끝에 붙어 잘려 보인다. */}
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}
              // Recharts 타입상 label은 ReactNode라 문자열일 때만 축약한다.
              labelFormatter={(label) => (typeof label === 'string' ? toShortDate(label) : label)}
            />
            <Line
              type="monotone"
              dataKey="value"
              // 툴팁 계열명. formatter로 이름을 바꾸는 대신 name을 주면 타입 씨름 없이 같은 결과다.
              name="지수"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
