import type { SideNavItem } from '../components/layout/SideNav'

/**
 * 1계층 구매팀 사이드 메뉴. 대시보드와 리스크 모니터링이 같은 메뉴를 써야 화면을 오갈 때
 * 항목이 달라지지 않으므로 한 곳에서만 정의한다(원래 PurchasingDashboardPage 안에 있었다).
 *
 * 대시보드 내부 앵커(#risk-board·#briefing)는 별도 화면이 없는 항목이라 해시로 둔다 —
 * SideNav의 React key가 href라 서로 다른 해시를 붙여 중복을 피한다.
 */
export const PURCHASING_SIDE_NAV_ITEMS: SideNavItem[] = [
  { label: '리스크 현황판', href: '/purchasing#risk-board' },
  { label: '리스크 모니터링', href: '/purchasing/risk-monitoring' },
  { label: '원자재 위험', href: '/purchasing/materials' },
  { label: '계약 · RAG', href: '/purchasing/contract-rag' },
  // 앞의 세 화면이 대상을 넘겨 보내는 곳. 대상 없이 들어오면 최근 브리핑 열람 화면이 된다.
  { label: 'AI 브리핑', href: '/purchasing/ai-briefing' },
  { label: '브리핑 자료', href: '/purchasing#briefing' },
]
