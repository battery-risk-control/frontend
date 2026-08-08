import { fetchWithAuth, uploadWithAuth } from './http'
import type {
  ContractClauseHit,
  ContractClauseSearchResult,
  ContractDetail,
  ContractReprocessResult,
  ContractSummary,
  ContractUploadResult,
} from './types'

/**
 * 비로그인 `/public/contract-rag` 화면 API 클라이언트. 구매팀 1계층 `contractRag.api.ts`
 * (minji 브랜치, `accessToken` 필수·mock 폴백 없음)를 이식하되, "완전 공개 + mock 폴백
 * 신규 작성"(사용자 결정, 2026-08-03) 원칙에 따라 방향을 바꿨다 — 상세는
 * `publicRiskMonitoring.api.ts` 최상단 주석 참고(동일한 3단계 분기).
 *
 * 업로드·재처리는 mock 모드에서 실제 파일 처리를 하지 않는다(CLAUDE.md placeholder 원칙) —
 * 호출하면 "준비 중" 메시지를 던진다. Seq 31 정식 업로드 UI와는 별개 범위다.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.'
const UPLOAD_NOT_READY_MESSAGE = '계약서 업로드는 준비 중입니다.'

function unwrap<T>(result: T | { error: string; message: string }): T {
  if (result && typeof result === 'object' && 'error' in result) {
    throw new Error((result as { message: string }).message)
  }
  return result as T
}

/** mock 계약 1건 — Figma "06 구매팀 · 계약 RAG"(2026-08-02) 우측 패널을 그대로 옮겼다. */
const MOCK_CONTRACT: ContractSummary = {
  contract_id: 11,
  erp_contract_id: 'CTR-010',
  contract_name: 'Cobalt Sulfate Supply Agreement',
  status: 'ACTIVE',
  start_date: '2025-07-07',
  end_date: '2027-07-02',
  currency_code: 'USD',
  supplier_id: null,
  erp_supplier_id: 'SUP-COD-01',
  supplier_name: '공급사A',
  country_code: 'CD',
  material_id: null,
  erp_material_id: 'MAT-CO-SULF',
  material_name: 'Cobalt Sulfate',
  material_category: 'COBALT',
  document_count: 1,
  indexed_chunk_count: 7,
  kind: 'INBOUND',
  product_id: null,
  erp_product_id: null,
  product_name: null,
  customer_id: null,
  erp_customer_id: null,
  customer_name: null,
}

const MOCK_CONTRACT_DETAIL: ContractDetail = {
  contract: MOCK_CONTRACT,
  documents: [
    {
      document_id: 'DOC-CTR010-01',
      original_file_name: 'CTR-010_Cobalt_Sulfate_Supply_Agreement.pdf',
      document_type: 'CONTRACT',
      mime_type: 'application/pdf',
      file_size_bytes: 482_000,
      processing_status: 'COMPLETED',
      chunk_count: 7,
      embedding_type: 'OPENAI_API',
      embedding_version: 'text-embedding-3-large',
      error_code: null,
      error_message: null,
      created_at: '2026-07-10T09:00:00Z',
      processed_at: '2026-07-10T09:01:00Z',
    },
  ],
  embedding_type: 'OPENAI_API',
  embedding_version: 'text-embedding-3-large',
  mock_embedding: true,
  briefing_available: true,
  briefing_blocked_reason: null,
}

/** Figma "06" 검색 결과 카드 3장 — `publicMaterialRisk.api.ts`의 계약 근거 mock과 같은 원천. */
const MOCK_CLAUSE_HITS: ContractClauseHit[] = [
  {
    document_id: 'DOC-CTR010-01',
    chunk_index: 6,
    page_number: 1,
    clause_title: '제7조 · 납기 지연 위약금',
    clause_no: '제7조',
    clause_heading: 'DELIVERY DELAY PENALTY',
    similarity_score: 0.61,
    content: '지연 물량 금액의 0.1%를 1일당 위약금으로 부과하며 누계는 발주 금액의 10%를 상한으로 합니다.',
    content_hash: 'hash-ctr010-07',
    source: 'chroma',
    contract: MOCK_CONTRACT,
  },
  {
    document_id: 'DOC-CTR010-01',
    chunk_index: 3,
    page_number: 1,
    clause_title: '제4조 · 납기 지연 통지',
    clause_no: '제4조',
    clause_heading: 'DELIVERY DELAY NOTICE',
    similarity_score: 0.6,
    content: '공급자는 지연 사유, 예상 지연 일수 및 복구 계획을 구매자에게 서면 통지해야 합니다.',
    content_hash: 'hash-ctr010-04',
    source: 'chroma',
    contract: MOCK_CONTRACT,
  },
  {
    document_id: 'DOC-CTR010-01',
    chunk_index: 4,
    page_number: 1,
    clause_title: '제5조 · 불가항력',
    clause_no: '제5조',
    clause_heading: 'FORCE MAJEURE',
    similarity_score: 0.43,
    content: '공급 차질을 유발한 불가항력 사유와 완화 의무, 계약 종료 조건을 확인합니다.',
    content_hash: 'hash-ctr010-05',
    source: 'chroma',
    contract: MOCK_CONTRACT,
  },
]

/**
 * 계약 목록.
 *
 * 사용 예:
 *   const contracts = await fetchContracts(accessToken)
 */
