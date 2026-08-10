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
}
