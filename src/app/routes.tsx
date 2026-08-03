import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { PublicDashboardPage } from '../features/public/pages/PublicDashboardPage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { PurchasingDashboardPage } from '../features/purchasing/pages/PurchasingDashboardPage'
import { BriefingDetailPage } from '../features/purchasing/pages/BriefingDetailPage'
import { MaterialRiskStatusPage } from '../features/purchasing/pages/MaterialRiskStatusPage'
import { ErpImpactPage } from '../features/purchasing/pages/ErpImpactPage'
import { PurchasePriorityPage } from '../features/purchasing/pages/PurchasePriorityPage'
import { PlanningDashboardPage } from '../features/planning/pages/PlanningDashboardPage'
import { MaterialRiskPage } from '../features/planning/pages/MaterialRiskPage'
import { ImportDependencyPage } from '../features/planning/pages/ImportDependencyPage'
import { SupplierAnalysisPage } from '../features/planning/pages/SupplierAnalysisPage'
import { ContractStatusPage } from '../features/planning/pages/ContractStatusPage'
import { AiBriefingSummaryPage } from '../features/planning/pages/AiBriefingSummaryPage'
import { DataQualityPage } from '../features/planning/pages/DataQualityPage'
import { AiBriefingDetailPage } from '../features/planning/pages/AiBriefingDetailPage'
import { ContractDetailPage } from '../features/planning/pages/ContractDetailPage'
import { ExecutiveDashboardPage } from '../features/executive/pages/ExecutiveDashboardPage'
import { useAuthState } from '../lib/useAuthState'
import { DASHBOARD_PATH_BY_TIER } from '../lib/dashboardPaths'
import { TIER_LABEL } from '../lib/tierLabels'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import type { OrgTier } from '../api/types'

/**
 * 로그인 상태(orgTier)와 계층(tier)이 모두 일치해야 통과하는 라우트 가드.
 * 클라이언트 UX 수준 가드일 뿐 실제 보안 경계가 아니다 — 진짜 접근 통제는 백엔드 토큰 검증이 맡는다(CLAUDE.md 참고).
 * 미로그인이면 /auth로 무음 리다이렉트하지만, 계층이 다르면(로그인은 되어 있음) 무음 리다이렉트 대신
 * 확인 모달을 띄운다(qa-checklist.md C) — "취소"가 기본 포커스 + 주 버튼이며 홈으로 돌아가고,
 * "내 화면으로 이동"을 선택해야만 실제 자기 대시보드로 이동한다.
 */
function RequireAuth({ tier, children }: { tier: OrgTier; children: ReactNode }) {
  const { orgTier } = useAuthState()
  const navigate = useNavigate()

  if (!orgTier) {
    return <Navigate to="/auth" replace />
  }
  if (orgTier !== tier) {
    return (
      <ConfirmModal
        message={`이 화면은 회원님의 권한(${TIER_LABEL[orgTier]})으로 접근할 수 없습니다.`}
        confirmLabel="내 화면으로 이동"
        cancelLabel="취소"
        onConfirm={() => navigate(DASHBOARD_PATH_BY_TIER[orgTier], { replace: true })}
        onCancel={() => navigate('/', { replace: true })}
      />
    )
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
        path="/purchasing/material-risk"
        element={
          <RequireAuth tier="purchasing">
            <MaterialRiskStatusPage />
          </RequireAuth>
        }
      />
      <Route
        path="/purchasing/erp-impact"
        element={
          <RequireAuth tier="purchasing">
            <ErpImpactPage />
          </RequireAuth>
        }
      />
      <Route
        path="/purchasing/priority"
        element={
          <RequireAuth tier="purchasing">
            <PurchasePriorityPage />
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
        path="/planning/materials"
        element={
          <RequireAuth tier="planning">
            <MaterialRiskPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/import-dependency"
        element={
          <RequireAuth tier="planning">
            <ImportDependencyPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/suppliers"
        element={
          <RequireAuth tier="planning">
            <SupplierAnalysisPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/contracts"
        element={
          <RequireAuth tier="planning">
            <ContractStatusPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/briefings"
        element={
          <RequireAuth tier="planning">
            <AiBriefingSummaryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/data-quality"
        element={
          <RequireAuth tier="planning">
            <DataQualityPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/briefing/:analysisId"
        element={
          <RequireAuth tier="planning">
            <AiBriefingDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/planning/contract/:contractNumber"
        element={
          <RequireAuth tier="planning">
            <ContractDetailPage />
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
