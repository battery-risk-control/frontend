import type { GlobalRiskBoardItem, NewsFeedItem, SelectedArticle } from '../api/types'

/**
 * 최신 뉴스 목록에서 고른 기사 → 우측 "뉴스 상세" 탭이 쓰는 공통 모양.
 *
 * 사용 예:
 *   setSelected(fromNewsFeedItem(item))
 */
export function fromNewsFeedItem(item: NewsFeedItem): SelectedArticle {
  return {
    id: item.risk_event_id,
    event_id: item.event_id ?? null,
    origin: 'NEWS',
    headline: item.headline,
    material: item.material,
    grade: item.grade,
    confidence_label: item.confidence_label,
    country_code: item.country_code,
    collected_at: item.collected_at,
    headline_original: item.headline_original,
    summary: item.summary_kr ?? null,
    translated: item.translated,
    url: item.url,
  }
}

/**
 * 지도 마커에서 고른 이벤트 → 같은 공통 모양.
 *
 * `event_summary`를 헤드라인 자리에 넣는다 — 공개 지도 응답에서 이 필드가 곧 "마커 클릭 시
 * 보여줄 뉴스 제목"이고, 번역본이 있으면 이미 한국어로 내려온다(`RiskEventService`가
 * `raw_events.title_ko`를 조인해 채운다).
 *
 * `collected_at`·`url`은 2026-08-03에 지도 응답에 추가돼서 이제 그대로 넘긴다 — 그전에는
 * 지도에서 고른 항목만 "기사 원문 열기" 버튼과 시각이 빠져 있었다. 값이 없으면(placeholder
 * 폴백) `undefined`가 되고 화면이 알아서 뺀다.
 *
 * `headline_original`은 여전히 채우지 않는다. 공개 지도 응답에 번역 전 원문이 없어서, 지어내면
 * 같은 문장을 원문이라며 두 번 그리게 된다.
 *
 * 사용 예:
 *   setSelected(fromRiskBoardItem(item))
 */
export function fromRiskBoardItem(item: GlobalRiskBoardItem): SelectedArticle {
  return {
    id: item.risk_event_id,
    origin: 'MAP',
    headline: item.event_summary,
    material: item.material,
    grade: item.grade,
    confidence_label: item.confidence_label,
    country_code: item.country_code ?? null,
    country_name: item.country_name,
    collected_at: item.collected_at ?? undefined,
    url: item.source_url ?? null,
  }
}
