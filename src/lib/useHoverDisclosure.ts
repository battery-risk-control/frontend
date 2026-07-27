import { useEffect, useState } from 'react'

export interface HoverDisclosure<T> {
  hovered: T | null
  expanded: boolean
  openHover: (value: T) => void
  expandHover: () => void
  closeHover: () => void
}

/**
 * 트리거 호버 → 1단계 미리보기 → 2단계 확장 → 닫힘의 2단계 hover 디스클로저 상태 머신.
 * WCAG 1.4.13(hoverable/dismissible/persistent) 충족을 위해 순수 CSS `:hover` 대신 상태로
 * 관리한다 — 트리거와 콘텐츠를 하나의 컨테이너로 감싸고 그 컨테이너에만 `onMouseLeave`를
 * 걸면(각 트리거 요소엔 `onMouseEnter`만) DOM 포함 관계상 트리거→콘텐츠 이동 중에는 컨테이너를
 * 벗어나지 않아 안 닫히고, 완전히 벗어나야 `closeHover`가 호출된다. `Escape`로도 닫힌다.
 *
 * `hovered`가 어떤 항목인지(`T`)까지 상태로 갖는 이유: PageSectionDots처럼 "어느 트리거가
 * 호버됐는지"에 따라 1단계 미리보기 내용/위치가 달라지는 경우를 위함 — boolean만으로는
 * 부족하다.
 */
export function useHoverDisclosure<T>(): HoverDisclosure<T> {
  const [hovered, setHovered] = useState<T | null>(null)
  const [expanded, setExpanded] = useState(false)

  function closeHover() {
    setHovered(null)
    setExpanded(false)
  }

  useEffect(() => {
    if (hovered === null) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeHover()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hovered])

  return {
    hovered,
    expanded,
    openHover: setHovered,
    expandHover: () => setExpanded(true),
    closeHover,
  }
}
