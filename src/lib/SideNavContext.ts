import { createContext } from 'react'

export interface SideNavContextValue {
  collapsed: boolean
  /** 뷰포트가 `NARROW_SHELL_BREAKPOINT_PX` 이하라 강제로 접힌 상태인지 — 토글 버튼을
   * 비활성화하는 데 쓴다(수동으로 펼쳐도 다시 좁아지는 걸 막기 위한 신호). */
  isNarrowViewport: boolean
  toggle: () => void
}

/** Context 객체만 정의 — Provider(SideNavProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const SideNavContext = createContext<SideNavContextValue | null>(null)
