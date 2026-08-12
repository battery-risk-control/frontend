/**
 * "기준 시각" 칩 표기(`YYYY.MM.DD HH:mm KST`, 24시간). 대시보드 계층마다 헤더가 같은 기준
 * 시각을 다르게 쓰지 않도록 한 곳에 둔다(공개/구매/경영기획/경영진 헤더 공용).
 *
 * **`Asia/Seoul`로 고정한다.** 예전에는 헤더별로 `formatAsOf`가 따로 있었는데, 경영진만
 * `Intl` + `Asia/Seoul` + `KST`를 붙이고 나머지는 브라우저 현지 시간대에 의존해 타임존 라벨도
 * 없었다. 브라우저 TZ가 KST가 아니면 값이 어긋나므로, 서버가 주는 UTC ISO-8601을 항상
 * `Asia/Seoul` 기준으로 환산하고 `KST`를 명시한다. `기준` 접미사는 호출부가 붙인다.
 *
 * **`toLocale*` 대신 `formatToParts`를 조립한다.** ko-KR `toLocale*`은 점·공백을 끼워 넣고
 * `hour12` 기본값이 12시간제를 타므로(`formatCollectedAt`와 같은 판단), `hourCycle: 'h23'`으로
 * 24시간을 보장하고 자리 표기를 직접 만든다. 파싱 실패/`null`이면 `'데이터 없음'`.
 *
 * 사용 예:
 *   formatAsOf('2026-08-07T01:48:00Z')  // → '2026.08.07 10:48 KST'
 */
export function formatAsOf(value: string | null): string {
  if (!value) return '데이터 없음'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '데이터 없음'

  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return `${part('year')}.${part('month')}.${part('day')} ${part('hour')}:${part('minute')} KST`
}
