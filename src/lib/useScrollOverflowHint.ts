import { useEffect, useState, type RefObject } from 'react'

export interface ScrollOverflowHint {
  hasOverflowTop: boolean
  hasOverflowBottom: boolean
}

/** 'vertical'(기본, scrollTop/scrollHeight 기준) | 'horizontal'(scrollLeft/scrollWidth 기준) */
export type ScrollOverflowAxis = 'vertical' | 'horizontal'

/**
 * 스크롤 컨테이너가 실제로 오버플로하는지, 시작/끝 어느 쪽에 아직 안 본 콘텐츠가
 * 있는지를 scroll 이벤트 + ResizeObserver로 감지한다. ScrollCard(Phase 9.4 F)의
 * 하단 전용 힌트 로직을 일반화해 SideNav/AlertsPanel의 상하단 힌트에도 재사용한다.
 * `enabled=false`면 관찰을 붙이지 않는다(예: ScrollCard의 `scrollable=false`).
 *
 * `axis`(기본 `'vertical'`)를 `'horizontal'`로 주면 scrollWidth/clientWidth/scrollLeft
 * 기준으로 판단한다 — 반환 필드명(`hasOverflowTop`/`hasOverflowBottom`)은 축과 무관하게
 * 그대로 유지된다(기존 세로축 소비처가 무수정으로 동작해야 하므로). 의미는 "스크롤 진행
 * 방향의 시작 쪽"/"끝 쪽"으로 읽는다 — 세로축은 위/아래, 가로축은 왼쪽/오른쪽에 대응한다.
 *
 * 사용 예:
 *   const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(bodyRef, true)
 *   const { hasOverflowTop: hasOverflowLeft, hasOverflowBottom: hasOverflowRight } =
 *     useScrollOverflowHint(gridRef, true, 'horizontal')
 */
export function useScrollOverflowHint(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  axis: ScrollOverflowAxis = 'vertical',
): ScrollOverflowHint {
  const [hint, setHint] = useState<ScrollOverflowHint>({ hasOverflowTop: false, hasOverflowBottom: false })

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    function update() {
      const node = ref.current
      if (!node) return
      if (axis === 'horizontal') {
        const hasOverflow = node.scrollWidth - node.clientWidth > 1
        const atStart = node.scrollLeft < 1
        const atEnd = node.scrollWidth - node.scrollLeft - node.clientWidth < 1
        setHint({
          hasOverflowTop: hasOverflow && !atStart,
          hasOverflowBottom: hasOverflow && !atEnd,
        })
        return
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref는 안정된 객체, enabled/axis만 실제 의존성
  }, [enabled, axis])

  return hint
}
