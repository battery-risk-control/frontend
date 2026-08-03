import type {
  ReactNode,
} from 'react'
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import type {
  OrgTier,
} from '../api/types'
import {
  ConfirmModal,
} from '../components/ui/ConfirmModal'
import {
  AuthPage,
} from '../features/auth/pages/AuthPage'
import {
  ExecutiveBriefingsPage,
} from '../features/executive/pages/ExecutiveBriefingsPage'
import {
  ExecutiveDashboardPage,
} from '../features/executive/pages/ExecutiveDashboardPage'
import {
  ExecutiveRisksPage,
} from '../features/executive/pages/ExecutiveRisksPage'
import {
  ExecutiveSupplyChainPage,
} from '../features/executive/pages/ExecutiveSupplyChainPage'
import {
  ExecutiveVerificationPage,
} from '../features/executive/pages/ExecutiveVerificationPage'
import {
  AiBriefingSummaryPage,
} from '../features/planning/pages/AiBriefingSummaryPage'
import {
  ContractStatusPage,
} from '../features/planning/pages/ContractStatusPage'
import {
  DataQualityPage,
} from '../features/planning/pages/DataQualityPage'
import {
  ImportDependencyPage,
} from '../features/planning/pages/ImportDependencyPage'
import {
  MaterialRiskPage,
} from '../features/planning/pages/MaterialRiskPage'
import {
  PlanningDashboardPage,
} from '../features/planning/pages/PlanningDashboardPage'
import {
  SupplierAnalysisPage,
} from '../features/planning/pages/SupplierAnalysisPage'
import {
  PublicDashboardPage,
} from '../features/public/pages/PublicDashboardPage'
import {
  BriefingDetailPage,
} from '../features/purchasing/pages/BriefingDetailPage'
import {
  ErpImpactPage,
} from '../features/purchasing/pages/ErpImpactPage'
import {
  MaterialRiskStatusPage,
} from '../features/purchasing/pages/MaterialRiskStatusPage'
import {
  PurchasePriorityPage,
} from '../features/purchasing/pages/PurchasePriorityPage'
import {
  PurchasingDashboardPage,
} from '../features/purchasing/pages/PurchasingDashboardPage'
import {
  DASHBOARD_PATH_BY_TIER,
} from '../lib/dashboardPaths'
import {
  TIER_LABEL,
} from '../lib/tierLabels'
import {
  useAuthState,
} from '../lib/useAuthState'

interface RequireAuthProps {
  tier: OrgTier
  children: ReactNode
}

/**
 * 로그인 상태와 사용자 계층을 확인하는 라우트 가드.
 *
 * 실제 보안 검증은 백엔드에서도 수행하며,
 * 프론트에서는 잘못된 계층 화면 접근을 안내한다.
 */
function RequireAuth({
  tier,
  children,
}: RequireAuthProps) {
  const {
    orgTier,
  } = useAuthState()

  const navigate = useNavigate()

  if (!orgTier) {
    return (
      <Navigate
        to="/auth"
        replace
      />
    )
  }

  if (orgTier !== tier) {
    return (
      <ConfirmModal
        message={
          `이 화면은 현재 계정 권한(${TIER_LABEL[orgTier]})으로 접근할 수 없습니다.`
        }
        confirmLabel="내 대시보드로 이동"
        cancelLabel="취소"
        onConfirm={() => {
          navigate(
            DASHBOARD_PATH_BY_TIER[orgTier],
            {
              replace: true,
            },
          )
        }}
        onCancel={() => {
          navigate(
            '/',
            {
              replace: true,
            },
          )
        }}
      />
    )
  }

  return children
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicDashboardPage />
        }
      />

      <Route
        path="/auth"
        element={
          <AuthPage />
        }
      />

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
        path="/executive"
        element={
          <RequireAuth tier="executive">
            <ExecutiveDashboardPage />
          </RequireAuth>
        }
      />

      <Route
        path="/executive/risks"
        element={
          <RequireAuth tier="executive">
            <ExecutiveRisksPage />
          </RequireAuth>
        }
      />

      <Route
        path="/executive/supply-chain"
        element={
          <RequireAuth tier="executive">
            <ExecutiveSupplyChainPage />
          </RequireAuth>
        }
      />

      <Route
        path="/executive/briefings"
        element={
          <RequireAuth tier="executive">
            <ExecutiveBriefingsPage />
          </RequireAuth>
        }
      />

      <Route
        path="/executive/verification"
        element={
          <RequireAuth tier="executive">
            <ExecutiveVerificationPage />
          </RequireAuth>
        }
      />
    </Routes>
  )
}