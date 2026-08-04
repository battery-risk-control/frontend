import { useMemo, useState, type ReactNode } from 'react'
import { SideNavContext, type SideNavContextValue } from './SideNavContext'
import { useIsNarrowViewport } from './useIsNarrowViewport'
import { NARROW_SHELL_BREAKPOINT_PX } from './responsiveBreakpoints'

/**
 * SideNav 접기/펼치기 상태를 페이지 이동 간에도 유지하기 위한 전역 상태(React Context).
 * App.tsx 최상위(AppRoutes 바깥)에 둬서 Purchasing/BriefingDetail/Planning 3개 페이지가
 * 공유한다 — SideNav가 없는 화면(공개 대시보드/경영진)은 그냥 이 상태를 안 쓸 뿐이다.
 *
 * `NARROW_SHELL_BREAKPOINT_PX` 이하에서는 사용자의 수동 펼침 여부와 무관하게 항상
 * 접힘으로 취급한다(C13 — 고정 220px가 `<main>`을 짓눌러 콘텐츠가 넘치는 문제 방지).
 *
 * 사용 예:
 *   <SideNavProvider><AppRoutes /></SideNavProvider>
 */
export function SideNavProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const isNarrowViewport = useIsNarrowViewport(NARROW_SHELL_BREAKPOINT_PX)

  const value = useMemo<SideNavContextValue>(
    () => ({
      collapsed: collapsed || isNarrowViewport,
      isNarrowViewport,
      toggle: () => setCollapsed((prev) => !prev),
    }),
    [collapsed, isNarrowViewport],
  )

  return <SideNavContext.Provider value={value}>{children}</SideNavContext.Provider>
}
