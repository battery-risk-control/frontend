import type { SideNavItem } from '../components/layout/SideNav'

/**
 * 2계층 경영기획팀 사이드 메뉴 7항목(전략 대시보드 + 6탭). 여러 페이지가 같은 메뉴를 써야
 * 화면을 오갈 때 항목이 달라지지 않으므로 한 곳에서만 정의한다(1계층 `purchasingNav.ts`와
 * 동일한 목적). "설정"은 상세 미정 placeholder라 실제 라우트 없이 해시로 남긴다.
 */
export const PLANNING_SIDE_NAV_ITEMS: SideNavItem[] = [
  { label: '전략 대시보드', href: '/planning' },
  { label: '자재 위험', href: '/planning/materials' },
  { label: '수입 의존도', href: '/planning/import-dependency' },
  { label: '공급사 분석', href: '/planning/suppliers' },
  { label: '계약 현황', href: '/planning/contracts' },
  { label: 'AI 브리핑', href: '/planning/briefings' },
  { label: '데이터 품질', href: '/planning/data-quality' },
  { label: '설정', href: '/planning#settings' },
]
