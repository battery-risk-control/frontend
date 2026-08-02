import type { SideNavItem } from '../components/layout/SideNav'

/**
 * 1계층 구매팀 사이드 메뉴 6항목. 여러 페이지(PurchasingDashboardPage/BriefingDetailPage/
 * 신규 3개 서브페이지)가 같은 메뉴를 써야 화면을 오갈 때 항목이 달라지지 않으므로 한
 * 곳에서만 정의한다(2계층 `planningNav.ts`와 동일한 목적 — 그동안 두 파일에 동일 배열이
 * 중복 정의돼 있던 것을 여기로 통합). "브리핑"/"문서 관리"/"계약 검색"은 대응하는 화면
 * 설계가 아직 없어 해시 placeholder로 남긴다(C3, `docs/roadmap-candidates.md` 참고).
 * "원자재 공급사 리스크 현황"/"ERP 영향"/"구매 대응 우선순위"는 Phase 11에서 본문 제거 후
 * 미기능 상태로 방치돼 있던 것을 실제 라우트로 연결했다(2026-08-02).
 */
export const PURCHASING_SIDE_NAV_ITEMS: SideNavItem[] = [
  { label: '브리핑', href: '/purchasing#briefing' },
  { label: '문서 관리', href: '/purchasing#documents' },
  { label: '계약 검색', href: '/purchasing#contracts' },
  { label: '원자재 공급사 리스크 현황', href: '/purchasing/material-risk' },
  { label: 'ERP 영향', href: '/purchasing/erp-impact' },
  { label: '구매 대응 우선순위', href: '/purchasing/priority' },
]
