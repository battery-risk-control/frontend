import type { SideNavItem } from '../components/layout/SideNav'

/**
 * 1계층 구매팀 사이드 메뉴. 대시보드와 리스크 모니터링이 같은 메뉴를 써야 화면을 오갈 때
 * 항목이 달라지지 않으므로 한 곳에서만 정의한다(원래 PurchasingDashboardPage 안에 있었다).
 *
 * 첫 항목은 원래 '리스크 현황판'(`/purchasing#risk-board`)이었다. 이름을 '대시보드'로 바꾸면서
 * 해시도 뗐다 — 해시는 "대시보드 안의 특정 구역"을 가리키려고 붙였던 것인데, 항목이 화면 전체를
 * 뜻하게 된 이상 남겨두면 같은 화면을 두 경로(`/purchasing`, `/purchasing#risk-board`)로
 * 가리키게 된다.
 *
 * '브리핑 자료'(`/purchasing#briefing`)는 뺐다. 대시보드에 `id="briefing"` 구역이 없어서 눌러도
 * 아무 데도 가지 않는 죽은 앵커였고, 브리핑 화면은 바로 위 'AI 브리핑'이 이미 맡고 있다.
 * 별도의 자료실 화면이 실제로 생기면 그때 실제 경로로 다시 넣는다.
 */
export const PURCHASING_SIDE_NAV_ITEMS: SideNavItem[] = [
  { label: '대시보드', href: '/purchasing' },
  { label: '리스크 모니터링', href: '/purchasing/risk-monitoring' },
  { label: '원자재 위험', href: '/purchasing/materials' },
  { label: '계약 · RAG', href: '/purchasing/contract-rag' },
  // 앞의 세 화면이 대상을 넘겨 보내는 곳. 대상 없이 들어오면 최근 브리핑 열람 화면이 된다.
  { label: 'AI 브리핑', href: '/purchasing/ai-briefing' },
  // 앞의 화면들이 "읽기"라면 여기만 "쓰기"다 — ERP 원본과 계약 문서를 DB에 반영한다.
  // 되돌리기가 없는 화면이라 목록 맨 끝에 둔다.
  { label: '데이터 관리', href: '/purchasing/data-management' },
]
