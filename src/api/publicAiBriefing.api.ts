import { downloadGetWithAuth, fetchWithAuth } from './http'
import type { DownloadedFile, FetchJsonError } from './http'
import type {
  AiBriefingContext,
  AiBriefingDetail,
  AiBriefingListItem,
  AiBriefingListQuery,
  AiBriefingSource,
  ApiPage,
} from './types'

/**
 * 비로그인 `/public/ai-briefing` 화면 API 클라이언트. 구매팀 1계층 `aiBriefing.api.ts`
 * (minji 브랜치, `accessToken` 필수·mock 폴백 없음)를 이식하되, "완전 공개 + mock 폴백
 * 신규 작성"(사용자 결정, 2026-08-03) 원칙에 따라 방향을 바꿨다 — 상세는
 * `publicRiskMonitoring.api.ts` 최상단 주석 참고(동일한 3단계 분기).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export const LOGIN_REQUIRED_MESSAGE = '로그인 후 이용 가능합니다.'
const DOWNLOAD_NOT_READY_MESSAGE = 'mock 모드에서는 PDF 다운로드를 제공하지 않습니다.'

function unwrap<T>(result: T | { error: string; message: string }): T {
  if (result && typeof result === 'object' && 'error' in result) {
    throw new Error((result as { message: string }).message)
  }
  return result as T
}

/** Figma "07 구매팀 · AI 브리핑"(2026-08-02) 상세 값을 그대로 옮긴 mock. */
const MOCK_DETAIL_BASE: Omit<AiBriefingDetail, 'source_type' | 'source_ref'> = {
  briefing_id: 'BRIEF-0001',
  assessment_id: 'ASSESS-0001',
  subject_title: '코발트 공급사의 납기 지연',
  news_id: 'news-integration-001',
  analysis_id: 'ANALYSIS-0001',
  source_headline: '코발트 공급사의 납기 지연',
  erp_material_id: 'MAT-CO-SULF',
  erp_supplier_id: 'SUP-COD-01',
  erp_contract_id: 'CTR-010',
  contract_id: 11,
  material_name: 'Cobalt Sulfate',
  material_category: 'COBALT',
  impact_domain: 'Logistics',
  composite: true,
  procurement_risk_level: 'CRITICAL',
  procurement_risk_score: 70,
  briefing:
    '코발트 공급사의 납기 지연으로 공급 일정에 차질이 예상됩니다.\n' +
    '현재 재고는 예상 입고일 전에 소진될 가능성이 있으며,\n' +
    '최종 구매 위험 단계는 critical, 위험 점수는 70점입니다.',
  risk_reasons: [
    'ERP 노출도 75 · 현재 재고 6.5일 · 안전재고 18일',
    '예상 입고 9일 후 · 공급 공백 2.5일 · 공급사 의존도 84%',
  ],
  recommended_actions: [
    '기존 발주의 납기와 수량을 우선 확인합니다.',
    '계약상 지연 통지와 위약금 조항을 검토합니다.',
    '등록된 대체 공급사 조건을 추가 확인합니다.',
  ],
  erp_evidence: {
    exposure_score: 75,
    exposure_level: 'CRITICAL',
    inventory_days: 6.5,
    safety_stock_days: 18,
    next_inbound_eta_days: 9,
    expected_supply_gap_days: 2.5,
    supplier_dependency_ratio: 0.84,
    stockout_before_eta: true,
  },
  contract_findings: [
    { clause: '계약 ID 11, 페이지 1', text: '납기 지연 발생 시 공급사의 서면 통지 의무와 위약금 조항 확인' },
  ],
  evidence_chain: {
    external_signal: { label: '외부 이벤트', level: 'WARNING', score: 60, note: null },
    erp_exposure: { label: 'ERP 노출', level: 'CRITICAL', score: 75, note: null },
    contract_rag: { label: '계약 RAG', level: null, score: null, note: '3개 조항' },
    final_risk: { label: '최종 위험', level: 'CRITICAL', score: 70, note: null },
  },
  verification: {
    review_passed: true,
    llm_used: true,
    llm_error: null,
    warning_count: 0,
    warnings: [],
    contract_id: 11,
    contract_page: 1,
    weight_version: 'v1',
    mock: true,
  },
  created_at: '2026-07-31T14:20:00Z',
}

