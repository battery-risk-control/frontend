/**
 * 소수점 표시 규칙(2계층 전 화면 공통) — 소수점 1자리까지만 반올림하고, 정수면 소수점을
 * 아예 표시하지 않는다. 백엔드가 Postgres AVG()/나눗셈 결과를 BigDecimal로 그대로 내려줄 때
 * 소수점이 10자리 넘게 붙는 문제(예: 20.7019867549668874)를 화면에서 일괄 정리한다.
 *
 * 사용 예:
 *   formatScore(20.7019867549668874) // '20.7'
 *   formatScore(30.0)                // '30'
 */
export function formatScore(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return String(rounded)
}
