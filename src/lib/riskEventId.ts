/**
 * risk_event_id(RISK-YYYY-MMDD-NNN)에서 날짜를 추출해 'YYYY-MM-DD'로 반환한다.
 * 형식이 예상과 다르면 원본 id를 그대로 반환한다.
 *
 * 사용 예:
 *   parseRiskEventDate('RISK-2026-0721-001') // '2026-07-21'
 */
export function parseRiskEventDate(riskEventId: string): string {
  const match = riskEventId.match(/^RISK-(\d{4})-(\d{2})(\d{2})-\d+$/)
  if (!match) return riskEventId
  const [, year, month, day] = match
  return `${year}-${month}-${day}`
}
