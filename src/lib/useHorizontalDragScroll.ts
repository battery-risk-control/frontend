import { useRef, useState, type MouseEvent, type RefObject } from 'react'

export interface HorizontalDragScrollHandlers {
  isDragging: boolean
  onMouseDown: (event: MouseEvent<HTMLElement>) => void
  onMouseMove: (event: MouseEvent<HTMLElement>) => void
  onMouseUp: () => void
  onMouseLeave: () => void
}

/**
 * 가로 스크롤 컨테이너에 마우스 드래그(grab-to-scroll) 이동을 붙인다 — 가로 휠 지원이
 * 기기마다 약한 "형제 카드 캐러셀형" 콘텐츠(design-tokens.md "스크롤 UI 노출 원칙")에서
 * 네이티브 스크롤바와 함께 실질적 주 조작 수단으로 쓴다. mousedown에서 시작 좌표/scrollLeft를
 * 기록하고, mousemove로 scrollLeft를 갱신하며, mouseup/mouseleave에서 종료한다.
 * `isDragging`으로 `cursor: grab`/`grabbing` 전환에 쓴다.
 *
 * 사용 예:
 *   const gridRef = useRef<HTMLDivElement>(null)
 *   const drag = useHorizontalDragScroll(gridRef)
 *   <div
 *     ref={gridRef}
 *     className={drag.isDragging ? `${styles.grid} ${styles.dragging}` : styles.grid}
 *     onMouseDown={drag.onMouseDown}
 *     onMouseMove={drag.onMouseMove}
 *     onMouseUp={drag.onMouseUp}
 *     onMouseLeave={drag.onMouseLeave}
 *   >
 */
export function useHorizontalDragScroll(ref: RefObject<HTMLElement | null>): HorizontalDragScrollHandlers {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartXRef = useRef(0)
  const dragStartScrollLeftRef = useRef(0)

  function onMouseDown(event: MouseEvent<HTMLElement>) {
    const el = ref.current
    if (!el) return
    setIsDragging(true)
    dragStartXRef.current = event.pageX
    dragStartScrollLeftRef.current = el.scrollLeft
  }

  function onMouseMove(event: MouseEvent<HTMLElement>) {
    if (!isDragging) return
    const el = ref.current
    if (!el) return
    el.scrollLeft = dragStartScrollLeftRef.current - (event.pageX - dragStartXRef.current)
  }

  function onMouseUp() {
    setIsDragging(false)
  }

  return { isDragging, onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp }
}
