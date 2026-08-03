import { createContext } from 'react'

export interface AlertsPanelContextValue {
  expanded: boolean
  toggle: () => void
  /**
   * 접혀 있으면 편다. 이미 펴져 있으면 아무 일도 하지 않는다.
   *
   * `toggle`과 나눠 둔 이유: 알림 벨은 "알림을 보여 달라"는 뜻이라 눌렀을 때 닫히면 안 된다.
   * 벨에 `toggle`을 물리면 브리핑 탭을 보다가 벨을 눌렀을 때 알림으로 가는 대신 패널이 닫힌다.
   * 열고 닫기는 패널 가장자리의 화살표(`SidePanelToggleButton`)가 맡는다.
   */
  open: () => void
}

/** Context 객체만 정의 — Provider(AlertsPanelProvider.tsx)와 분리해야 react-refresh 규칙을 disable 없이 통과한다. */
export const AlertsPanelContext = createContext<AlertsPanelContextValue | null>(null)
