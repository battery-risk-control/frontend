import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicDashboardPage } from '../features/public/pages/PublicDashboardPage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { PurchasingDashboardPage } from '../features/purchasing/pages/PurchasingDashboardPage'
import { BriefingDetailPage } from '../features/purchasing/pages/BriefingDetailPage'
import { PlanningDashboardPage } from '../features/planning/pages/PlanningDashboardPage'
import { ExecutiveDashboardPage } from '../features/executive/pages/ExecutiveDashboardPage'
import { useAuthState } from '../lib/useAuthState'
import { DASHBOARD_PATH_BY_TIER } from '../lib/dashboardPaths'
import type { OrgTier } from '../api/types'

/**
 * 로그인 상태(orgTier)와 계층(tier)이 모두 일치해야 통과하는 라우트 가드.
 * 클라이언트 UX 수준 가드일 뿐 실제 보안 경계가 아니다 — 진짜 접근 통제는 백엔드 토큰 검증이 맡는다(CLAUDE.md 참고).
 * 미로그인이면 /auth로, 계층이 다르면 403 화면 대신 그 계정의 실제 대시보드로 리다이렉트한다.
 */
function RequireAuth({ tier, children }: { tier: OrgTier; children: ReactNode }) {
  const { orgTier } = useAuthState()
  if (!orgTier) {
    return <Navigate to="/auth" replace />
  }
  if (orgTier !== tier) {
    return <Navigate to={DASHBOARD_PATH_BY_TIER[orgTier]} replace />
  }
  return children
}

/**
 * 최상위 라우트 정의 (roadmap.md Phase 8). "/"는 비로그인 공개 대시보드(Seq 23)로 연결한다.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboardPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/purchasing"
        element={
          <RequireAuth tier="purchasing">
            <PurchasingDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/purchasing/briefing/:riskEventId"
        element={
          <RequireAuth tier="purchasing">
            <BriefingDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning"
        element={
          <RequireAuth tier="planning">
            <PlanningDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/executive"
        element={
          <RequireAuth tier="executive">
            <ExecutiveDashboardPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
