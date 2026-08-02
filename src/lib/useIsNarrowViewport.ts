import { useEffect, useState } from 'react'

/**
 * 뷰포트 폭이 `breakpointPx` 이하인지를 `matchMedia`로 추적한다. `SideNavProvider`/
 * `AlertsPanelProvider`가 이 값으로 고정폭 셸 요소를 자동으로 접는 데 쓴다.
 *
 * 사용 예:
 *   const isNarrowViewport = useIsNarrowViewport(NARROW_SHELL_BREAKPOINT_PX)
 */
export function useIsNarrowViewport(breakpointPx: number): boolean {
  const query = `(max-width: ${breakpointPx}px)`
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setIsNarrow(event.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return isNarrow
}
