/**
 * 개인정보 표시 마스킹 유틸. 규제 가이드 ③(개인정보 표시 제한 보호조치) 대응.
 *
 * 백엔드 AdminUserSummary의 마스킹 규칙과 동일하게 맞춘다.
 * - 이름: 앞 2자만 남기고 나머지는 '*' (예: 홍길동 → 홍길*). 2자는 앞 1자+'*', 1자는 '*'.
 * - 이메일 로컬파트: 끝 2자를 '**' (예: a020299 → a0202**). 2자는 앞 1자+'*', 1자는 '*'.
 */

/** 이름 마스킹: 홍길동 → 홍길*. */
export function maskName(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return ''
  if (trimmed.length === 1) return '*'
  if (trimmed.length === 2) return `${trimmed[0]}*`
  return `${trimmed.slice(0, 2)}${'*'.repeat(trimmed.length - 2)}`
}

/** 로컬파트 마스킹: a020299 → a0202**. */
function maskLocalPart(local: string): string {
  if (local.length === 0) return ''
  if (local.length === 1) return '*'
  if (local.length === 2) return `${local[0]}*`
  return `${local.slice(0, -2)}**`
}

/**
 * 헤더 등 본인 표시용. 값에 '@'가 있으면 로컬파트만 마스킹해 도메인은 유지하고,
 * 없으면(아이디 등) 전체를 로컬파트로 보고 마스킹한다.
 * 예: a020299@company.com → a0202**@company.com, purchasing → purchasi**.
 */
export function maskEmailLocal(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length === 0) return ''
  const at = trimmed.indexOf('@')
  if (at < 0) return maskLocalPart(trimmed)
  return `${maskLocalPart(trimmed.slice(0, at))}${trimmed.slice(at)}`
}
