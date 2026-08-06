import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { ExchangeRateItem, NewsFeedItem } from '../../../api/types'
import styles from './LiveNewsMarquee.module.css'

/**
 * 환율 칩이 다음 통화로 넘어가는 간격. 14종 기준 한 바퀴에 약 1분이라, 화면을 잠깐 봐도
 * 결제통화(USD·EUR)는 지나가고 조달국 통화도 곧 돌아온다.
 */
const RATE_ROTATE_MS = 4000

/**
 * 통화가 교체될 때 이전 값이 위로 빠지고 새 값이 아래에서 올라오는 시간(ms).
 *
 * **CSS의 `--rate-swap-ms`와 같은 값이어야 한다.** JS는 이 시간 뒤에 이전 값을 DOM에서
 * 지우는데, 값이 어긋나면 애니메이션이 끝나기 전에 사라지거나(짧으면) 다 끝난 요소가
 * 남아 있다가 다음 교체와 겹친다(길면).
 */
const RATE_SWAP_MS = 450

/**
 * 헤드라인 표시 방식.
 *   'flip'    — 우측 환율 칩처럼 한 건씩 아래→위로 세로 전환(기본).
 *   'marquee' — 예전 가로(우→좌) 흐름 띠.
 *
 * **롤백은 이 값만 'marquee'로 바꾸면 된다.** 옛 가로 흐름 구현(`MarqueeItems`,
 * `.track`/`@keyframes marquee`, `.clone`)은 지우지 않고 그대로 남겨 뒀다.
 */
const NEWS_MODE: 'flip' | 'marquee' = 'flip'

/** flip 모드에서 다음 기사로 넘어가는 간격(ms). 환율 칩(RATE_ROTATE_MS)과 같은 리듬. */
const NEWS_ROTATE_MS = 4000

/**
 * flip 모드 세로 전환 시간(ms). **CSS의 `--news-swap-ms`와 같아야 한다** — JS가 이 시간 뒤에
 * 나가는 기사를 DOM에서 지운다(환율 칩 RATE_SWAP_MS와 같은 계약).
 */
const NEWS_SWAP_MS = 450

/**
 * flip 모드에서 밴드 폭을 넘는 긴 기사를 좌로 흘릴 픽셀 속도(px/s). 클수록 빨리 흐른다.
 * 짧은 기사는 흐르지 않고 정적으로 두고, 넘치는 기사만 이 속도로 스크롤해 전체가 읽히게 한다.
 */
const NEWS_SCROLL_PX_PER_SEC = 90

interface LiveNewsMarqueeProps {
  /** 흐를 헤드라인. 목업은 5건 기준이며, 페이지가 `limit`으로 줄여 넘긴다. */
  items: NewsFeedItem[]
  /**
   * 우측 칩에 순환 표시할 환율. 비어 있으면 칩을 숨긴다.
   *
   * **한 종을 골라 넘기지 않는다.** 예전에는 페이지가 `USD`만 찾아 넘겼는데(목업 사진에
   * USD/KRW 하나만 있어서 그대로 옮긴 것), 수집해 둔 28종 중 27종이 화면에 영영 안 나오는
   * 상태였다. 어느 통화를 보여줄지는 이 컴포넌트가 순환으로 정한다.
   *
   * 배열 순서가 곧 노출 순서다 — 백엔드가 `app.exchange-rate.currencies` 순서대로 내려준다.
   */
  rates: ExchangeRateItem[]
}

/** 상승 빨강 / 하락 파랑(국내 관례). `ExchangeRateBand`와 같은 규칙이다. */
function changeClassName(changeRate: number | null): string {
  if (changeRate === null || changeRate === 0) {
    return `${styles.rateChange} ${styles.rateFlat}`
  }
  return `${styles.rateChange} ${changeRate > 0 ? styles.rateUp : styles.rateDown}`
}

