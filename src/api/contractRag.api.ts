import { fetchWithAuth, uploadWithAuth } from './http'
import type {
  ContractBriefing,
  ContractClauseSearchResult,
  ContractDetail,
  ContractEvidenceRef,
  ContractReprocessResult,
  ContractSummary,
  ContractUploadResult,
} from './types'

/**
 * 1계층 구매팀 "계약 · RAG 검색" 화면 API 클라이언트.
 *
 * `riskMonitoring.api.ts`와 같은 방침으로 **mock 폴백이 없다.** 이 화면이 보여주는 것은
 * ChromaDB에 실제로 적재된 계약 조항과 그 유사도라서, 지어낸 조항을 띄우면 "계약서가
 * 적재돼 있다"는 잘못된 인상을 준다 — 백엔드가 없으면 빈 목록과 안내 문구가 정확하다.
 *
 * 모든 호출이 인증을 요구하므로 `accessToken`을 인자로 받는다(`useAuthState()`에 있다).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/** `VITE_API_BASE_URL`이 없으면 실 API를 부를 수 없다 — 화면이 안내 문구를 띄우도록 알린다. */
export function isContractRagApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

function unwrap<T>(result: T | { error: string; message: string }): T {
  if (result && typeof result === 'object' && 'error' in result) {
    throw new Error((result as { message: string }).message)
  }
  return result as T
}

/**
 * 계약 목록. 기본은 ChromaDB에 적재된 계약만 온다 — 적재 안 된 계약을 골라도 검색이
 * 항상 비어 화면이 고장 난 것처럼 보이기 때문이다.
 *
 * 사용 예:
 *   const contracts = await fetchContracts(accessToken)
 */
export async function fetchContracts(
  accessToken: string,
  includeUnindexed = false,
): Promise<ContractSummary[]> {
  return unwrap(await fetchWithAuth<ContractSummary[]>(
    `/api/v1/contract-rag/contracts?include_unindexed=${includeUnindexed}`,
    accessToken,
  ))
}

/**
 * 조항 검색. `contractId`를 비우면 **전체 계약**을 훑고, 주면 그 계약으로 좁힌다.
 * 응답의 `scope`로 어느 쪽이 실행됐는지 알 수 있다.
 *
 * 사용 예:
 *   const result = await searchClauses(accessToken, '납기 지연과 공급 중단 시 적용되는 계약 조항')
 */
export async function searchClauses(
  accessToken: string,
  query: string,
  options: { contractId?: number | null; topK?: number } = {},
): Promise<ContractClauseSearchResult> {
  return unwrap(await fetchWithAuth<ContractClauseSearchResult>(
    '/api/v1/contract-rag/search',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        query,
        contract_id: options.contractId ?? null,
        top_k: options.topK ?? 5,
      }),
    },
  ))
}

/**
 * 계약 문서 상세(우측 패널). 계약 메타 + 적재된 원본 문서와 임베딩 상태가 함께 온다.
 *
 * 사용 예:
 *   const detail = await fetchContractDetail(accessToken, 11)
 */
export async function fetchContractDetail(
  accessToken: string,
  contractId: number,
): Promise<ContractDetail> {
  return unwrap(await fetchWithAuth<ContractDetail>(
    `/api/v1/contract-rag/contracts/${contractId}`,
    accessToken,
  ))
}

/**
 * 계약서 추가 업로드. 화면은 파일만 보내고 공급사·자재 ID는 백엔드가 계약에서 채운다.
 * 업로드가 끝나면 그 자리에서 청킹·임베딩까지 돌아 ChromaDB에 적재된다.
 *
 * 사용 예:
 *   const result = await uploadContractDocument(accessToken, 11, file)
 */
export async function uploadContractDocument(
  accessToken: string,
  contractId: number,
  file: File,
): Promise<ContractUploadResult> {
  const form = new FormData()
  form.append('file', file)
  return unwrap(await uploadWithAuth<ContractUploadResult>(
    `/api/v1/contract-rag/contracts/${contractId}/documents`,
    accessToken,
    form,
  ))
}

/**
 * "문서 재처리". 이 계약에 달린 문서를 전부 다시 임베딩한다. 일부가 실패해도 나머지는
 * 계속 처리되고 문서별 성공/실패가 함께 온다.
 *
 * 사용 예:
 *   const result = await reprocessContractDocuments(accessToken, 11)
 */
export async function reprocessContractDocuments(
  accessToken: string,
  contractId: number,
): Promise<ContractReprocessResult> {
  return unwrap(await fetchWithAuth<ContractReprocessResult>(
    `/api/v1/contract-rag/contracts/${contractId}/reprocess`,
    accessToken,
    { method: 'POST' },
  ))
}

/**
 * "이 근거로 AI 브리핑 생성". 이 계약의 자재와 관련된, DB에 이미 저장된 가장 최신 뉴스
 * 분석을 찾아 멀티에이전트를 돌린다. 뉴스를 새로 수집하지 않는다.
 *
 * 관련 뉴스가 없으면 422와 사유가 오는데, 계약 상세의 `briefing_available`로 미리 알 수 있어
 * 화면은 버튼을 먼저 비활성화한다.
 *
 * LLM 브리핑 문구 생성은 기본 off다(`useLlm`) — 등급 산출에 필요 없고 버튼 한 번이 곧 비용이다.
 *
 * 사용 예:
 *   const briefing = await generateContractBriefing(accessToken, 11, evidence)
 */
export async function generateContractBriefing(
  accessToken: string,
  contractId: number,
  evidence: ContractEvidenceRef[] = [],
  useLlm = false,
): Promise<ContractBriefing> {
  return unwrap(await fetchWithAuth<ContractBriefing>(
    '/api/v1/contract-rag/briefings',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ contract_id: contractId, evidence, use_llm: useLlm }),
    },
  ))
}
