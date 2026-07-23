import { createContext } from 'react'

export interface SideNavContextValue {
  collapsed: boolean
  toggle: () => void
}

/** Context 객체만 정의 — Provider(SideNavProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const SideNavContext = createContext<SideNavContextValue | null>(null)