function MarqueeItems({ items }: { items: NewsFeedItem[] }) {
  return (
    <>
      {items.map((item) => (
        <span key={item.risk_event_id} className={styles.item}>
          <span className={styles.material}>{item.material}</span>
          {item.url ? (
            <a className={styles.headlineLink} href={item.url} target="_blank" rel="noopener noreferrer">
              {item.headline}
            </a>
          ) : (
            /* url이 없는 항목(placeholder 등)은 링크 대신 텍스트다 — 빈 href를 걸면 클릭 시
               localhost/string 같은 엉뚱한 경로로 이동한다(백엔드가 이미 걸러 null로 보낸다). */
            <span className={styles.headline}>{item.headline}</span>
          )}
        </span>
      ))}
    </>
  )
}

/** 한 건짜리 헤드라인(자재 칩 · 제목). flip 모드에서 들어오는/나가는 기사가 같은 모양이라 뺐다. */
function NewsLine({ item }: { item: NewsFeedItem }) {
  return (
    <span className={styles.item}>
      <span className={styles.material}>{item.material}</span>
      {item.url ? (
        <a className={styles.headlineLink} href={item.url} target="_blank" rel="noopener noreferrer">
          {item.headline}
        </a>
      ) : (
        <span className={styles.headline}>{item.headline}</span>
      )}
    </span>
  )
}

/**
 * 세로 전환 헤드라인(하이브리드) — 우측 환율 칩과 같은 방식으로 기사를 한 건씩 보여준다.
 * 이전 기사가 위로 빠지며 흐려지고(`.newsLeave`), 새 기사가 아래에서 올라온다(`.newsEnter`).
 * 나가는 쪽은 `position:absolute`로 띄워 레이아웃을 밀지 않는다(칩 rateLeave와 같은 처리).
 *
 * **긴 기사는 잘리지 않게 좌로 흘린다.** 한 줄에 다 안 들어가면(측정: `scrollWidth`) 그 기사만
 * 우→좌로 스크롤해 전체가 읽히고, 다 읽을 시간을 주도록 머무는 시간(dwell)을 늘린다. 짧은
 * 기사는 그대로 세로 전환만 한다.
 *
 * 마우스를 올리면 순환·가로 스크롤이 모두 멈추고(WCAG 2.2.2, 링크 클릭용), 애니메이션 축소
 * 요청 시 순환하지 않고 첫 기사만 보여준다 — 마퀴·환율 칩과 같은 규칙이다.
 */
function FlipNews({ items }: { items: NewsFeedItem[] }) {
  const [index, setIndex] = useState(0)
  // 전환 중에만 채워지는 "빠져나가는 기사"(어느 index에서 나갔는지 key로 함께 들고 있다).
  const [leaving, setLeaving] = useState<{ item: NewsFeedItem; key: number } | null>(null)
  const [paused, setPaused] = useState(false)
  // 현재 기사가 한 줄을 넘는 픽셀. 0이면 가로 스크롤 없이 정적으로 둔다.
  const clipRef = useRef<HTMLSpanElement>(null)
  const [overflow, setOverflow] = useState(0)

  // 조회가 늦게 끝나 건수가 줄어도 항상 유효한 자리를 가리키게 한다(칩 rate와 같은 방어).
  const current = items[index % items.length]

  // 현재 기사를 그린 뒤 넘침 폭을 잰다 — 넘칠 때만 가로 스크롤한다(하이브리드).
  useLayoutEffect(() => {
    const el = clipRef.current
    if (!el) return
    const over = el.scrollWidth - el.clientWidth
    setOverflow(over > 16 ? over : 0)
  }, [current])

  // 넘치는 기사는 다 흘러 보일 때까지 더 오래 머문다. 양끝 정지 구간(0.8) 몫까지 더한다.
  const scrollMs = overflow > 0 ? Math.round(((overflow / NEWS_SCROLL_PX_PER_SEC) * 1000) / 0.8) : 0
  const dwellMs = Math.max(NEWS_ROTATE_MS, scrollMs + 700)

  useEffect(() => {
    if (items.length <= 1 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => {
      setLeaving({ item: current, key: index })
      setIndex((i) => (i + 1) % items.length)
    }, dwellMs)
    return () => clearTimeout(timer)
  }, [index, current, items, paused, dwellMs])

  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setLeaving(null), NEWS_SWAP_MS)
    return () => clearTimeout(timer)
  }, [leaving])

  return (
    <div
      className={styles.flip}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {leaving && (
        <span key={`${leaving.key}-out`} className={styles.newsLeave}>
          <span className={styles.newsClip}>
            <span className={styles.newsInner}>
              <NewsLine item={leaving.item} />
            </span>
          </span>
        </span>
      )}
      {/* key를 index로 두면 넘어갈 때마다 새 요소가 마운트되어 진입 애니메이션이 다시 걸린다. */}
      <span key={`${index}-in`} className={styles.newsEnter}>
        <span ref={clipRef} className={styles.newsClip}>
          <span
            className={overflow > 0 ? `${styles.newsInner} ${styles.newsScrolling}` : styles.newsInner}
            style={
              overflow > 0
                ? ({ '--news-scroll-x': `-${overflow}px`, '--news-scroll-ms': `${scrollMs}ms` } as CSSProperties)
                : undefined
            }
          >
            <NewsLine item={current} />
          </span>
        </span>
      </span>
    </div>
  )
}

