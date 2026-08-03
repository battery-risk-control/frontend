import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { PublicDashboardPage } from '../features/public/pages/PublicDashboardPage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { PurchasingDashboardPage } from '../features/purchasing/pages/PurchasingDashboardPage'
import { RiskMonitoringPage } from '../features/purchasing/pages/RiskMonitoringPage'
import { MaterialRiskPage } from '../features/purchasing/pages/MaterialRiskPage'
import { ContractRagPage } from '../features/purchasing/pages/ContractRagPage'
import { AiBriefingPage } from '../features/purchasing/pages/AiBriefingPage'
import { DataManagementPage } from '../features/purchasing/pages/DataManagementPage'
import { PlanningDashboardPage } from '../features/planning/pages/PlanningDashboardPage'
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
