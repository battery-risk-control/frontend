import styles from './Footer.module.css'

/**
 * 모든 화면에 공통으로 위치·순서가 일관된 하단 영역. 운영기관 식별 정보와 외부 데이터 출처를 표시한다.
 *
 * 환율 출처 링크는 **표기 의무**다 — 공개 대시보드 환율 밴드의 재정환율 6종(칠레·아르헨티나·
 * 콩고·남아공·브라질·필리핀)이 ExchangeRate-API 무료 등급을 쓰는데, 그 이용 조건이 화면에
 * "Rates By Exchange Rate API" 링크 노출을 요구한다(디자인에 맞춰 눈에 띄지 않게 하는 것은 허용).
 * 조건상 문구와 링크 주소를 바꾸면 안 되므로 임의로 번역하거나 줄이지 않는다.
 *
 * 공통 Footer라 환율을 쓰지 않는 화면에도 함께 노출되지만, 표기가 모자란 것보다 넘치는 편이
 * 안전하고 외부 데이터 출처를 하단에 모아두는 것이 관례라 화면별로 분기하지 않는다.
 *
 * 사용 예:
 *   <Footer />
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="서비스 정책">
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <a href="/sources">데이터 출처</a>
      </nav>
      <p className={styles.text}>© 2026 Battery Risk Control · 배터리 원자재 공급망 리스크 관제</p>
      <p className={styles.credits}>
        환율{' '}
        <a
          className={styles.creditLink}
          href="https://www.exchangerate-api.com"
          target="_blank"
          rel="noreferrer"
        >
          Rates By Exchange Rate API
        </a>
        {' · '}한국수출입은행 현재환율
      </p>
    </footer>
  )
}
