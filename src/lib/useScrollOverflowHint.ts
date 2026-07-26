import { useEffect, useState, type RefObject } from 'react'

export interface ScrollOverflowHint {
  hasOverflowTop: boolean
  hasOverflowBottom: boolean
}

/**
 * 스크롤 컨테이너가 실제로 오버플로하는지, 위/아래 어느 쪽에 아직 안 본 콘텐츠가
 * 있는지를 scroll 이벤트 + ResizeObserver로 감지한다. ScrollCard(Phase 9.4 F)의
 * 하단 전용 힌트 로직을 일반화해 SideNav/AlertsPanel의 상하단 힌트에도 재사용한다.
 * `enabled=false`면 관찰을 붙이지 않는다(예: ScrollCard의 `scrollable=false`).
 *
 * 사용 예:
 *   const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(bodyRef, true)
 */
export function useScrollOverflowHint(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): ScrollOverflowHint {
  const [hint, setHint] = useState<ScrollOverflowHint>({ hasOverflowTop: false, hasOverflowBottom: false })

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    function update() {
      const node = ref.current
      if (!node) return
      const hasOverflow = node.scrollHeight - node.clientHeight > 1
      const atTop = node.scrollTop < 1
      const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 1
      setHint({
        hasOverflowTop: hasOverflow && !atTop,
        hasOverflowBottom: hasOverflow && !atBottom,
      })
    }

    update()
    el.addEventListener('scroll', update)
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener('scroll', update)
      resizeObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref는 안정된 객체, enabled만 실제 의존성
  }, [enabled])

  return hint
}