export async function fetchContracts(
  accessToken: string | null,
  includeUnindexed = false,
): Promise<ContractSummary[]> {
  if (!API_BASE_URL) {
    return [MOCK_CONTRACT]
  }
  // 조회 전용 API — 백엔드가 permitAll로 열어뒀으므로 비로그인 방문자도 그대로 부른다.
  return unwrap(
    await fetchWithAuth<ContractSummary[]>(
      `/api/v1/contract-rag/contracts?include_unindexed=${includeUnindexed}`,
      accessToken ?? '',
    ),
  )
}

/** 검색 범위. ALL=매입·납품 전체, INBOUND=원자재 매입만, OUTBOUND=제품 납품만. */
export type ContractSearchKind = 'ALL' | 'INBOUND' | 'OUTBOUND'

/**
 * 조항 검색. 필터를 안 주면 전체 계약(매입·납품)을 훑는다.
 * - `kind`로 매입/납품만으로 좁히고,
 * - 특정 매입계약은 `contractId`, 특정 납품계약은 `productId`+`customerId`로 콕 집는다.
 *
 * 사용 예:
 *   const result = await searchClauses(accessToken, '납기 지연 배상', { kind: 'OUTBOUND' })
 */
export async function searchClauses(
  accessToken: string | null,
  query: string,
  options: {
    kind?: ContractSearchKind
    contractId?: number | null
    productId?: number | null
    customerId?: number | null
    topK?: number
  } = {},
): Promise<ContractClauseSearchResult> {
  if (!API_BASE_URL) {
    // mock 원천은 매입계약(CTR-010) 하나뿐이라, 납품(OUTBOUND)만 고르면 빈 결과가 정확하다.
    const results = options.kind === 'OUTBOUND'
      ? []
      : options.contractId
        ? MOCK_CLAUSE_HITS.filter((hit) => hit.contract?.contract_id === options.contractId)
        : MOCK_CLAUSE_HITS
    return {
      query,
      scope: options.contractId || (options.kind && options.kind !== 'ALL') ? 'filtered' : 'all',
      contract_id: options.contractId ?? null,
      result_count: results.length,
      mock: true,
      embedding_type: 'OPENAI_API',
      embedding_version: 'text-embedding-3-large',
      results,
    }
  }
  return unwrap(
    await fetchWithAuth<ContractClauseSearchResult>('/api/v1/contract-rag/search', accessToken ?? '', {
      method: 'POST',
      body: JSON.stringify({
        query,
        kind: options.kind ?? 'ALL',
        contract_id: options.contractId ?? null,
        product_id: options.productId ?? null,
        customer_id: options.customerId ?? null,
        top_k: options.topK ?? 5,
      }),
    }),
  )
}

/**
 * 계약 문서 상세(우측 패널).
 *
 * 사용 예:
 *   const detail = await fetchContractDetail(accessToken, 11)
 */
export async function fetchContractDetail(
  accessToken: string | null,
  contractId: number,
): Promise<ContractDetail> {
  if (!API_BASE_URL) {
    if (contractId !== MOCK_CONTRACT.contract_id) {
      throw new Error('해당 계약을 찾을 수 없습니다.')
    }
    return MOCK_CONTRACT_DETAIL
  }
  return unwrap(
    await fetchWithAuth<ContractDetail>(`/api/v1/contract-rag/contracts/${contractId}`, accessToken ?? ''),
  )
}

/**
 * 아웃바운드(제품 납품) 계약 문서 상세. 인바운드와 계약 PK가 겹쳐 경로를 분리한다.
 * mock 모드에는 납품계약 원천이 없어 지원하지 않는다(목록에도 안 나오므로 실제로 불릴 일 없다).
 */
export async function fetchOutboundContractDetail(
  accessToken: string | null,
  outboundContractId: number,
): Promise<ContractDetail> {
  if (!API_BASE_URL) {
    throw new Error('납품계약 상세는 준비 중입니다.')
  }
  return unwrap(
    await fetchWithAuth<ContractDetail>(
      `/api/v1/contract-rag/outbound-contracts/${outboundContractId}`,
      accessToken ?? '',
    ),
  )
}

/**
 * 계약서 추가 업로드. mock 모드에서는 실제 파일 처리를 하지 않는다.
 *
 * 사용 예:
 *   const result = await uploadContractDocument(accessToken, 11, file)
 */
export async function uploadContractDocument(
  accessToken: string | null,
  contractId: number,
  file: File,
): Promise<ContractUploadResult> {
  if (!API_BASE_URL) {
    throw new Error(UPLOAD_NOT_READY_MESSAGE)
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
  const form = new FormData()
  form.append('file', file)
  return unwrap(
    await uploadWithAuth<ContractUploadResult>(
      `/api/v1/contract-rag/contracts/${contractId}/documents`,
      accessToken,
      form,
    ),
  )
}

/**
 * "문서 재처리". mock 모드에서는 실제 재처리를 하지 않는다.
 *
 * 사용 예:
 *   const result = await reprocessContractDocuments(accessToken, 11)
 */
export async function reprocessContractDocuments(
  accessToken: string | null,
  contractId: number,
): Promise<ContractReprocessResult> {
  if (!API_BASE_URL) {
    throw new Error(UPLOAD_NOT_READY_MESSAGE)
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
  return unwrap(
    await fetchWithAuth<ContractReprocessResult>(
      `/api/v1/contract-rag/contracts/${contractId}/reprocess`,
      accessToken,
      { method: 'POST' },
    ),
  )
}
