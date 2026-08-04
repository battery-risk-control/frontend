import styles from './SkipLink.module.css'

/**
 * 본문 바로가기 링크 (스크린리더/키보드 사용자용). 평소에는 화면 밖으로 숨겨져 있다가
 * Tab 키로 포커스를 받으면 화면 좌상단에 노출된다. 레이아웃 최상단, Header보다 앞에 둔다.
 *
 * 사용 예:
 *   <SkipLink />
 *   <Header />
 *   <main id="main-content">...</main>
 */
export function SkipLink() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      본문 바로가기
    </a>
  )
}
