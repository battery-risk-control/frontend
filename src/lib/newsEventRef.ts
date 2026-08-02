/**
 * 공개 뉴스 속보(`GET /api/v1/public/news-feed`)의 `risk_event_id`에서 AI 브리핑 화면이 받는
 * `ref`(= `raw_events.id`)를 뽑는다. 뽑을 수 없으면 null이다.
 *
 * 백엔드는 이 값을 **분석이 붙었으면 분석 UUID, 아니면 `RAW-{id}`** 로 만든다
 * (`RiskEventService`). 그래서 `RAW-` 형태일 때만 원본 이벤트 id를 되찾을 수 있고,
 * UUID 형태에서는 되찾을 방법이 없다 — 공개 응답에 `raw_events.id`가 따로 실려 있지 않다.
 *
 * null이 나오면 화면은 브리핑 생성 대신 리스크 모니터링 화면으로 보내야 한다. AI 브리핑
 * (`?source=NEWS&ref=`)이 숫자 id만 받기 때문에(`AiBriefingService.resolveNews`), UUID를 그대로
 * 넘기면 400이 난다.
 *
 * 사용 예:
 *   toNewsEventRef('RAW-301')                                    // 301
 *   toNewsEventRef('0cf86e3b-8949-490a-a7bd-82cd32757fcd')       // null
 */
export function toNewsEventRef(riskEventId: string): number | null {
  const match = riskEventId.match(/^RAW-(\d+)$/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) ? id : null
}
