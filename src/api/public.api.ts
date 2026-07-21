import { fetchRiskEvents } from './purchasing.api'
import { parseRiskEventDate } from '../lib/riskEventId'
import type {
  AiRecommendation,
  GlobalRiskBoardItem,
  MaterialPriceSeries,
  NewsFeedItem,
  RiskGrade,
} from './types'

const RECOMMENDATION_BY_GRADE: Record<RiskGrade, string> = {
  심각: '즉시 대체 조달처 검토 필요',
  주의: '대체 조달처 사전 확보 권고',
  정상: '정기 모니터링 유지',
}

/**
 * 원자재 가격 추이 데모 데이터. risk_event 스키마에는 가격 필드가 없어 대상 자재만
 * market_context.material에서 가져오고, 지수 값은 데모용으로 합성했다(기준일=100).
 */
const MOCK_PRICE_SERIES: Record<string, MaterialPriceSeries> = {
  니켈: {
    material: '니켈',
    unit: '지수(기준일=100)',
    points: [
      { date: '2026-07-15', price_index: 100 },
      { date: '2026-07-16', price_index: 101 },
      { date: '2026-07-17', price_index: 103 },
      { date: '2026-07-18', price_index: 106 },
      { date: '2026-07-19', price_index: 112 },
      { date: '2026-07-20', price_index: 116 },
      { date: '2026-07-21', price_index: 118 },
    ],
  },
  리튬: {
    material: '리튬',
    unit: '지수(기준일=100)',
    points: [
      { date: '2026-07-15', price_index: 100 },
      { date: '2026-07-16', price_index: 99 },
      { date: '2026-07-17', price_index: 98 },
      { date: '2026-07-18', price_index: 100 },
      { date: '2026-07-19', price_index: 103 },
      { date: '2026-07-20', price_index: 104 },
      { date: '2026-07-21', price_index: 105 },
    ],
  },
  코발트: {
    material: '코발트',
    unit: '지수(기준일=100)',
    points: [
      { date: '2026-07-15', price_index: 100 },
      { date: '2026-07-16', price_index: 100 },
      { date: '2026-07-17', price_index: 102 },
      { date: '2026-07-18', price_index: 101 },
      { date: '2026-07-19', price_index: 104 },
      { date: '2026-07-20', price_index: 108 },
      { date: '2026-07-21', price_index: 109 },
    ],
  },
}

/**
 * 글로벌 리스크 관제 맵 mock 함수. purchasing.api.ts의 risk_event mock 배열을 그대로
 * 재사용해 같은 근원 데이터에서 파생한다(중복 데이터 생성 금지 원칙).
 *
 * 사용 예:
 *   const items = fetchGlobalRiskBoard()
 */
export function fetchGlobalRiskBoard(): GlobalRiskBoardItem[] {
  return fetchRiskEvents().map((event) => ({
    risk_event_id: event.risk_event_id,
    material: event.market_context.material,
    grade: event.grade,
    confidence_label: event.confidence_label,
    event_summary: event.market_context.event_summary,
  }))
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
 * 원자재 가격 추이 mock 함수. 현재 risk_event mock에 등장하는 자재(니켈/리튬/코발트)만 반환한다.
 *
 * 사용 예:
 *   const series = fetchMaterialPriceTrends()
 */
export function fetchMaterialPriceTrends(): MaterialPriceSeries[] {
  const materials = new Set(fetchRiskEvents().map((event) => event.market_context.material))
  return Array.from(materials)
    .map((material) => MOCK_PRICE_SERIES[material])
    .filter((series): series is MaterialPriceSeries => Boolean(series))
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
