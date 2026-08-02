import { fetchWithAuth, uploadWithAuth } from './http'
import type {
  ContractClauseSearchResult,
  ContractDetail,
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
 * **브리핑 실행 함수는 여기 없다.** 화면의 "AI 브리핑 생성"은 실행이 아니라
 * `/purchasing/ai-briefing?source=CONTRACT`로의 이동이고, 실제 호출은 `aiBriefing.api.ts`가 맡는다.
 * 2026-08-02에 `generateContractBriefing`(`POST /contract-rag/briefings`)을 걷어냈다 —
 * 같은 멀티에이전트를 두 경로가 각자 부르면 이쪽 결과만 브리핑 이력에 안 남는다.
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
 * 계약 목록. `includeUnindexed=true`면 문서가 한 건도 없는 계약까지 온다.
 *
 * 화면은 **true로 부른다** — 신규 계약은 검색 결과에 나올 수가 없어서, 목록에서까지 빠지면
 * 첫 문서를 올릴 진입로가 사라지기 때문이다. 대신 `document_count`가 0이면 화면이 "미적재"를
 * 붙여 검색이 빌 것임을 미리 알린다.
 *
 * 사용 예:
 *   const contracts = await fetchContracts(accessToken, true)
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
