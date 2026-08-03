import {
  fetchGlobalRiskBoard,
  fetchImportDependency,
  fetchMaterialPriceSummaries,
  fetchMaterialPriceTrends,
  fetchRiskEvents,
} from './purchasing.api'
import { fetchJson } from './http'
import { parseRiskEventDate } from '../lib/riskEventId'
import type {
  AiRecommendation,
  ExchangeRateBoard,
  GlobalRiskBoardItem,
  ImportDependencyData,
  MaterialPriceSeries,
  MaterialPriceSummary,
  NewsFeedItem,
  RiskGrade,
} from './types'

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
 * 비로그인 공개 대시보드 AI 기반 권고 조치 리스트 조회. `fetchPublicRiskBoard`와 동일한 mode
 * 분기 컨벤션 — `VITE_API_BASE_URL`이 있으면 실 API(`GET /api/v1/public/recommendations`),
 * 없으면(①단계) `fetchAiRecommendations()`(mock)를 반환한다.
 *
 * 백엔드는 이 리스트를 risk-board와 **같은 분석 집합에서 파생**하므로 지도와 권고 리스트가 서로
 * 다른 자재를 가리키는 일이 생기지 않는다(지도만 실 API로 바꿨을 때 실제로 어긋났던 부분).
 * 응답 필드는 `AiRecommendation`과 1:1이라 별도 변환이 없다.
 *
 * 사용 예:
 *   const recommendations = await fetchPublicAiRecommendations()
 */
