import type { SideNavItem } from '../components/layout/SideNav'

/**
 * 비로그인 `/public/*` 사이드 메뉴(2026-08-03, minji `purchasingNav.ts` 구조 이식). 구매팀
 * 1계층 사이드바 하위 화면 4개(리스크 모니터링/원자재 위험/계약·RAG/AI 브리핑)를 로그인 없이도
 * 볼 수 있게 별도 프리픽스로 노출한다 — 사용자 결정(2026-08-03, AskUserQuestion): "완전 공개 +
 * mock 폴백 신규 작성" + "/public/* 별도 프리픽스". `/purchasing/*`의 인증 필수 버전(구매팀
 * 담당자 범위, 아직 미착수)과는 별개 파일·별개 컴포넌트로 분리했다 — 두 화면이 완전히 다른
 * 동작(로그인 필요 여부, mock 폴백 유무)을 갖기 때문에 같은 파일을 공유하면 두 목적이 한
 * 파일에 얽힌다.
 *
 * 첫 항목("대시보드")은 비로그인 공개 대시보드(`/`)로 돌아가는 링크 — 이 4개 화면은 SideNav를
 * 갖지 않는 `PublicDashboardPage`와 달리 구매팀 대시보드와 동일하게 SideNav 기반 레이아웃이라,
 * 대시보드로 돌아가는 경로를 이 메뉴 안에도 둔다.
 */
export const PUBLIC_SIDE_NAV_ITEMS: SideNavItem[] = [
  { label: '대시보드', href: '/' },
  { label: '리스크 모니터링', href: '/public/risk-monitoring' },
  { label: '원자재 위험', href: '/public/materials' },
  { label: '계약 · RAG', href: '/public/contract-rag' },
  { label: 'AI 브리핑', href: '/public/ai-briefing' },
]
