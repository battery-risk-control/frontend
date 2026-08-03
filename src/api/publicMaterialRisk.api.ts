import { fetchWithAuth } from './http'
import type { ContractEvidence, MaterialRiskDetail, MaterialRiskItem, MaterialRiskOverview } from './types'

/**
 * 비로그인 `/public/materials` 화면 API 클라이언트. 구매팀 1계층 `materialRisk.api.ts`
 * (minji 브랜치, `accessToken` 필수·mock 폴백 없음)를 이식하되, "완전 공개 + mock 폴백
 * 신규 작성"(사용자 결정, 2026-08-03) 원칙에 따라 방향을 바꿨다 — 상세는
 * `publicRiskMonitoring.api.ts` 최상단 주석 참고(동일한 3단계 분기).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.'

/**
 * mock 자재 6종 — Figma "05 구매팀 · 원자재 위험"(2026-08-02) 표를 그대로 옮겼다.
 * mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요.
 */
const MOCK_MATERIALS: MaterialRiskItem[] = [
  {
    erp_material_id: 'MAT-CO-SULF',
    material_name: 'Cobalt Sulfate',
    material_category: 'COBALT',
    grade: '심각',
    exposure_level: 'CRITICAL',
    score: 70,
    inventory_days: 6.5,
    safety_stock_days: 18,
    supplier_dependency_ratio: 0.84,
    data_quality_status: 'VALID',
    unavailable_reason: null,
  },
  {
    erp_material_id: 'MAT-NI-SULF',
    material_name: 'Nickel Sulfate',
    material_category: 'NICKEL',
    grade: '주의',
    exposure_level: 'WARNING',
    score: 56,
    inventory_days: 12,
    safety_stock_days: 20,
    supplier_dependency_ratio: 0.61,
    data_quality_status: 'VALID',
    unavailable_reason: null,
  },
  {
    erp_material_id: 'MAT-LI-CARB',
    material_name: 'Lithium Carbonate',
    material_category: 'LITHIUM',
    grade: '주의',
    exposure_level: 'WARNING',
    score: 48,
    inventory_days: 16,
    safety_stock_days: 24,
    supplier_dependency_ratio: 0.53,
    data_quality_status: 'VALID',
    unavailable_reason: null,
  },
  {
    erp_material_id: 'MAT-GRAPHITE',
    material_name: 'Natural Graphite',
    material_category: 'GRAPHITE',
    grade: '정상',
    exposure_level: 'NORMAL',
    score: 26,
    inventory_days: 31,
    safety_stock_days: 21,
    supplier_dependency_ratio: 0.34,
    data_quality_status: 'VALID',
    unavailable_reason: null,
  },
  {
    erp_material_id: 'MAT-MN-SULF',
    material_name: 'Manganese Sulfate',
    material_category: 'MANGANESE',
    grade: '정상',
    exposure_level: 'NORMAL',
    score: 22,
    inventory_days: 28,
    safety_stock_days: 20,
    supplier_dependency_ratio: 0.29,
    data_quality_status: 'VALID',
    unavailable_reason: null,
  },
  {
    erp_material_id: 'MAT-CU-FOIL',
    material_name: 'Copper Foil',
    material_category: 'COPPER',
    grade: '정상',
    exposure_level: 'NORMAL',
    score: 18,
    inventory_days: 35,
    safety_stock_days: 22,
    supplier_dependency_ratio: 0.26,
    data_quality_status: 'VALID',
    unavailable_reason: null,
  },
]

const MOCK_OVERVIEW: MaterialRiskOverview = {
  summary: {
    assessed_material_count: 11,
    critical_count: 3,
    warning_count: 2,
    normal_count: 6,
    unavailable_count: 0,
    average_inventory_days: 15.8,
    data_quality_status: 'VALID',
    as_of: '2026-07-31T14:00:00Z',
  },
  materials: MOCK_MATERIALS,
}

/** Cobalt Sulfate 상세만 Figma "05" 우측 패널 값을 그대로 채우고, 나머지는 자재 행에서 파생한다. */
const MOCK_DETAILS: Record<string, MaterialRiskDetail> = {
  'MAT-CO-SULF': {
    ...MOCK_MATERIALS[0],
    unit: 'kg',
    on_hand_quantity: null,
    available_quantity: null,
    safety_stock_quantity: null,
    average_daily_usage: null,
    next_inbound_date: null,
    next_eta_days: 9,
    expected_supply_gap_days: 2.5,
    inventory_snapshot_at: '2026-07-31T06:00:00Z',
    primary_supplier: {
      erp_supplier_id: 'SUP-COD-01',
      supplier_name: '공급사A',
      supplier_status: 'ACTIVE',
      alternative_supplier_status: 'CONDITIONAL',
      feoc_status: null,
    },
    linked_contract: {
      contract_id: 11,
      erp_contract_id: 'CTR-010',
      contract_number: 'CTR-010',
      contract_name: 'Cobalt Sulfate Supply Agreement',
      status: 'ACTIVE',
      start_date: '2025-07-07',
      end_date: '2027-07-02',
    },
    risk_components: null,
    forced_critical: false,
    contract_review_required: true,
    contract_questions: [
      { question_code: 'DELIVERY_DELAY_NOTICE', question: '납기 지연 발생 시 통지 의무는?' },
      { question_code: 'PENALTY_CLAUSE', question: '납기 지연 위약금 조항이 있는가?' },
    ],
    warnings: [],
    briefing_available: true,
    briefing_blocked_reason: null,
    as_of: '2026-07-31T14:00:00Z',
  },
}