export async function fetchPublicAiRecommendations(): Promise<AiRecommendation[]> {
  if (!API_BASE_URL) {
    return fetchAiRecommendations()
  }
  const result = await fetchJson<AiRecommendation[]>('/api/v1/public/recommendations')
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * AI 기반 권고 조치 리스트 mock 함수. 공개 화면이므로 ERP 내부 상세(재고 소진 일수,
 * 대체 공급사명)는 노출하지 않고 등급 기반 일반 권고 문구만 제공한다.
 * ①단계(mock)와 `fetchPublicAiRecommendations`의 폴백 경로에서 쓰인다.
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
 * 비로그인 공개 대시보드 실시간 뉴스 속보 조회. `fetchPublicRiskBoard`와 동일한 mode 분기 컨벤션 —
 * `VITE_API_BASE_URL`이 있으면 실 API(`GET /api/v1/public/news-feed`), 없으면(①단계) mock.
 *
 * 지도·권고 리스트가 **분석 결과**를 보여주는 것과 달리 이쪽은 **수집 원본**(raw_events)이라
 * F3 분석(LLM)이 돌지 않아도 채워진다. 백엔드는 자재가 특정된 뉴스만 내려보내고, 그런 뉴스가
 * 아직 없으면 placeholder로 폴백한다 — 공급망과 무관한 기사가 속보 패널에 뜨지 않게 하기 위함.
 *
 * `limit`(1~100, 생략 시 백엔드 기본 20)으로 건수만 조절한다. 마퀴는 작게, 목록은 크게 쓰지만
 * **엔드포인트는 하나다** — 마퀴용 API를 따로 두면 상단 자막과 아래 목록이 서로 다른 기사를
 * 가리키게 된다. 한 화면에서 둘 다 쓸 때는 크게 한 번 받아 앞부분을 잘라 쓰면 요청이 1회로 끝난다.
 *
 * `offset`으로 과거 기사까지 페이지를 넘길 수 있다. 자재 필터와 제목 중복 제거를 백엔드가
 * SQL에서 하므로 offset이 실제 노출 순서와 일치한다.
 *
 * 사용 예:
 *   const feed = await fetchPublicNewsFeed()
 *   const top5 = await fetchPublicNewsFeed(5)
 *   const page2 = await fetchPublicNewsFeed(5, 5)
 */
export async function fetchPublicNewsFeed(
  limit?: number,
  offset?: number,
): Promise<NewsFeedItem[]> {
  if (!API_BASE_URL) {
    return fetchNewsFeed()
  }
  const params = new URLSearchParams()
  if (limit !== undefined) params.set('limit', String(limit))
  // offset=0은 백엔드 기본값이라 붙이지 않는다 — 페이지를 넘기지 않는 호출(마퀴 등)의 URL을
  // 그대로 둬야 기존 캐시·로그와 갈리지 않는다.
  if (offset) params.set('offset', String(offset))
  const query = params.toString()
  const result = await fetchJson<NewsFeedItem[]>(
    query ? `/api/v1/public/news-feed?${query}` : '/api/v1/public/news-feed',
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 공급망 뉴스 속보 전체 건수. 목록이 마지막 페이지에서 "다음"을 잠그는 데 쓴다.
 *
 * mock 모드(`VITE_API_BASE_URL` 없음)에서는 넘길 페이지 자체가 없으므로 0을 돌려주고,
 * 화면은 화살표를 숨긴다.
 *
 * 사용 예:
 *   const total = await fetchPublicNewsFeedCount()
 */
export async function fetchPublicNewsFeedCount(): Promise<number> {
  if (!API_BASE_URL) {
    return 0
  }
  const result = await fetchJson<number>('/api/v1/public/news-feed/count')
  if (typeof result !== 'number') {
    throw new Error('뉴스 건수 조회에 실패했습니다.')
  }
  return result
}

/**
 * 비로그인 공개 대시보드 원자재 가격 추이 조회. `fetchPublicRiskBoard`와 동일한 mode 분기 컨벤션 —
 * `VITE_API_BASE_URL`이 있으면 실 API(`GET /api/v1/public/price-trends`), 없으면(①단계) mock.
 *
 * 백엔드는 자재별 대표 종목 주가(yfinance)를 프록시로 삼아 구간 첫 거래일=100 지수를 만든다.
 * mock이 3종(니켈/리튬/코발트)인 것과 달리 실 API는 7종을 내려주며, 화면의 "원자재" 드롭다운은
 * 데이터에서 자동 생성되므로 프론트 수정 없이 항목이 늘어난다.
 *
 * `days`로 조회 구간을 정한다(1~180, 범위를 벗어나면 백엔드가 잘라서 처리). 구간을 바꾸면
 * **기준일(`base_date`)도 함께 옮겨가** 지수가 100에서 다시 시작한다 — 저장값이 자재의 톤당
 * 가격이 아니라 프록시 종목의 주가라, "구간 시작 대비 몇 %"만 뜻이 있기 때문이다.
 * `fetchPublicPriceSummaries`에 **같은 days**를 넘겨야 차트와 요약 카드가 어긋나지 않는다.
 *
 * 사용 예:
 *   const series = await fetchPublicPriceTrends(7)
 */
export async function fetchPublicPriceTrends(days?: number): Promise<MaterialPriceSeries[]> {
  if (!API_BASE_URL) {
    return fetchMaterialPriceTrends()
  }
  const result = await fetchJson<MaterialPriceSeries[]>(
    days === undefined ? '/api/v1/public/price-trends' : `/api/v1/public/price-trends?days=${days}`,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 비로그인 공개 대시보드 원자재 요약 카드 조회. 가격 추이와 **같은 구간·같은 데이터**에서
 * 파생하므로 카드와 차트가 어긋나지 않는다.
 *
 * mock의 risk_score는 시각 구성을 위한 임시값이었으나, 실 API는 연율화 변동성(일간 변동성 × √252)을
 * 백분율로 환산한 값이다 — 임의 수치가 아니라 표준 지표다.
 *
 * `days`는 `fetchPublicPriceTrends`와 **같은 값**을 넘겨야 한다 — 한쪽만 구간을 바꾸면
 * 차트와 요약 카드가 서로 다른 기간을 가리키게 된다.
 *
 * 사용 예:
 *   const summaries = await fetchPublicPriceSummaries(7)
 */
export async function fetchPublicPriceSummaries(days?: number): Promise<MaterialPriceSummary[]> {
  if (!API_BASE_URL) {
    return fetchMaterialPriceSummaries()
  }
  const result = await fetchJson<MaterialPriceSummary[]>(
    days === undefined
      ? '/api/v1/public/price-summaries'
      : `/api/v1/public/price-summaries?days=${days}`,
  )
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 비로그인 공개 대시보드 수입 의존도 조회. `fetchPublicRiskBoard`와 동일한 mode 분기 컨벤션 —
 * `VITE_API_BASE_URL`이 있으면 실 API(`GET /api/v1/public/import-dependency`), 없으면 mock.
 *
 * 백엔드가 ERP 발주 데이터(purchase_orders · purchase_order_items · suppliers)를 공급사 국적별로
 * 묶어 구성비를 만든다. 주문마다 결제통화(USD/EUR/KRW)가 달라 **고시환율로 원화 환산한 뒤**
 * 합산하므로, `base_date`가 환산에 쓴 고시일이다.
 *
 * 조각 색(`color`)은 내려오지 않는다 — 배색은 화면의 몫이라 `ImportDependencyPanel`이 채운다.
 *
 * 사용 예:
 *   const data = await fetchPublicImportDependency()
 */
export async function fetchPublicImportDependency(): Promise<ImportDependencyData> {
  if (!API_BASE_URL) {
    return fetchImportDependency()
  }
  const result = await fetchJson<ImportDependencyData>('/api/v1/public/import-dependency')
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 비로그인 공개 대시보드 환율 밴드 조회. `fetchPublicRiskBoard`와 동일한 mode 분기 컨벤션 —
 * `VITE_API_BASE_URL`이 있으면 실 API(`GET /api/v1/public/exchange-rates`), 없으면 mock.
 *
 * 백엔드는 한국수출입은행 고시환율을 하루 2회 수집해 DB에 쌓아두고, 이 API는 DB의 **가장 최근
 * 고시일**을 읽는다 — 화면이 외부 API 응답 시간이나 일일 호출 한도에 묶이지 않는다. 원천이
 * 영업일 11시 전후 1회 갱신인 일환율이라 `rate_date`는 요청일이 아닌 실제 고시일이고, 주말에는
 * 직전 영업일 날짜가 내려온다.
 *
 * 사용 예:
 *   const board = await fetchPublicExchangeRates()
 */
export async function fetchPublicExchangeRates(): Promise<ExchangeRateBoard> {
  if (!API_BASE_URL) {
    return fetchExchangeRates()
  }
  const result = await fetchJson<ExchangeRateBoard>('/api/v1/public/exchange-rates')
  if ('error' in result) {
    throw new Error(result.message)
  }
  return result
}

/**
 * 환율 밴드 mock 함수. ①단계(mock)와 `fetchPublicExchangeRates`의 폴백 경로에서 쓰인다.
 *
 * 실 API의 응답 모양을 그대로 따른다 — 직접 고시(`KOREAEXIM`)와 재정환율(`CROSS_USD`)을 둘 다
 * 넣고, 재정환율은 등락이 비어 있는 상태(`—`)로 둔다. 무료 소스가 과거 조회를 주지 않아 실제로도
 * 수집 첫날에는 이 모양이라, mock만 보고 만든 화면이 실 데이터에서 깨지지 않게 하려는 것이다.
 */
export function fetchExchangeRates(): ExchangeRateBoard {
  return {
    rate_date: '2026-07-31',
    base_currency: 'KRW',
    rates: [
      { currency_code: 'USD', currency_name: '미국 달러', unit_multiplier: 1, label: 'USD/KRW', rate: 1441.1, change_amount: -9.0, change_rate: -0.62, change_label: '▼ 0.62%', rate_source: 'KOREAEXIM', cross_rate: false },
      { currency_code: 'EUR', currency_name: '유로', unit_multiplier: 1, label: 'EUR/KRW', rate: 1661.16, change_amount: -2.54, change_rate: -0.15, change_label: '▼ 0.15%', rate_source: 'KOREAEXIM', cross_rate: false },
      { currency_code: 'CNH', currency_name: '위안화', unit_multiplier: 1, label: 'CNH/KRW', rate: 213.56, change_amount: -0.85, change_rate: -0.4, change_label: '▼ 0.40%', rate_source: 'KOREAEXIM', cross_rate: false },
      { currency_code: 'CLP', currency_name: '칠레 페소', unit_multiplier: 100, label: 'CLP(100)/KRW', rate: 154.3906, change_amount: null, change_rate: null, change_label: '—', rate_source: 'CROSS_USD', cross_rate: true },
      { currency_code: 'JPY', currency_name: '일본 옌', unit_multiplier: 100, label: 'JPY(100)/KRW', rate: 902.13, change_amount: 14.21, change_rate: 1.6, change_label: '▲ 1.60%', rate_source: 'KOREAEXIM', cross_rate: false },
    ],
  }
}

/**
 * 실시간 뉴스 속보 mock 함수. risk_event_id에 담긴 날짜 기준 최신순으로 정렬한다.
 * ①단계(mock)와 `fetchPublicNewsFeed`의 폴백 경로에서 쓰인다.
 *
 * 사용 예:
 *   const feed = fetchNewsFeed()
 */
export function fetchNewsFeed(): NewsFeedItem[] {
  return fetchRiskEvents()
    .map((event) => ({
      risk_event_id: event.risk_event_id,
      date: parseRiskEventDate(event.risk_event_id),
      // mock에는 실제 수집 시각이 없어 그 날짜의 자정으로 둔다. 상대 시각이 "N일 전"으로 나오지만
      // 없는 정밀도를 지어내는 것보다 낫다.
      collected_at: `${parseRiskEventDate(event.risk_event_id)}T00:00:00Z`,
      material: event.market_context.material,
      // mock은 risk_event(분석 결과)에서 파생하므로 등급이 항상 있다. 실 API에서는 멀티에이전트를
      // 통과하지 않은 뉴스가 있어 생략될 수 있다.
      grade: event.grade,
      source: event.market_context.source,
      headline: event.market_context.event_summary,
      // mock 문구는 처음부터 한국어라 원문·표시용이 같고 번역 대상이 아니다.
      headline_original: event.market_context.event_summary,
      translated: false,
      confidence_label: event.confidence_label,
      country_code: event.market_context.country_code ?? null,
      // mock은 실제 기사가 아니라 원문 링크가 없다. 화면이 헤드라인을 링크 대신 텍스트로 렌더한다.
      url: null,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
