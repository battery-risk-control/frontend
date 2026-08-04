import type { SelectedArticle } from '../api/types'

/**
 * 선택한 기사 → AI 브리핑 화면이 받는 `ref`. 만들 수 없으면 null이다.
 *
 * 세 갈래를 순서대로 본다.
 * 1. `event_id` — 뉴스 목록에서 고른 항목. 백엔드가 `raw_events.id`를 그대로 실어 준다.
 * 2. `RAW-{id}` — 분석이 아직 안 붙은 기사의 `risk_event_id`에서 숫자를 뽑는다.
 * 3. 분석 UUID — 분석이 붙은 기사(지도 마커 포함)의 `risk_event_id`.
 *
 * 3번이 되는 것은 2026-08-03부터다. 그전에는 `AiBriefingService.resolveNews`가 숫자만 받아
 * UUID를 넘기면 400이 났고, 그래서 화면은 브리핑 생성 대신 리스크 모니터링 목록으로
 * 보낼 수밖에 없었다 — 클릭한 기사가 선택되지 않은 채 목록만 열리던 원인이다.
 * 지금은 `raw_events.triggered_analysis_id`로 수집 이벤트를 되찾으므로 그대로 넘기면 된다.
 *
 * 사용 예:
 *   toNewsEventRef({ event_id: 923, ... })                       // '923'
 *   toNewsEventRef({ id: 'RAW-301', ... })                       // '301'
 *   toNewsEventRef({ id: '0cf86e3b-8949-490a-a7bd-82cd32757fcd' }) // 그대로 반환
 */
export function toNewsEventRef(article: Pick<SelectedArticle, 'id' | 'event_id'>): string | null {
  if (article.event_id !== null && article.event_id !== undefined) {
    return String(article.event_id)
  }

  const rawMatch = article.id.match(/^RAW-(\d+)$/)
  if (rawMatch) {
    const id = Number(rawMatch[1])
    return Number.isSafeInteger(id) ? String(id) : null
  }

  return isUuid(article.id) ? article.id : null
}

function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value)
}
