import { fetchGlobalRiskBoard, fetchRiskEvents } from './purchasing.api'
import { fetchJson } from './http'
import { parseRiskEventDate } from '../lib/riskEventId'
import type { AiRecommendation, GlobalRiskBoardItem, NewsFeedItem, RiskGrade } from './types'

/**
 * fetchMaterialPriceTrends/fetchMaterialPriceSummaries는 원래 이 파일에 있었으나, 구매팀
 * 대시보드(Phase 9.4)도 같은 데이터를 쓰게 되면서 원천 데이터 허브인 purchasing.api.ts로
 * 옮기고 여기서는 재수출만 한다 — 로직 변경 없음, 이 파일을 통해 import하던 기존 코드는
 * 수정 없이 그대로 동작한다. fetchGlobalRiskBoard(mock)는 재수출뿐 아니라 아래
 * fetchPublicRiskBoard의 ①단계 폴백으로도 직접 쓰인다.
 */
export { fetchMaterialPriceTrends, fetchMaterialPriceSummaries } from './purchasing.api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/**
 * 비로그인 공개 대시보드(Seq 23) 글로벌 리스크 관제 지도 조회. `VITE_API_BASE_URL`이
 * 설정돼 있으면 실제 백엔드(`GET /api/v1/public/risk-board`)를 호출하고, 없으면(①단계)
 * `fetchGlobalRiskBoard()`(mock)를 그대로 반환한다 — `auth.api.ts`의 `login`/`signup`과
 * 동일한 mode 분기 컨벤션.
 *
 * 구매팀 대시보드가 쓰는 `fetchGlobalRiskBoard()`(purchasing.api.ts)와는 별도 함수다 —
 * 이 함수는 실 API 연동 대상이고 그쪽은 그대로 mock을 유지해, 이 변경이 구매팀 대시보드에
 * 영향을 주지 않는다(설계 의도).
 *
 * 백엔드 `RiskBoardItem`은 `erp_view`/`quality_check`/`rag_view`를 의도적으로 제외한 공개
 * 안전 subset이며 `GlobalRiskBoardItem`과 필드가 1:1로 맞는다(`docs/mock-schemas.md` 참고) —
 * 별도 변환 없이 그대로 쓸 수 있다.
 *
 * 사용 예:
 *   const items = await fetchPublicRiskBoard()
 */
export async function fetchPublicRiskBoard(): Promise<GlobalRiskBoardItem[]> {
  if (!API_BASE_URL) {
    return fetchGlobalRiskBoard()
  }
  const result = await fetchJson<GlobalRiskBoardItem[]>('/api/v1/public/risk-board')
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

const RECOMMENDATION_BY_GRADE: Record<RiskGrade, string> = {
  심각: '즉시 대체 조달처 검토 필요',
  주의: '대체 조달처 사전 확보 권고',
  정상: '정기 모니터링 유지',
}

/**
 * AI 기반 권고 조치 리스트 mock 함수. 공개 화면이므로 ERP 내부 상세(재고 소진 일수,
 * 대체 공급사명)는 노출하지 않고 등급 기반 일반 권고 문구만 제공한다.
 *
 * 사용 예:
 *   const recommendations = fetchAiRecommendations()
 */
export function fetchAiRecommendations(): AiRecommendation[] {
  return fetchRiskEvents().map((event) => ({
    risk_event_id: event.risk_event_id,
    material: event.market_context.material,
    grade: event.grade,
    confidence_label: event.confidence_label,
    recommendation: RECOMMENDATION_BY_GRADE[event.grade],
  }))
}

/**
 * 실시간 뉴스 속보 mock 함수. risk_event_id에 담긴 날짜 기준 최신순으로 정렬한다.
 *
 * 사용 예:
 *   const feed = fetchNewsFeed()
 */
export function fetchNewsFeed(): NewsFeedItem[] {
  return fetchRiskEvents()
    .map((event) => ({
      risk_event_id: event.risk_event_id,
      date: parseRiskEventDate(event.risk_event_id),
      material: event.market_context.material,
      source: event.market_context.source,
      headline: event.market_context.event_summary,
      confidence_label: event.confidence_label,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