/**
 * 뉴스 마퀴 — 목업 상단의 "LIVE" 한 줄짜리 가로 흐름 띠. 우측에 환율 칩(USD/KRW)이 붙는다.
 *
 * **별도 엔드포인트가 없다.** 아래 "최신 뉴스" 목록과 같은 `/public/news-feed`를 쓰고 `limit`으로
 * 건수만 줄인다 — 마퀴용 API를 따로 두면 상단 자막과 아래 목록이 서로 다른 기사를 가리키게 된다.
 *
 * 흐르는 애니메이션은 CSS다. 같은 목록을 두 벌 이어붙여(`aria-hidden` 복제본) 한 벌이 왼쪽으로
 * 완전히 빠져나가는 순간 두 번째 벌이 정확히 그 자리를 이어받게 한다 — 한 벌만 두면 끝나고
 * 처음으로 되돌아오는 사이에 빈 줄이 지나간다. 복제본은 스크린리더에서 같은 기사가 두 번
 * 읽히지 않도록 숨긴다.
 *
 * 번역이 안 된 기사는 영문 원문이 그대로 흐른다(`translated: false`). 백엔드 번역 스케줄러가
 * 채우는 값이라 화면에서 손대지 않는다.
 *
 * 우측 환율 칩은 `rates`를 `RATE_ROTATE_MS`마다 한 종씩 넘긴다. 칩 자리는 목업대로 한 칸이지만
 * 준비된 통화가 28종이라, 한 종을 고정하면 나머지가 화면에 영영 안 나온다. 교체는 값이 툭
 * 바뀌는 대신 **이전 값이 위로 빠지며 흐려지고 새 값이 아래에서 올라오는** 전환으로 처리한다
 * (`RATE_SWAP_MS`). 그래서 잠깐 두 값이 함께 렌더링되며, 나가는 쪽은 `position:absolute`로
 * 띄워 레이아웃을 밀지 않는다.
 *
 * 마우스를 올리면 멈추고(WCAG 2.2.2 자동 갱신 콘텐츠의 정지 수단), 사용자가 애니메이션 축소를
 * 요청했으면 순환하지 않고 첫 통화만 보여준다 — 헤드라인 흐름과 같은 규칙이다.
 *
 * 사용 예:
 *   <LiveNewsMarquee items={marqueeItems} rates={exchangeRates.rates} />
 */
