import styles from './HorizontalScrollHint.module.css'

interface HorizontalScrollHintProps {
  showLeft: boolean
  showRight: boolean
}

/**
 * 가로 스크롤 컨테이너의 좌우 오버플로 힌트(그라데이션+화살표) — SideNav/AlertsPanel의
 * 상하단 힌트(`useScrollOverflowHint`)와 동일한 원리를 좌우로 회전 적용한 것을 공용화했다.
 * 배경은 이 힌트가 놓이는 페이지 배경(`--color-bg`)에 맞춘다(카드 자체는 `ScrollCard`가 흰
 * 배경을 가짐). `showLeft`/`showRight`만 외부(대개 `useScrollOverflowHint(axis:'horizontal')`)
 * 로부터 주입받고, 부모가 `position:relative`인 wrapper여야 절대 위치가 올바르게 잡힌다.
 *
 * 사용 예:
 *   <div style={{ position: 'relative' }}>
 *     <div ref={gridRef}>...가로 스크롤 콘텐츠...</div>
 *     <HorizontalScrollHint showLeft={hasOverflowLeft} showRight={hasOverflowRight} />
 *   </div>
 */
export function HorizontalScrollHint({ showLeft, showRight }: HorizontalScrollHintProps) {
  return (
    <>
      {showLeft && (
        <div className={styles.overflowHintLeft} aria-hidden="true">
          <span className={styles.overflowArrow}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </span>
        </div>
      )}
      {showRight && (
        <div className={styles.overflowHintRight} aria-hidden="true">
          <span className={styles.overflowArrow}>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      )}
    </>
  )
}
