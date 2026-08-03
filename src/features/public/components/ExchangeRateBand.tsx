import type { ExchangeRateItem } from '../../../api/types'
import styles from './ExchangeRateBand.module.css'

interface ExchangeRateBandProps {
  rateDate: string | null
  rates: ExchangeRateItem[]
}

/**
 * 환율 밴드. 기획서 ②번 줄(뉴스속보 마퀴 옆)에 놓이는 가로 띠다.
 *
 * 다른 패널과 달리 `ScrollCard`를 쓰지 않는다 — ②는 카드가 아니라 한 줄짜리 띠이고, 뉴스 마퀴와
 * 같은 높이로 나란히 놓여야 하기 때문이다(마퀴는 미구현이라 지금은 이 띠가 그 줄을 혼자 쓴다).
 *
 * **표기 문자열을 화면에서 조립하지 않는다.** `label`("JPY(100)/KRW")과 `change_label`("▼ 0.62%")은
 * 백엔드가 만들어 내려준다 — 100단위 고시 통화의 표기 규칙이 프론트와 백엔드로 갈라지면 어긋나고,
 * 엔화가 원화의 900배로 보이는 식의 오류는 눈에 잘 띄지도 않는다.
 *
 * 등락 색은 국내 관례를 따른다(상승 빨강 / 하락 파랑). 리스크 등급 색(`--color-risk-*`)을 쓰지
 * 않는 이유는, 환율 상승이 곧 위험은 아니어서 같은 빨강이라도 의미가 다르기 때문이다.
 *
 * 사용 예:
 *   <ExchangeRateBand rateDate={board.rate_date} rates={board.rates} />
 */
export function ExchangeRateBand({ rateDate, rates }: ExchangeRateBandProps) {
  if (rates.length === 0) {
    // 수집 전이거나 인증키 미설정이면 빈 배열이 온다. 화면을 비워두면 "고장"으로 읽히므로
    // 사유가 아니라 상태를 담담히 알린다(공개 화면이라 내부 사정을 노출하지 않는다).
    return (
      <section className={styles.band} aria-labelledby="exchange-rate-band-heading">
        <h2 id="exchange-rate-band-heading" className={styles.heading}>
          환율
        </h2>
        <p className={styles.empty}>환율 정보를 준비 중입니다.</p>
      </section>
    )
  }

  return (
    <section className={styles.band} aria-labelledby="exchange-rate-band-heading">
      <div className={styles.headingGroup}>
        <h2 id="exchange-rate-band-heading" className={styles.heading}>
          환율
        </h2>
        {/* 요청일이 아니라 실제 고시일이다. 원천이 일환율이라 주말에는 직전 영업일이 내려오므로,
            "언제 기준인지"를 감추면 사용자가 실시간 시세로 오해한다. */}
        {rateDate && <span className={styles.asOf}>{rateDate} 고시 기준</span>}
      </div>
      <ul className={styles.list}>
        {rates.map((rate) => (
          <li key={rate.currency_code} className={styles.item}>
            <span className={styles.label} title={rate.currency_name}>
              {rate.label}
            </span>
            <span className={styles.rate}>
              {rate.rate.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
              {/* 재정환율은 USD를 경유해 계산한 근사값이라 정산 근거로 쓸 수 없다.
                  숫자만 보면 고시환율과 구분되지 않으므로 기호로 표시한다. */}
              {rate.cross_rate && (
                <abbr className={styles.crossMark} title="USD를 경유해 계산한 재정환율(참고값)">
                  ≈
                </abbr>
              )}
            </span>
            <span className={changeClassName(rate.change_rate)}>{rate.change_label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** 상승 빨강 / 하락 파랑(국내 관례). 비교할 직전 고시일이 없으면 중립색. */
function changeClassName(changeRate: number | null): string {
  if (changeRate === null || changeRate === 0) {
    return `${styles.change} ${styles.changeFlat}`
  }
  return `${styles.change} ${changeRate > 0 ? styles.changeUp : styles.changeDown}`
}