function toMockDetail(item: MaterialRiskItem): MaterialRiskDetail {
  return (
    MOCK_DETAILS[item.erp_material_id] ?? {
      ...item,
      unit: null,
      on_hand_quantity: null,
      available_quantity: null,
      safety_stock_quantity: null,
      average_daily_usage: null,
      next_inbound_date: null,
      next_eta_days: null,
      expected_supply_gap_days: null,
      inventory_snapshot_at: null,
      primary_supplier: null,
      linked_contract: null,
      risk_components: null,
      forced_critical: false,
      contract_review_required: false,
      contract_questions: [],
      warnings: [],
      briefing_available: item.grade !== null,
      briefing_blocked_reason: item.grade === null ? '평가 데이터가 없습니다.' : null,
      as_of: '2026-07-31T14:00:00Z',
    }
  )
}

/** Figma "06 구매팀 · 계약 RAG" 검색 결과 3건을 그대로 옮긴 mock 근거. */
const MOCK_CONTRACT_EVIDENCE: ContractEvidence = {
  erp_material_id: 'MAT-CO-SULF',
  linked_contract: {
    contract_id: 11,
    erp_contract_id: 'CTR-010',
    contract_number: 'CTR-010',
    contract_name: 'Cobalt Sulfate Supply Agreement',
    status: 'ACTIVE',
    start_date: '2025-07-07',
    end_date: '2027-07-02',
  },
  questions: [
    { question_code: 'DELIVERY_DELAY_NOTICE', question: '납기 지연 발생 시 통지 의무는?' },
    { question_code: 'PENALTY_CLAUSE', question: '납기 지연 위약금 조항이 있는가?' },
  ],
  query: '납기 지연과 공급 중단 시 적용되는 계약 조항',
  results: [
    {
      document_id: 'DOC-CTR010-01',
      contract_id: 11,
      supplier_id: null,
      material_id: null,
      document_type: 'CONTRACT',
      chunk_index: 6,
      page_number: 1,
      content: '지연 물량 금액의 0.1%를 1일당 위약금으로 부과하며 누계는 발주 금액의 10%를 상한으로 합니다.',
      similarity_score: 0.61,
      mock_embedding: true,
    },
    {
      document_id: 'DOC-CTR010-01',
      contract_id: 11,
      supplier_id: null,
      material_id: null,
      document_type: 'CONTRACT',
      chunk_index: 3,
      page_number: 1,
      content: '공급자는 지연 사유, 예상 지연 일수 및 복구 계획을 구매자에게 서면 통지해야 합니다.',
      similarity_score: 0.6,
      mock_embedding: true,
    },
    {
      document_id: 'DOC-CTR010-01',
      contract_id: 11,
      supplier_id: null,
      material_id: null,
      document_type: 'CONTRACT',
      chunk_index: 4,
      page_number: 1,
      content: '공급 차질을 유발한 불가항력 사유와 완화 의무, 계약 종료 조건을 확인합니다.',
      similarity_score: 0.43,
      mock_embedding: true,
    },
  ],
  mock: true,
}

/**
 * 상단 KPI + 자재별 위험 목록.
 *
 * `refresh`를 true로 넘기면 백엔드 캐시를 무시하고 다시 계산한다("새로고침" 버튼용).
 *
 * 사용 예:
 *   const overview = await fetchMaterialRiskOverview(accessToken)
 *   const fresh = await fetchMaterialRiskOverview(accessToken, true)
 */
export async function fetchMaterialRiskOverview(
  accessToken: string | null,
  refresh = false,
): Promise<MaterialRiskOverview> {
  if (!API_BASE_URL) {
    return MOCK_OVERVIEW
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
  const result = await fetchWithAuth<MaterialRiskOverview>(
    `/api/v1/material-risk/overview${refresh ? '?refresh=true' : ''}`,
    accessToken,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 자재 상세.
 *
 * 사용 예:
 *   const detail = await fetchMaterialRiskDetail(accessToken, 'MAT-CO-SULF')
 */
export async function fetchMaterialRiskDetail(
  accessToken: string | null,
  erpMaterialId: string,
): Promise<MaterialRiskDetail> {
  if (!API_BASE_URL) {
    const item = MOCK_MATERIALS.find((m) => m.erp_material_id === erpMaterialId)
    if (!item) {
      throw new Error('해당 자재를 찾을 수 없습니다.')
    }
    return toMockDetail(item)
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
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
 * "계약 RAG 근거 보기".
 *
 * 사용 예:
 *   const evidence = await fetchContractEvidence(accessToken, 'MAT-CO-SULF')
 */
export async function fetchContractEvidence(
  accessToken: string | null,
  erpMaterialId: string,
): Promise<ContractEvidence> {
  if (!API_BASE_URL) {
    return { ...MOCK_CONTRACT_EVIDENCE, erp_material_id: erpMaterialId }
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
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
