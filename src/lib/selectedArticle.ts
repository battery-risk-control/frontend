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
    origin: 'NEWS',
    headline: item.headline,
    material: item.material,
    grade: item.grade,
    confidence_label: item.confidence_label,
    country_code: item.country_code,
    collected_at: item.collected_at,
    headline_original: item.headline_original,
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
 * `collected_at`·`url`·`headline_original`은 **채우지 않는다.** 공개 지도 응답에 없는 값이라
 * 지어내면 화면이 "3분 전"이나 원문 링크를 가짜로 그리게 된다. 화면은 있는 필드만 렌더한다.
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
  }
}
