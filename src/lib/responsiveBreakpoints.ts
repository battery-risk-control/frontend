/**
 * `SideNav`/`AlertsPanel`처럼 `flex-shrink:0` 고정폭인 셸 요소가 `<main>`을 지나치게
 * 짓눌러 콘텐츠(차트 등)가 넘치는 폭 — `docs/roadmap-candidates.md` C13에서 실측한 값을
 * 그대로 상수화했다(구매팀 대시보드에서 처음 발견, 2계층에서도 동일 현상 재현 확인,
 * 2026-08-02). 이 폭 이하에서는 `SideNav`/`AlertsPanel`을 자동으로 접는다.
 */
export const NARROW_SHELL_BREAKPOINT_PX = 650
