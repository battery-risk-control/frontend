import { fetchRiskEvents } from './purchasing.api'
import { parseRiskEventDate } from '../lib/riskEventId'
import type { AiRecommendation, NewsFeedItem, RiskGrade } from './types'

/**
 * fetchGlobalRiskBoard/fetchMaterialPriceTrends/fetchMaterialPriceSummaries는 원래 이 파일에
 * 있었으나, 구매팀 대시보드(Phase 9.4)도 같은 데이터를 쓰게 되면서 원천 데이터 허브인
 * purchasing.api.ts로 옮기고 여기서는 재수출만 한다 — 로직 변경 없음, 이 파일을 통해
 * import하던 기존 코드(PublicDashboardPage.tsx 등)는 수정 없이 그대로 동작한다.
 */
export { fetchGlobalRiskBoard, fetchMaterialPriceTrends, fetchMaterialPriceSummaries } from './purchasing.api'

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