const MOCK_LIST_ITEM: AiBriefingListItem = {
  briefing_id: MOCK_DETAIL_BASE.briefing_id,
  source_type: 'NEWS',
  source_ref: MOCK_DETAIL_BASE.news_id,
  subject_title: MOCK_DETAIL_BASE.subject_title,
  news_id: MOCK_DETAIL_BASE.news_id,
  procurement_risk_level: MOCK_DETAIL_BASE.procurement_risk_level,
  procurement_risk_score: MOCK_DETAIL_BASE.procurement_risk_score,
  composite: MOCK_DETAIL_BASE.composite,
  review_passed: true,
  created_at: MOCK_DETAIL_BASE.created_at,
}

/**
 * 화면 상단 "분석 대상 · ERP 연결" 프리필.
 *
 * 사용 예:
 *   const context = await fetchAiBriefingContext(accessToken, 'NEWS', '1')
 */
export async function fetchAiBriefingContext(
  accessToken: string | null,
  source: AiBriefingSource,
  ref: string,
): Promise<AiBriefingContext> {
  if (!API_BASE_URL) {
    return {
      source_type: source,
      source_ref: ref,
      subject_title: MOCK_DETAIL_BASE.subject_title,
      news_id: MOCK_DETAIL_BASE.news_id,
      analysis_id: MOCK_DETAIL_BASE.analysis_id,
      source_headline: MOCK_DETAIL_BASE.source_headline,
      erp_material_id: MOCK_DETAIL_BASE.erp_material_id,
      erp_supplier_id: MOCK_DETAIL_BASE.erp_supplier_id,
      erp_contract_id: MOCK_DETAIL_BASE.erp_contract_id,
      contract_id: MOCK_DETAIL_BASE.contract_id,
      material_name: MOCK_DETAIL_BASE.material_name,
      material_category: MOCK_DETAIL_BASE.material_category,
      country_code: 'CD',
      impact_domain: MOCK_DETAIL_BASE.impact_domain,
      external_signal_level: 'WARNING',
      external_signal_score: 60,
      generate_available: true,
      generate_blocked_reason: null,
      latest_briefing_id: MOCK_DETAIL_BASE.briefing_id,
    }
  }
  // 조회 전용 API — 백엔드가 permitAll로 열어뒀으므로 비로그인 방문자도 그대로 부른다.
  return unwrap(
    await fetchWithAuth<AiBriefingContext>(
      `/api/v1/ai-briefing/context?source=${source}&ref=${encodeURIComponent(ref)}`,
      accessToken ?? '',
    ),
  )
}

/**
 * "LLM 브리핑 생성". `analysisId`를 함께 보내면 프리필이 보여준 그 분석으로 고정한다 —
 * 안 보내면 서버가 다시 고르고, 그 사이 수집 스케줄러가 새 분석을 넣으면 상단 외부신호와
 * 결과가 어긋난다.
 *
 * 사용 예:
 *   const briefing = await generateAiBriefing(accessToken, 'MATERIAL', 'MAT-CO-SULF')
 *   const pinned = await generateAiBriefing(accessToken, 'NEWS', '252', true, context.analysis_id)
 */
export async function generateAiBriefing(
  accessToken: string | null,
  source: AiBriefingSource,
  ref: string,
  useLlm = true,
  analysisId: string | null = null,
): Promise<AiBriefingDetail> {
  if (!API_BASE_URL) {
    return { ...MOCK_DETAIL_BASE, source_type: source, source_ref: ref }
  }
  if (!accessToken) {
    throw new Error(LOGIN_REQUIRED_MESSAGE)
  }
  return unwrap(
    await fetchWithAuth<AiBriefingDetail>('/api/v1/ai-briefing/briefings', accessToken, {
      method: 'POST',
      body: JSON.stringify({ source, ref, use_llm: useLlm, analysis_id: analysisId }),
    }),
  )
}

