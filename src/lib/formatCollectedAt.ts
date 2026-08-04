/**
 * 수집 시각 표기(`MM-DD HH:mm`, 24시간). 화면 여러 곳이 같은 시각을 다르게 쓰지 않도록 한 곳에 둔다.
 *
 * **`toLocale*`을 쓰지 않는다.** ko-KR은 `08. 01.`처럼 점과 공백을 붙이고 `hour12`가 로케일
 * 기본값(12시간)을 타서 `08. 01. PM 05:40`이 된다 — 실제로 `DashboardSidePanel`이 이 방식이라
 * 오후 시각이 전부 PM 표기로 나오고 있었다(2026-08-03 확인). 24시간 고정을 보장하려면 직접
 * 만드는 편이 확실하다.
 *
 * **날짜를 항상 붙인다.** 목업은 시각만 보여주지만 우리 수집은 며칠 전 기사도 목록에 남아,
 * 날짜를 빼면 어제 11:07과 오늘 11:07이 구분되지 않는다.
 *
 * 자리 계산은 브라우저 현지 시간대 기준이다 — 백엔드가 UTC ISO-8601로 주므로 `Date`가 변환한다.
 *
 * 사용 예:
 *   formatCollectedAt('2026-08-01T08:40:38Z')  // → '08-01 17:40' (KST)
 */
export function formatCollectedAt(collectedAt: string): string {
  const date = new Date(collectedAt)
  // 파싱이 안 되면 원문 앞부분을 그대로 보여준다 — 지어낸 시각보다 낫다.
  if (Number.isNaN(date.getTime())) return collectedAt.slice(0, 16).replace('T', ' ')
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
