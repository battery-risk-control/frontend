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
 * 화면에 노출할 탭. 모두 {@link PERIOD_DAYS}에 대응하는 실제 조회 구간을 가진다.
 *
 * "사용자 설정"(날짜 범위 직접 선택) 탭은 제거했다 — 선택 UI가 없어 눌러도 차트는 그대로였고,
 * 안내 툴팁만 뜨는 죽은 버튼이었다. 다시 붙이려면 날짜 범위 picker와 기간 파라미터부터 필요하다.
 */
export const PERIOD_OPTIONS = [...Object.keys(PERIOD_DAYS)]
