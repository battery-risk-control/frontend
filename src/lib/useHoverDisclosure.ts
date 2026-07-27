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
 *
 * `openHover`는 호출될 때마다(대상이 바뀌든 같은 대상으로 재진입하든) `expanded`를 함께
 * `false`로 되돌린다 — 이전 트리거에서 2단계까지 확장돼 있던 상태가 새 트리거로 넘어가도
 * 그대로 유지되는 걸 막기 위함(트리거 전환 시 항상 1단계부터 다시 시작).
 */
export function useHoverDisclosure<T>(): HoverDisclosure<T> {
  const [hovered, setHovered] = useState<T | null>(null)
  const [expanded, setExpanded] = useState(false)

  function openHover(value: T) {
    // 대상이 바뀌든(다른 트리거로 이동) 같은 대상으로 다시 들어오든, 매번 새로 진입한 것으로
    // 취급해 1단계부터 시작한다 — 이전 트리거에서 확장돼 있던 상태가 새 트리거로 그대로
    // 넘어오면 안 되기 때문(사용자 확인 사항).
    setHovered(value)
    setExpanded(false)
  }

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
    openHover,
    expandHover: () => setExpanded(true),
    closeHover,
  }
}
