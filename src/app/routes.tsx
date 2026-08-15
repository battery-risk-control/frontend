import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { DashboardBootstrapSkeleton } from '../components/layout/DashboardBootstrapSkeleton'
import { ScrollToTop } from '../components/layout/ScrollToTop'
import { useAuthState } from '../lib/useAuthState'
import { DASHBOARD_PATH_BY_TIER } from '../lib/dashboardPaths'
import { TIER_LABEL } from '../lib/tierLabels'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import type { OrgTier } from '../api/types'

/*
 * [ROLLBACK] 코드 스플리팅 이전에는 27개 페이지를 아래처럼 전부 정적 import 해 단일 번들
 * (JS 약 1.36MB)로 묶었다. 되돌리려면 아래 lazy 선언 블록을 지우고 이 주석을 되살린 뒤
 * <Suspense>도 걷어내면 된다. lazy 선언과 1:1 대응하도록 같은 순서로 남겨 둔다.
 *
 * import { PublicDashboardPage } from '../features/public/pages/PublicDashboardPage'
 * import { PublicRiskMonitoringPage } from '../features/public/pages/PublicRiskMonitoringPage'
 * import { PublicMaterialRiskPage } from '../features/public/pages/PublicMaterialRiskPage'
 * import { PublicContractRagPage } from '../features/public/pages/PublicContractRagPage'
 * import { PublicAiBriefingPage } from '../features/public/pages/PublicAiBriefingPage'
 * import { AuthPage } from '../features/auth/pages/AuthPage'
 * import { PurchasingDashboardPage } from '../features/purchasing/pages/PurchasingDashboardPage'
 * import { RiskMonitoringPage } from '../features/purchasing/pages/RiskMonitoringPage'
 * import { MaterialRiskPage } from '../features/purchasing/pages/MaterialRiskPage'
 * import { ContractRagPage } from '../features/purchasing/pages/ContractRagPage'
 * import { AiBriefingPage } from '../features/purchasing/pages/AiBriefingPage'
 * import { DataManagementPage } from '../features/purchasing/pages/DataManagementPage'
 * import { PlanningDashboardPage } from '../features/planning/pages/PlanningDashboardPage'
 * import { MaterialRiskPage as PlanningMaterialRiskPage } from '../features/planning/pages/MaterialRiskPage'
 * import { ImportDependencyPage } from '../features/planning/pages/ImportDependencyPage'
 * import { SupplierAnalysisPage } from '../features/planning/pages/SupplierAnalysisPage'
 * import { ContractStatusPage } from '../features/planning/pages/ContractStatusPage'
 * import { AiBriefingSummaryPage } from '../features/planning/pages/AiBriefingSummaryPage'
 * import { DataQualityPage } from '../features/planning/pages/DataQualityPage'
 * import { AiBriefingDetailPage } from '../features/planning/pages/AiBriefingDetailPage'
 * import { ContractDetailPage } from '../features/planning/pages/ContractDetailPage'
 * import { ExecutiveDashboardPage } from '../features/executive/pages/ExecutiveDashboardPage'
 * import { ExecutiveRisksPage } from '../features/executive/pages/ExecutiveRisksPage'
 * import { ExecutiveSupplyChainPage } from '../features/executive/pages/ExecutiveSupplyChainPage'
 * import { ExecutiveBriefingsPage } from '../features/executive/pages/ExecutiveBriefingsPage'
 * import { ExecutiveVerificationPage } from '../features/executive/pages/ExecutiveVerificationPage'
 * import { AdminApprovalsPage } from '../features/admin/pages/AdminApprovalsPage'
 */

