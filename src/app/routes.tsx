import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { PublicDashboardPage } from '../features/public/pages/PublicDashboardPage'
import { PublicRiskMonitoringPage } from '../features/public/pages/PublicRiskMonitoringPage'
import { PublicMaterialRiskPage } from '../features/public/pages/PublicMaterialRiskPage'
import { PublicContractRagPage } from '../features/public/pages/PublicContractRagPage'
import { PublicAiBriefingPage } from '../features/public/pages/PublicAiBriefingPage'
import { AuthPage } from '../features/auth/pages/AuthPage'
import { PurchasingDashboardPage } from '../features/purchasing/pages/PurchasingDashboardPage'
import { BriefingDetailPage } from '../features/purchasing/pages/BriefingDetailPage'
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
      {/*
        비로그인 `/public/*` 4개 — 구매팀 1계층 사이드바 하위 화면(리스크 모니터링/원자재
        위험/계약·RAG/AI 브리핑)을 로그인 게이트 없이 이식(2026-08-03, minji 브랜치 기반,
        사용자 결정 "완전 공개 + mock 폴백 신규 작성"). `/purchasing/*`의 인증 필수 버전
        (구매팀 담당자 범위, 별도 진행)과는 완전히 분리된 컴포넌트·API라 RequireAuth로
        감싸지 않는다.
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
