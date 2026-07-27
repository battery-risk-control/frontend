import styles from './HorizontalScrollHint.module.css'

interface HorizontalScrollHintProps {
  showLeft: boolean
  showRight: boolean
  onClickLeft?: () => void
  onClickRight?: () => void
}

/**
 * 가로 스크롤 컨테이너의 좌우 오버플로 힌트(그라데이션+화살표) — SideNav/AlertsPanel의
 * 상하단 힌트(`useScrollOverflowHint`)와 동일한 원리를 좌우로 회전 적용한 것을 공용화했다.
 * 배경은 이 힌트가 놓이는 페이지 배경(`--color-bg`)에 맞춘다(카드 자체는 `ScrollCard`가 흰
 * 배경을 가짐). `showLeft`/`showRight`만 외부(대개 `useScrollOverflowHint(axis:'horizontal')`)
 * 로부터 주입받고, 부모가 `position:relative`인 wrapper여야 절대 위치가 올바르게 잡힌다.
 *
 * `onClickLeft`/`onClickRight`(선택)를 주면 `<button aria-label>`로, 안 주면 기존과 동일하게
 * `<div aria-hidden>` 순수 시각 힌트로 렌더링한다(하위 호환 — 클릭 동작이 필요 없는 소비처는
 * 아무것도 안 바꿔도 됨).
 *
 * 사용 예:
 *   <div style={{ position: 'relative' }}>
 *     <div ref={gridRef}>...가로 스크롤 콘텐츠...</div>
 *     <HorizontalScrollHint
 *       showLeft={hasOverflowLeft}
 *       showRight={hasOverflowRight}
 *       onClickLeft={() => scrollHorizontalByPage(gridRef.current, 'left')}
 *       onClickRight={() => scrollHorizontalByPage(gridRef.current, 'right')}
 *     />
 *   </div>
 */
export function HorizontalScrollHint({ showLeft, showRight, onClickLeft, onClickRight }: HorizontalScrollHintProps) {
  const arrowLeft = (
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
  )
  const arrowRight = (
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
  )

  return (
    <>
      {showLeft &&
        (onClickLeft ? (
          <button
            type="button"
            className={styles.overflowHintLeft}
            onClick={onClickLeft}
            aria-label="이전 카드 보기"
          >
            {arrowLeft}
          </button>
        ) : (
          <div className={styles.overflowHintLeft} aria-hidden="true">
            {arrowLeft}
          </div>
        ))}
      {showRight &&
        (onClickRight ? (
          <button
            type="button"
            className={styles.overflowHintRight}
            onClick={onClickRight}
            aria-label="다음 카드 보기"
          >
            {arrowRight}
          </button>
        ) : (
          <div className={styles.overflowHintRight} aria-hidden="true">
            {arrowRight}
          </div>
        ))}
    </>
  )
}
