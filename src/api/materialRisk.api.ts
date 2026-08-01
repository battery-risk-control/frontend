import { fetchWithAuth } from './http'
import type {
  ContractEvidence,
  MaterialBriefing,
  MaterialRiskDetail,
  MaterialRiskOverview,
} from './types'

/**
 * 1계층 구매팀 "원자재 위험" 화면 API 클라이언트.
 *
 * `riskMonitoring.api.ts`와 같은 방침으로 **mock 폴백이 없다.** 이 화면이 보여주는 것은 ERP
 * 테이블의 재고·발주·공급사 구조라서, 지어낸 목록을 띄우면 "우리 재고가 이렇다"는 잘못된
 * 인상을 준다 — 백엔드가 없으면 빈 화면과 안내 문구를 보여주는 편이 정확하다.
 *
 * 모든 호출이 인증을 요구하므로 `accessToken`을 인자로 받는다 — 토큰은 `useAuthState()`에 있다.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/** `VITE_API_BASE_URL`이 없으면 실 API를 부를 수 없다 — 화면이 안내 문구를 띄우도록 알린다. */
export function isMaterialRiskApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

/**
 * 상단 KPI + 자재별 위험 목록. 둘이 같은 계산 결과에서 나오므로 한 번에 온다.
 *
 * 자재 수만큼 ERP Exposure Agent 호출이 일어나므로 다른 조회보다 느리다(현재 10종 기준
 * 수백 ms). 화면은 로딩 표시를 반드시 띄운다.
 *
 * 사용 예:
 *   const overview = await fetchMaterialRiskOverview(accessToken)
 */
export async function fetchMaterialRiskOverview(
  accessToken: string,
): Promise<MaterialRiskOverview> {
  const result = await fetchWithAuth<MaterialRiskOverview>(
    '/api/v1/material-risk/overview',
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 자재 상세. ERP 노출 정보·주 공급사·연결 계약·세부 점수 5개가 함께 온다.
 *
 * 재고 데이터가 없는 자재도 404가 아니라 200으로 오고 `unavailable_reason`이 채워진다 —
 * 목록에 보이는 행을 눌렀는데 오류가 나면 화면이 앞뒤가 안 맞기 때문이다.
 *
 * 사용 예:
 *   const detail = await fetchMaterialRiskDetail(accessToken, 'MAT-CO-SULF')
 */
export async function fetchMaterialRiskDetail(
  accessToken: string,
  erpMaterialId: string,
): Promise<MaterialRiskDetail> {
  const result = await fetchWithAuth<MaterialRiskDetail>(
    `/api/v1/material-risk/materials/${encodeURIComponent(erpMaterialId)}`,
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * "계약 RAG 근거 보기". 이 자재의 연결 계약에서 지금 상황에 해당하는 조항을 찾아온다.
 *
 * 질의는 화면이 만들지 않는다 — ERP Exposure Agent가 상황에 맞춰 만든 질문(납기 지연 통보·
 * 불가항력·대체 공급사 제한 등)을 백엔드가 그대로 쓰고, 무엇을 물었는지 `questions`로 함께 준다.
 *
 * 사용 예:
 *   const evidence = await fetchContractEvidence(accessToken, 'MAT-CO-SULF')
 */
export async function fetchContractEvidence(
  accessToken: string,
  erpMaterialId: string,
): Promise<ContractEvidence> {
  const result = await fetchWithAuth<ContractEvidence>(
    `/api/v1/material-risk/materials/${encodeURIComponent(erpMaterialId)}/contract-evidence`,
    accessToken,
    { method: 'POST' },
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * "AI 브리핑 생성". 이 자재에 대해 멀티에이전트를 실행한다.
 *
 * 이 화면에는 뉴스가 없으므로 외부신호는 백엔드가 DB에 이미 저장된 같은 자재 대분류의 최신
 * 분석에서 끌어온다(응답의 `source_*`가 그 출처). 쓸 분석이 없으면 422가 오는데, 상세의
 * `briefing_available`로 미리 알 수 있어 화면은 버튼을 먼저 비활성화한다.
 *
 * LLM 문구 생성은 기본 off다(`useLlm`) — 등급 산출에 필요 없고 버튼 한 번이 곧 비용이다.
 *
 * 사용 예:
 *   const briefing = await generateMaterialBriefing(accessToken, 'MAT-LI-CARB')
 */
export async function generateMaterialBriefing(
  accessToken: string,
  erpMaterialId: string,
  useLlm = false,
): Promise<MaterialBriefing> {
  const result = await fetchWithAuth<MaterialBriefing>(
    `/api/v1/material-risk/materials/${encodeURIComponent(erpMaterialId)}/briefing?useLlm=${useLlm}`,
    accessToken,
    { method: 'POST' },
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}
