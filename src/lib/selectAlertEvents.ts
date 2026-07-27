import type { RiskEvent } from '../api/types'

/**
 * 등급이 '심각'이거나 신뢰도가 '경고'인 risk_event만 알림 대상으로 삼는다. `AlertsPanel`
 * 컴포넌트 파일에 두면 react-refresh(컴포넌트 파일은 컴포넌트만 export해야 함) 규칙에
 * 걸려 여기로 분리했다. `AlertsPanel`(전체 목록)과 `AlertsBellButton`의 배지 숫자
 * (`PurchasingDashboardPage`에서 `alerts.length`) 양쪽이 같은 결과를 한 번만 계산해 쓴다.
 */
export function selectAlertEvents(events: RiskEvent[]): RiskEvent[] {
  return events.filter((event) => event.grade === '심각' || event.confidence_label === '경고')
}
