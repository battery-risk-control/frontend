import { createContext } from 'react'

export interface AlertsPanelContextValue {
  expanded: boolean
  toggle: () => void
  /** 강제 펼침(토글 아님) — 이미 펼쳐진 상태에서 호출해도 접히지 않는다. 마커 클릭 시
   * AlertsPanel을 자동으로 펼치는 용도(2차 데모, 마커뉴스)로 `toggle`과 별도로 둔다. */
  expand: () => void
}

/** Context 객체만 정의 — Provider(AlertsPanelProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AlertsPanelContext = createContext<AlertsPanelContextValue | null>(null)
