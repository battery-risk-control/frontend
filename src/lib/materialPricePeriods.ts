/**
 * 원자재 가격 추이 기간 탭 정의.
 *
 * 컴포넌트 파일이 아니라 여기 두는 이유는 Fast Refresh 제약이다 — 컴포넌트 파일이 상수를 함께
 * 내보내면 `react-refresh/only-export-components`에 걸려 HMR이 깨진다. `tierLabels`·
 * `dashboardPaths`와 같은 자리다.
 */

/**
 * 기간 라벨 → 조회 구간(일). 백엔드 `/public/price-trends?days=`에 그대로 넘어간다.
 *
 * 상한 180일은 백엔드 수집 구간(`REFRESH_DAYS`)과 같다 — 더 길게 요청해도 저장된 데이터가 없어
 * 빈 구간만 늘어나므로, "1년" 탭을 붙이려면 백엔드 수집 구간부터 늘려야 한다.
 */
export const PERIOD_DAYS: Record<string, number> = {
  '1주': 7,
  '1개월': 30,
  '3개월': 90,
  '6개월': 180,
}

export const DEFAULT_PERIOD = '1개월'

/**
 * 화면에 노출할 탭. "사용자 설정"은 날짜 범위 선택 UI가 있어야 성립해서 아직 비활성이다 —
 * 누를 수 있게 두면 버튼만 선택된 채 차트는 이전 구간 그대로라 조용히 거짓말을 하게 된다.
 */
export const PERIOD_OPTIONS = [...Object.keys(PERIOD_DAYS), '사용자 설정']
