import { createContext } from 'react'

export interface AlertsPanelContextValue {
  expanded: boolean
  toggle: () => void
}

/** Context 객체만 정의 — Provider(AlertsPanelProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AlertsPanelContext = createContext<AlertsPanelContextValue | null>(null)
