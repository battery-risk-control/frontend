import type {
  SideNavItem,
} from '../components/layout/SideNav'

/**
 * 3계층 경영진 대시보드의 독립 페이지 메뉴.
 *
 * 각 항목은 한 화면 안에서 스크롤하는 방식이 아니라
 * 서로 다른 페이지 주소로 이동한다.
 */
export const EXECUTIVE_SIDE_NAV_ITEMS:
  SideNavItem[] = [
    {
      label: '경영진 대시보드',
      href: '/executive',
    },
    {
      label: '핵심 위험',
      href: '/executive/risks',
    },
    {
      label: '공급망 현황',
      href: '/executive/supply-chain',
    },
    {
      label: 'AI 브리핑',
      href: '/executive/briefings',
    },
    {
      label: 'AI 검증',
      href: '/executive/verification',
    },
  ]