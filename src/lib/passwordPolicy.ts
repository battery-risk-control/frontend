/**
 * 비밀번호 복잡도 정책. 규제 가이드 ②(비밀번호 규칙) 대응.
 * 백엔드 @ValidPassword 규칙과 동일하게 맞춘다.
 * - 영문/숫자/특수문자 3종 조합: 8~16자
 * - 2종 조합: 10~16자
 * - 1종뿐이거나 공백/제한 특수문자( ( ) < > " ' ; ) 포함: 불가
 */

const FORBIDDEN_SPECIALS = new Set(['(', ')', '<', '>', '"', "'", ';'])

export const PASSWORD_RULE_TEXT =
  '영문·숫자·특수문자 2종 조합 10~16자 또는 3종 조합 8~16자 (공백·( ) < > " \' ; 제외)'

export function isValidPassword(password: string): boolean {
  if (!password) return false
  let hasLetter = false
  let hasDigit = false
  let hasSpecial = false
  for (const ch of password) {
    if (/\s/.test(ch) || FORBIDDEN_SPECIALS.has(ch)) return false
    if (/[a-zA-Z]/.test(ch)) hasLetter = true
    else if (/[0-9]/.test(ch)) hasDigit = true
    else hasSpecial = true
  }
  const kinds = Number(hasLetter) + Number(hasDigit) + Number(hasSpecial)
  const len = password.length
  if (kinds >= 3) return len >= 8 && len <= 16
  if (kinds === 2) return len >= 10 && len <= 16
  return false
}