/**
 * 우측 하단 "최근 브리핑" 한 페이지.
 *
 * **필터와 페이징을 함께 서버로 보낸다.** 받아온 배열을 화면에서 거르면 서버가 이미 자른 한
 * 페이지 안에서만 걸러져, 조건에 맞는데 뒷 페이지에 있는 브리핑이 통째로 사라진다.
 *
 * mock(①단계)은 데이터가 1건뿐이라 필터 축을 실제로 계산하지 않는다 — `source`가 걸리면
 * 빈 페이지, 아니면 그 1건짜리 페이지를 돌려주는 것으로 충분하다(다른 축은 무시).
 *
 * mock(!API_BASE_URL) 분기의 반환 로직은 origin/main에 대응 코드가 없어 이 세션이
 * 직접 설계한 것 — 실 백엔드 계약 확인 전까지는 추정치. (fetchWithAuth 분기 자체는
 * origin/main d0fc23a를 그대로 포트한 것으로 추정 아님)
 *
 * 사용 예:
 *   const page = await fetchRecentAiBriefings(accessToken, { source: 'NEWS', days: 7, page: 0 })
 */
export async function fetchRecentAiBriefings(
  accessToken: string | null,
  query: AiBriefingListQuery = {},
): Promise<ApiPage<AiBriefingListItem>> {
  if (!API_BASE_URL) {
    const content = query.source ? [] : [MOCK_LIST_ITEM]
    return { content, page: 0, size: query.size ?? content.length, total_elements: content.length, total_pages: 1 }
  }
  const params = new URLSearchParams()
  if (query.source) params.set('source', query.source)
  if (query.level) params.set('level', query.level)
  if (query.reviewStatus) params.set('reviewStatus', query.reviewStatus)
  if (query.days != null) params.set('days', String(query.days))
  params.set('page', String(query.page ?? 0))
  params.set('size', String(query.size ?? 5))
  return unwrap(
    await fetchWithAuth<ApiPage<AiBriefingListItem>>(
      `/api/v1/ai-briefing/briefings?${params.toString()}`,
      accessToken ?? '',
    ),
  )
}

/**
 * "브리핑 상세 보기".
 *
 * 사용 예:
 *   const briefing = await fetchAiBriefing(accessToken, briefingId)
 */
export async function fetchAiBriefing(
  accessToken: string | null,
  briefingId: string,
): Promise<AiBriefingDetail> {
  if (!API_BASE_URL) {
    if (briefingId !== MOCK_DETAIL_BASE.briefing_id) {
      throw new Error('해당 브리핑을 찾을 수 없습니다.')
    }
    return { ...MOCK_DETAIL_BASE, source_type: 'NEWS', source_ref: MOCK_DETAIL_BASE.news_id }
  }
  return unwrap(
    await fetchWithAuth<AiBriefingDetail>(
      `/api/v1/ai-briefing/briefings/${encodeURIComponent(briefingId)}`,
      accessToken ?? '',
    ),
  )
}

/**
 * "PDF 다운로드" — 저장된 브리핑을 PDF로 받는다.
 *
 * 백엔드 `SecurityConfig`는 `GET .../briefings/*`(단일 세그먼트)만 permitAll로 열어뒀고
 * `.../briefings/{id}/report.pdf`(하위 세그먼트)는 매치되지 않아 인증이 필요하다 — 로그인
 * 없이는 호출하지 않고 안내만 돌려준다.
 *
 * 사용 예:
 *   const file = await downloadAiBriefingReport(accessToken, briefingId)
 *   if ('error' in file) setError(file.message)
 *   else saveBlob(file.blob, file.fileName)
 */
export async function downloadAiBriefingReport(
  accessToken: string | null,
  briefingId: string,
): Promise<DownloadedFile | FetchJsonError> {
  if (!API_BASE_URL) {
    return { error: 'NOT_AVAILABLE', message: DOWNLOAD_NOT_READY_MESSAGE }
  }
  if (!accessToken) {
    return { error: 'LOGIN_REQUIRED', message: LOGIN_REQUIRED_MESSAGE }
  }
  return downloadGetWithAuth(
    `/api/v1/ai-briefing/briefings/${encodeURIComponent(briefingId)}/report.pdf`,
    accessToken,
    'ai-briefing.pdf',
  )
}