export function LiveNewsMarquee({ items, rates }: LiveNewsMarqueeProps) {
  const [rateIndex, setRateIndex] = useState(0)
  // 전환 중에만 채워지는 "빠져나가는 값". 애니메이션이 끝나면 null로 되돌려 DOM에서 지운다.
  const [leavingRate, setLeavingRate] = useState<ExchangeRateItem | null>(null)
  const [ratePaused, setRatePaused] = useState(false)

  useEffect(() => {
    if (rates.length <= 1 || ratePaused) return
    // 사용자가 애니메이션 축소를 요청했으면 자동으로 바뀌지 않게 둔다. 칩은 한 칸짜리라
    // 내용이 갑자기 바뀌는 것 자체가 움직임으로 읽힌다.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = setInterval(() => {
      setRateIndex((index) => {
        // 나가는 값을 여기서 함께 기록한다 — 별도 effect로 "이전 index"를 추적하면
        // StrictMode의 이중 실행에서 한 칸 어긋난 값이 남는다.
        setLeavingRate(rates[index % rates.length] ?? null)
        return (index + 1) % rates.length
      })
    }, RATE_ROTATE_MS)
    return () => clearInterval(timer)
  }, [rates, ratePaused])

  // 전환이 끝나면 나가는 값을 지운다. 지우지 않으면 다음 교체 때 옛 값이 겹쳐 보인다.
  useEffect(() => {
    if (!leavingRate) return
    const timer = setTimeout(() => setLeavingRate(null), RATE_SWAP_MS)
    return () => clearTimeout(timer)
  }, [leavingRate])

  // 조회가 늦게 끝나 통화 수가 줄면(예: 14종 → 5종) 인덱스가 배열 밖을 가리킬 수 있다.
  // 나머지 연산으로 항상 유효한 자리에 넣는다 — 빈 배열은 아래에서 칩 자체를 숨긴다.
  const rate = rates.length > 0 ? rates[rateIndex % rates.length] : undefined

  return (
    <section className={styles.band} aria-labelledby="live-marquee-heading">
      <h2 id="live-marquee-heading" className={styles.srOnly}>
        실시간 뉴스 헤드라인
      </h2>
      <span className={styles.liveBadge}>LIVE</span>
      {items.length === 0 ? (
        <div className={styles.viewport}>
          <span className={styles.empty}>수집된 뉴스가 없습니다.</span>
        </div>
      ) : NEWS_MODE === 'flip' ? (
        <FlipNews items={items} />
      ) : (
        <div className={styles.viewport}>
          <div className={styles.track}>
            <MarqueeItems items={items} />
            <span aria-hidden="true" className={styles.clone}>
              <MarqueeItems items={items} />
            </span>
          </div>
        </div>
      )}
      {rate && (
        <span
          className={styles.rateChip}
          title={`${rate.currency_name}${rate.cross_rate ? ' · USD 경유 재정환율(참고값)' : ''}`}
          onMouseEnter={() => setRatePaused(true)}
          onMouseLeave={() => setRatePaused(false)}
          /* 통화가 바뀔 때마다 스크린리더가 낭독하면 옆의 헤드라인 흐름과 겹쳐 방해가 된다.
             값 자체는 전체 밴드(공개 대시보드 ExchangeRateBand)에서 정지 상태로 읽을 수 있다. */
          aria-hidden="true"
        >
          {/* 나가는 값과 들어오는 값이 전환 동안 함께 있으므로, 잘라낼 창(overflow:hidden)이
              하나 필요하다. 이게 없으면 위로 빠지는 값이 밴드 밖으로 삐져나온다. */}
          {leavingRate && (
            <span key={`${leavingRate.currency_code}-out`} className={styles.rateLeave}>
              <RateContent rate={leavingRate} />
            </span>
          )}
          {/* key를 통화코드로 두면 값이 바뀔 때마다 새 요소가 마운트되면서 진입 애니메이션이
              다시 걸린다 — 같은 요소를 재사용하면 CSS 애니메이션이 한 번만 재생된다. */}
          <span key={`${rate.currency_code}-in`} className={styles.rateEnter}>
            <RateContent rate={rate} />
          </span>
        </span>
      )}
    </section>
  )
}

/** 칩 한 칸의 내용(라벨 · 값 · 등락). 들어오는 값과 나가는 값이 같은 모양이라 따로 뺐다. */
function RateContent({ rate }: { rate: ExchangeRateItem }) {
  return (
    <>
      <span className={styles.rateLabel}>{rate.label}</span>
      <span className={styles.rateValue}>
        {rate.rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
        {/* 재정환율은 USD를 경유해 계산한 근사값이라 정산 근거로 쓸 수 없다. 숫자만 보면
            고시환율과 구분되지 않으므로 기호로 표시한다(ExchangeRateBand와 같은 규칙). */}
        {rate.cross_rate && <span className={styles.crossMark}>≈</span>}
      </span>
      <span className={changeClassName(rate.change_rate)}>{rate.change_label}</span>
    </>
  )
}