// 라우트 단위 코드 스플리팅. 각 페이지를 별도 청크로 떼어 첫 진입 시 필요한 것만 받는다.
// named export라 `.then(m => ({ default: ... }))`로 매핑한다. 위 [ROLLBACK] 블록과 같은 순서.
const PublicDashboardPage = lazy(() => import('../features/public/pages/PublicDashboardPage').then((m) => ({ default: m.PublicDashboardPage })))
const PublicRiskMonitoringPage = lazy(() => import('../features/public/pages/PublicRiskMonitoringPage').then((m) => ({ default: m.PublicRiskMonitoringPage })))
const PublicMaterialRiskPage = lazy(() => import('../features/public/pages/PublicMaterialRiskPage').then((m) => ({ default: m.PublicMaterialRiskPage })))
const PublicContractRagPage = lazy(() => import('../features/public/pages/PublicContractRagPage').then((m) => ({ default: m.PublicContractRagPage })))
const PublicAiBriefingPage = lazy(() => import('../features/public/pages/PublicAiBriefingPage').then((m) => ({ default: m.PublicAiBriefingPage })))
const AuthPage = lazy(() => import('../features/auth/pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const PurchasingDashboardPage = lazy(() => import('../features/purchasing/pages/PurchasingDashboardPage').then((m) => ({ default: m.PurchasingDashboardPage })))
const RiskMonitoringPage = lazy(() => import('../features/purchasing/pages/RiskMonitoringPage').then((m) => ({ default: m.RiskMonitoringPage })))
const MaterialRiskPage = lazy(() => import('../features/purchasing/pages/MaterialRiskPage').then((m) => ({ default: m.MaterialRiskPage })))
const ContractRagPage = lazy(() => import('../features/purchasing/pages/ContractRagPage').then((m) => ({ default: m.ContractRagPage })))
const AiBriefingPage = lazy(() => import('../features/purchasing/pages/AiBriefingPage').then((m) => ({ default: m.AiBriefingPage })))
const DataManagementPage = lazy(() => import('../features/purchasing/pages/DataManagementPage').then((m) => ({ default: m.DataManagementPage })))
const PlanningDashboardPage = lazy(() => import('../features/planning/pages/PlanningDashboardPage').then((m) => ({ default: m.PlanningDashboardPage })))
const PlanningMaterialRiskPage = lazy(() => import('../features/planning/pages/MaterialRiskPage').then((m) => ({ default: m.MaterialRiskPage })))
const ImportDependencyPage = lazy(() => import('../features/planning/pages/ImportDependencyPage').then((m) => ({ default: m.ImportDependencyPage })))
const SupplierAnalysisPage = lazy(() => import('../features/planning/pages/SupplierAnalysisPage').then((m) => ({ default: m.SupplierAnalysisPage })))
const ContractStatusPage = lazy(() => import('../features/planning/pages/ContractStatusPage').then((m) => ({ default: m.ContractStatusPage })))
const AiBriefingSummaryPage = lazy(() => import('../features/planning/pages/AiBriefingSummaryPage').then((m) => ({ default: m.AiBriefingSummaryPage })))
const DataQualityPage = lazy(() => import('../features/planning/pages/DataQualityPage').then((m) => ({ default: m.DataQualityPage })))
const AiBriefingDetailPage = lazy(() => import('../features/planning/pages/AiBriefingDetailPage').then((m) => ({ default: m.AiBriefingDetailPage })))
const ContractDetailPage = lazy(() => import('../features/planning/pages/ContractDetailPage').then((m) => ({ default: m.ContractDetailPage })))
const ExecutiveDashboardPage = lazy(() => import('../features/executive/pages/ExecutiveDashboardPage').then((m) => ({ default: m.ExecutiveDashboardPage })))
const ExecutiveRisksPage = lazy(() => import('../features/executive/pages/ExecutiveRisksPage').then((m) => ({ default: m.ExecutiveRisksPage })))
const ExecutiveSupplyChainPage = lazy(() => import('../features/executive/pages/ExecutiveSupplyChainPage').then((m) => ({ default: m.ExecutiveSupplyChainPage })))
const ExecutiveBriefingsPage = lazy(() => import('../features/executive/pages/ExecutiveBriefingsPage').then((m) => ({ default: m.ExecutiveBriefingsPage })))
const ExecutiveVerificationPage = lazy(() => import('../features/executive/pages/ExecutiveVerificationPage').then((m) => ({ default: m.ExecutiveVerificationPage })))
const AdminApprovalsPage = lazy(() => import('../features/admin/pages/AdminApprovalsPage').then((m) => ({ default: m.AdminApprovalsPage })))

/**
 * 로그인 상태(orgTier)와 계층(tier)이 모두 일치해야 통과하는 라우트 가드.
 * 클라이언트 UX 수준 가드일 뿐 실제 보안 경계가 아니다 — 진짜 접근 통제는 백엔드 토큰 검증이 맡는다(CLAUDE.md 참고).
 * 미로그인이면 /auth로 무음 리다이렉트하지만, 계층이 다르면(로그인은 되어 있음) 무음 리다이렉트 대신
 * 확인 모달을 띄운다(qa-checklist.md C) — "취소"가 기본 포커스 + 주 버튼이며 홈으로 돌아가고,
 * "내 화면으로 이동"을 선택해야만 실제 자기 대시보드로 이동한다.
 */
function RequireAuth({ tier, children }: { tier: OrgTier; children: ReactNode }) {
  const { orgTier, initializing } = useAuthState()
  const navigate = useNavigate()

  // 부트스트랩(HttpOnly 쿠키로 세션 복원) 중에는 판정을 미룬다 — 로그인 상태인데 /auth로 잠깐
  // 튕기는(F5 시 로그인 화면 번쩍임) 것을 막는다. 이 구간은 대시보드 골격 스켈레톤으로 덮어
  // 세션 복원 → 페이지 자체 데이터 스켈레톤으로 매끄럽게 이어지게 한다.
  if (initializing) {
    return <DashboardBootstrapSkeleton />
  }
  if (!orgTier) {
    return <Navigate to="/auth" replace />
  }
  // 시연용 마스터 계정은 계층 불일치 게이트를 통과한다 — 한 계정으로 1·2·3계층 대시보드를 모두
  // 열람하기 위한 것이다(백엔드도 master에게 세 계층 역할 권한을 모두 부여해 API가 함께 열린다).
  if (orgTier !== tier && orgTier !== 'master') {
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
    <>
      <ScrollToTop />
      {/*
        lazy 페이지 청크를 받는 동안의 fallback. 세션 부트스트랩과 같은 대시보드 골격
        스켈레톤을 재사용해, 부트스트랩 스켈레톤 → 청크 로드 → 페이지 자체 데이터 스켈레톤이
        시각적으로 끊기지 않게 잇는다.
      */}
      <Suspense fallback={<DashboardBootstrapSkeleton />}>
      <Routes>
      <Route path="/" element={<PublicDashboardPage />} />
      {/*
        비로그인 `/public/*` 4개 — 구매팀 1계층 사이드바 하위 화면(리스크 모니터링/원자재
        위험/계약·RAG/AI 브리핑)을 로그인 게이트 없이 이식. `/purchasing/*`의 인증 필수 버전과는
        완전히 분리된 컴포넌트·API라 RequireAuth로 감싸지 않는다.
      */}
      <Route path="/public/risk-monitoring" element={<PublicRiskMonitoringPage />} />
      <Route path="/public/materials" element={<PublicMaterialRiskPage />} />
      <Route path="/public/contract-rag" element={<PublicContractRagPage />} />
      <Route path="/public/ai-briefing" element={<PublicAiBriefingPage />} />
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
        path="/purchasing/risk-monitoring"
        element={
          <RequireAuth tier="purchasing">
            <RiskMonitoringPage />
          </RequireAuth>
        }
      />
      <Route
        path="/purchasing/materials"
        element={
          <RequireAuth tier="purchasing">
            <MaterialRiskPage />
          </RequireAuth>
        }
      />
      <Route
        path="/purchasing/contract-rag"
        element={
          <RequireAuth tier="purchasing">
            <ContractRagPage />
          </RequireAuth>
        }
      />
      {/*
        AI 브리핑은 앞의 세 화면에서 `?source=NEWS&ref=252` 형태로 대상을 넘겨 받는다.
        쿼리스트링 없이 들어오면 "최근 브리핑" 열람 전용 화면이 된다.
      */}
      <Route
        path="/purchasing/ai-briefing"
        element={
          <RequireAuth tier="purchasing">
            <AiBriefingPage />
          </RequireAuth>
        }
      />
      {/*
        구형 브리핑 열람 화면(Seq 24). 화면 자체는 걷어냈다 — 백엔드 API가 아니라 하드코딩된
        mock 데이터를 그리던 것이라, 새 AI 브리핑과 나란히 두면 어느 쪽이 실제 결과인지
        구분되지 않았다. 기존 링크·북마크가 죽지 않도록 경로만 남겨 AI 브리핑으로 보낸다.
        (riskEventId는 새 화면의 source/ref로 옮길 수 없다 — placeholder API의 자체 식별자다.)
      */}
      <Route
        path="/purchasing/briefing/:riskEventId"
        element={
          <RequireAuth tier="purchasing">
            <Navigate to="/purchasing/ai-briefing" replace />
          </RequireAuth>
        }
      />
      {/*
        1계층 구매팀 마지막 화면. ERP CSV와 계약 문서를 DB에 반영하는 유일한 쓰기 화면이라
        같은 tier 가드 안에 둔다(백엔드도 /api/v1/erp/imports를 PURCHASING으로 제한한다).
      */}
      <Route
        path="/purchasing/data-management"
        element={
          <RequireAuth tier="purchasing">
            <DataManagementPage />
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
            <PlanningMaterialRiskPage />
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
      {/* 관리자(ADMIN) 전용 가입 승인 화면(시큐어코딩 5). admin 계층만 통과한다. */}
      <Route
        path="/admin"
        element={
          <RequireAuth tier="admin">
            <AdminApprovalsPage />
          </RequireAuth>
        }
      />
      </Routes>
      </Suspense>
    </>
  )
}
