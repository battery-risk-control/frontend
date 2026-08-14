import type { OrgTier } from '../api/types'

/**
 * org_tier별 대시보드 경로. 로그인 성공 후 이동(AuthPage)과 계층 불일치 시
 * 리다이렉트(app/routes.tsx RequireAuth) 양쪽에서 공용으로 쓴다.
 */
export const DASHBOARD_PATH_BY_TIER: Record<OrgTier, string> = {
  purchasing: '/purchasing',
  planning: '/planning',
  executive: '/executive',
  admin: '/admin',
  // 시연용 마스터는 로그인 후 1계층(구매팀)에 안착하고, 공개 대시보드('/') 상단의 3계층 탭으로
  // 나머지 계층을 오간다. RequireAuth가 master를 모든 계층에서 통과시키므로 어디로 보내도 되지만
  // 데모 시작점으로 구매팀 화면을 기본값으로 둔다.
  master: '/purchasing',
}
