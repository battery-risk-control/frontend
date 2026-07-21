import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicDashboardPage } from '../features/public/pages/PublicDashboardPage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { PurchasingDashboardPage } from '../features/purchasing/pages/PurchasingDashboardPage'
import { PlanningDashboardPage } from '../features/planning/pages/PlanningDashboardPage'
import { ExecutiveDashboardPage } from '../features/executive/pages/ExecutiveDashboardPage'
import { useAuthState } from '../lib/useAuthState'

/**
 * 로그인 상태(orgTier)가 없으면 /auth로 돌려보내는 최소 라우트 가드.
 * 클라이언트 UX 수준 가드일 뿐 실제 보안 경계가 아니다 — 진짜 접근 통제는 백엔드 토큰 검증이 맡는다(CLAUDE.md 참고).
 * 어떤 계층으로 로그인했는지는 구분하지 않는다(계층별 접근 제한은 이번 범위 밖).
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { orgTier } = useAuthState()
  if (!orgTier) {
    return <Navigate to="/auth" replace />
  }
  return children
}

/**
 * 최상위 라우트 정의 (roadmap.md Phase 6.5). "/"는 비로그인 공개 대시보드(Seq 23)로 연결한다.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboardPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/purchasing"
        element={
          <RequireAuth>
            <PurchasingDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning"
        element={
          <RequireAuth>
            <PlanningDashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/executive"
        element={
          <RequireAuth>
            <ExecutiveDashboardPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
