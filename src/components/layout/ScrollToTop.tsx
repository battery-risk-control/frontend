import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 라우트(경로)가 바뀌면 화면을 맨 위로 되돌린다. React Router는 SPA 네비게이션에서 스크롤을
 * 자동으로 초기화하지 않아, 목록에서 아래로 스크롤한 상태로 상세 화면(예: /planning/briefing/:id)
 * 으로 이동하면 상세가 중간부터 보인다. 브리핑을 열면 항상 맨 위부터 보이도록 통일한다.
 *
 * `pathname`만 의존성으로 둔다 — 같은 화면 안에서 쿼리/해시만 바뀌는 경우(가격 변동성 알림의
 * 섹션 스크롤 `useDashboardAlertTarget`, 최근 브리핑 필터·페이지네이션)에는 개입하지 않는다.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
