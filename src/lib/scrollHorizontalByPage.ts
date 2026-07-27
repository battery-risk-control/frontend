/**
 * 형제 카드 캐러셀형 컨테이너를 "카드 1장 겹치는" 페이징 단위로 스크롤한다 — 현재 보이는
 * 카드가 (1,2,3,4)였다면 다음 클릭으로 (4,5,6,7)이 되도록, 마지막 카드가 다음 화면의 첫
 * 카드로 이어져 방향 감각을 잃지 않게 한다(일반적인 "peek" 캐러셀 패턴).
 *
 * 이동 폭은 하드코딩하지 않고 매번 `container.clientWidth - 카드 1장 실제 폭`으로 계산한다 —
 * `MaterialRiskOverviewRow`(고정 180px 카드)와 `MaterialRiskOverviewSection`(가변 240px+
 * flex-grow 카드)처럼 소비처마다 카드 폭이 달라도 그대로 맞는다. 카드 폭은 컨테이너의 첫
 * 번째 자식 요소의 실제 렌더링 폭(`getBoundingClientRect`)에서 읽는다.
 *
 * 사용 예:
 *   scrollHorizontalByPage(gridRef.current, 'right')
 */
export function scrollHorizontalByPage(container: HTMLElement | null, direction: 'left' | 'right') {
  if (!container) return
  const firstCard = container.firstElementChild as HTMLElement | null
  const cardWidth = firstCard?.getBoundingClientRect().width ?? 0
  const step = Math.max(container.clientWidth - cardWidth, 0)
  container.scrollBy({ left: direction === 'right' ? step : -step, behavior: 'smooth' })
}
