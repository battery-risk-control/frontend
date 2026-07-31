import { useEffect, useState, type ReactNode } from 'react'
import type { ExchangeRateItem, NewsFeedItem } from '../../../api/types'
import styles from './NewsExchangeTicker.module.css'

interface NewsExchangeTickerProps {
  news: NewsFeedItem[]
  exchangeRates: ExchangeRateItem[]
}

/** 전환 애니메이션 지속 시간. `RollingRow`의 setTimeout(줄바꿈 없이 순간 리셋하는 시점)과
 * CSS transition-duration이 반드시 같은 값을 참조해야 어긋나지 않는다. */
const TRANSITION_MS = 400

/** 한 항목의 높이(px). `NewsExchangeTicker.module.css`의 `.viewport`/`.trackItem` height와
 * 반드시 같은 값을 참조해야 한다. `translateY(-N%)`는 트랙 자기 자신의 전체 높이(항목
 * 개수만큼 누적된 값) 기준으로 계산되므로 인덱스별 이동 폭이 매번 달라져 버그가 난다
 * (실측 확인 — 인덱스 1에서 translateY(-100%)가 "항목 1개만큼"이 아니라 "트랙 전체
 * 높이만큼" 이동해 콘텐츠가 통째로 뷰포트 밖으로 사라짐). px 고정값으로 이동해야
 * 항목 개수와 무관하게 매번 정확히 한 줄만 이동한다. */
const ROW_HEIGHT_PX = 22

interface RollingRowProps<T> {
  label: string
  items: T[]
  intervalMs: number
  renderItem: (item: T) => ReactNode
  getKey: (item: T, index: number) => string
}

/**
 * 세로 롤링 한 줄 — 일정 주기(`intervalMs`)마다 다음 항목이 아래에서 올라오며 이전
 * 항목은 위로 사라진다(원문 명세 "아래로 롤링"). 무한 루프 이음매를 자연스럽게 하려고
 * 목록 끝에 첫 항목을 하나 더 붙여두고, 그 복제본까지 이동한 직후에만 transition 없이
 * 순간적으로 인덱스 0으로 되돌린다(흔한 "무한 캐러셀" 기법 — 흔한 "루프백 점프" 없이
 * 방향이 항상 위쪽으로만 유지된다).
 */
function RollingRow<T>({ label, items, intervalMs, renderItem, getKey }: RollingRowProps<T>) {
  const [index, setIndex] = useState(0)
  const [instant, setInstant] = useState(false)
  const extendedItems = items.length > 0 ? [...items, items[0]] : items

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => setIndex((prev) => prev + 1), intervalMs)
    return () => clearInterval(id)
  }, [items.length, intervalMs])

  useEffect(() => {
    if (index === items.length) {
      const timeout = setTimeout(() => {
        setInstant(true)
        setIndex(0)
      }, TRANSITION_MS)
      return () => clearTimeout(timeout)
    }
    if (instant) {
      const raf = requestAnimationFrame(() => setInstant(false))
      return () => cancelAnimationFrame(raf)
    }
  }, [index, items.length, instant])

  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <div className={styles.viewport}>
        {items.length === 0 ? (
          <span className={styles.trackItem}>표시할 데이터가 없습니다.</span>
        ) : (
          <div
            className={instant ? `${styles.track} ${styles.trackInstant}` : styles.track}
            style={{ transform: `translateY(-${index * ROW_HEIGHT_PX}px)` }}
          >
            {extendedItems.map((item, i) => (
              <div key={getKey(item, i)} className={styles.trackItem}>
                {renderItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 뉴스속보 · 환율정보 2단 세로 롤링 티커(2차 데모, 관제 맵 바로 위). `SupplyNewsFeed`
 * (정적 리스트, 필터링 없음)와 같은 `fetchNewsFeed()` 데이터를 표현만 다르게(세로 롤링
 * 헤드라인) 재사용한다 — 신규 뉴스 함수는 만들지 않는다. `ScrollCard`를 쓰지 않는 예외
 * 레이아웃(자동 롤링이라 스크롤 콘텐츠 성격이 아님, CLAUDE.md "지도·복합 필터" 예외
 * 조항과 동일하게 취급).
 *
 * 사용 예:
 *   <NewsExchangeTicker news={news} exchangeRates={rates} />
 */
export function NewsExchangeTicker({ news, exchangeRates }: NewsExchangeTickerProps) {
  return (
    <section className={styles.section} aria-labelledby="news-exchange-ticker-heading">
      <h2 id="news-exchange-ticker-heading" className={styles.srOnlyHeading}>
        뉴스속보 · 환율정보
      </h2>
      <RollingRow
        label="뉴스속보"
        items={news}
        intervalMs={3000}
        getKey={(item, i) => `${item.risk_event_id}-${i}`}
        renderItem={(item) => item.headline}
      />
      <RollingRow
        label="환율정보"
        items={exchangeRates}
        intervalMs={4000}
        getKey={(item, i) => `${item.currency_code}-${i}`}
        renderItem={(rate) => `${rate.currency_name}(${rate.currency_code}) ${rate.rate.toLocaleString('ko-KR')}원 ${rate.change_label}`}
      />
    </section>
  )
}
