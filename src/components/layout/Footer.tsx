import styles from './Footer.module.css'

/**
 * 모든 화면에 공통으로 위치·순서가 일관된 하단 영역. 운영기관 식별 정보를 표시한다.
 *
 * 사용 예:
 *   <Footer />
 */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>배터리 원자재 공급망 리스크 관제 AI 에이전트</p>
    </footer>
  )
}
