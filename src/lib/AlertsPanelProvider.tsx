import { useMemo, useState, type ReactNode } from 'react'
import { AlertsPanelContext, type AlertsPanelContextValue } from './AlertsPanelContext'
import { useIsNarrowViewport } from './useIsNarrowViewport'
import { NARROW_SHELL_BREAKPOINT_PX } from './responsiveBreakpoints'

/**
 * 기본 펼침 상태 — 추후 바뀔 수 있어 하드코딩 대신 이름 붙은 상수 하나로 둔다. 이 값만
 * 바꾸면 기본 동작(펼침/접힘)이 전체적으로 뒤집힌다.
 */
export const DEFAULT_ALERTS_EXPANDED = true

/**
 * AlertsPanel(주요 알림 및 빠른 작업) 펼침/접힘 상태를 페이지 이동 간에도 유지하기 위한
 * 전역 상태(React Context) — `SideNavProvider`와 동일한 패턴. App.tsx 최상위(AppRoutes
 * 바깥)에 둬서, 지금은 `PurchasingDashboardPage` 하나만 쓰지만 다른 라우트로 갔다 돌아와도
 * (예: 브리핑 상세) 상태가 유지된다(실측 확인 — SideNavContext의 동일 왕복 패턴을 그대로
 * 따름). AlertsPanel이 없는 화면(공개 대시보드/경영진 등)은 그냥 이 상태를 안 쓸 뿐이다.
 *
 * hover 미리보기 상태(`isPreviewing`)는 여기 포함하지 않는다 — 페이지 이동으로 유지될
 * 필요가 없는 일시적 상태라 소비처(`PurchasingDashboardPage`)의 로컬 `useState`로 충분하다.
 *
 * `NARROW_SHELL_BREAKPOINT_PX` 이하에서는 수동 펼침 여부와 무관하게 항상 접힘으로
 * 취급한다(C13 — 고정 280px가 `<main>`을 짓눌러 콘텐츠가 넘치는 문제 방지, `SideNavProvider`와
 * 동일 패턴).
 *
 * 사용 예:
 *   <AlertsPanelProvider><AppRoutes /></AlertsPanelProvider>
 */
export function AlertsPanelProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(DEFAULT_ALERTS_EXPANDED)
  const isNarrowViewport = useIsNarrowViewport(NARROW_SHELL_BREAKPOINT_PX)

  const value = useMemo<AlertsPanelContextValue>(
    () => ({
      expanded: expanded && !isNarrowViewport,
      isNarrowViewport,
      toggle: () => setExpanded((prev) => !prev),
      expand: () => setExpanded(true),
    }),
    [expanded, isNarrowViewport],
  )

  return <AlertsPanelContext.Provider value={value}>{children}</AlertsPanelContext.Provider>
}
