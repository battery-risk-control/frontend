import { useQuery } from '@tanstack/react-query'
import {
  fetchAiBriefingDetail,
  fetchAiBriefingSummaryDashboard,
  fetchContractDetail,
  fetchContractStatusDashboard,
  fetchDataQualityStatus,
  fetchImportDependencyDashboard,
  fetchMaterialRiskDashboard,
  fetchPlanningDashboard,
  fetchSupplierAnalysisDashboard,
} from '../../../api/planning.api'
import { fetchPublicRiskBoard } from '../../../api/public.api'
import { useAuthState } from '../../../lib/useAuthState'
import { LIVE_REFRESH_SLOW_INTERVAL_MS } from '../../../lib/useLiveRefresh'

const liveQueryOptions = {
  staleTime: 30_000,
  // 2계층 쿼리는 전부 ERP·분석 집계(대시보드·지도·브리핑 요약)라 원천이 드물게 바뀐다 —
  // 60초 폴링은 서버 부하만 만들어 5분으로 차등화했다(뉴스 목록은 페이지의 별도 60초 이펙트).
  // 탭 복귀 시 즉시 갱신은 refetchOnWindowFocus가 그대로 맡는다.
  refetchInterval: LIVE_REFRESH_SLOW_INTERVAL_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
} as const

/** 2계층 7탭 + 드릴다운 2개 + 글로벌 리스크 관제 맵 공용 쿼리키 팩토리. */
export const planningKeys = {
  strategyDashboard: () => ['planning', 'strategy-dashboard'] as const,
  materialRisk: () => ['planning', 'material-risk'] as const,
  importDependency: () => ['planning', 'import-dependency'] as const,
  supplierAnalysis: () => ['planning', 'supplier-analysis'] as const,
  contractStatus: () => ['planning', 'contracts'] as const,
  aiBriefing: (page: number) => ['planning', 'ai-briefing', page] as const,
  dataQuality: () => ['planning', 'data-quality'] as const,
  aiBriefingDetail: (analysisId: string) => ['planning', 'ai-briefing', analysisId] as const,
  contractDetail: (contractNumber: string) => ['planning', 'contracts', contractNumber] as const,
  globalRiskBoard: () => ['planning', 'global-risk-board'] as const,
}

export function useStrategyDashboard() {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.strategyDashboard(),
    queryFn: () => fetchPlanningDashboard(accessToken!),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useMaterialRisk() {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.materialRisk(),
    queryFn: () => fetchMaterialRiskDashboard(accessToken!),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useImportDependency() {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.importDependency(),
    queryFn: () => fetchImportDependencyDashboard(accessToken!),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useSupplierAnalysis() {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.supplierAnalysis(),
    queryFn: () => fetchSupplierAnalysisDashboard(accessToken!),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useContractStatus() {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.contractStatus(),
    queryFn: () => fetchContractStatusDashboard(accessToken!),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useAiBriefing(page: number) {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.aiBriefing(page),
    queryFn: () => fetchAiBriefingSummaryDashboard(accessToken!, page),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useDataQuality() {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.dataQuality(),
    queryFn: () => fetchDataQualityStatus(accessToken!),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useAiBriefingDetail(analysisId: string) {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.aiBriefingDetail(analysisId),
    queryFn: () => fetchAiBriefingDetail(accessToken!, analysisId),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

export function useContractDetail(contractNumber: string) {
  const { accessToken } = useAuthState()
  return useQuery({
    queryKey: planningKeys.contractDetail(contractNumber),
    queryFn: () => fetchContractDetail(accessToken!, contractNumber),
    enabled: !!accessToken,
    ...liveQueryOptions,
  })
}

/**
 * 글로벌 리스크 관제 맵(1계층/비로그인 대시보드와 동일 위젯·데이터 소스 재사용).
 * `fetchPublicRiskBoard()`는 인증이 필요 없는 공개 엔드포인트라 다른 훅과 달리
 * `accessToken` 의존이 없다 — 화면 자체는 이미 `RequireAuth`로 보호된다.
 */
export function useGlobalRiskBoard() {
  return useQuery({
    queryKey: planningKeys.globalRiskBoard(),
    queryFn: fetchPublicRiskBoard,
    ...liveQueryOptions,
  })
}
