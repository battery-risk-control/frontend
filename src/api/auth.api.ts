// ⚠️ DEV/DEMO ONLY — 실제 배포 전 이 mock 전체를 실제 API 호출로 교체하고
// 아래 테스트 계정을 반드시 삭제할 것. 프로덕션 빌드에 포함되면 안 된다.
// 클라이언트 쪽 라우트 접근 제어(app/routes.tsx RequireAuth)는 UX 안내일 뿐
// 실제 보안 경계가 아니며, 진짜 접근 통제는 백엔드 토큰 검증이 맡는다. (CLAUDE.md 참고)

import type { LoginFormValues, LoginResponse, OrgTier, SignupFormValues, SignupRequest, SignupResponse } from './types'

/** 데모에서 승인 대기(PENDING) 응답을 재현하기 위한 테스트 계정. 이 이메일로 로그인하면 락 화면으로 전환된다. */
const PENDING_TEST_EMAIL = 'pending@company.com'

/** 계층별 내비게이션·라우트 가드 데모용 테스트 계정 3종 — 배포 전 삭제 대상. */
const TEST_ACCOUNTS: { email: string; password: string; org_tier: OrgTier }[] = [
  { email: 'purchasing@test.local', password: 'test1234!', org_tier: 'purchasing' },
  { email: 'planning@test.local', password: 'test1234!', org_tier: 'planning' },
  { email: 'executive@test.local', password: 'test1234!', org_tier: 'executive' },
]

/** Figma 와이어프레임 회원가입 폼에는 소속 회사명 입력이 없어 임시로 고정한다. */
const DEFAULT_ORG_NAME = 'OO배터리'

/**
 * 로그인 mock 함수. mock-schemas.md의 성공/PENDING 응답 스키마를 그대로 따른다.
 * TEST_ACCOUNTS에 매칭되면 해당 org_tier로, 그 외 이메일은 데모 편의상 구매팀 권한으로 승인 처리한다
 * (실제 인증 로직이 아니다).
 *
 * 사용 예:
 *   const result = login({ email, password, rememberMe })
 *   if ('error' in result) { ... PendingApprovalScreen으로 전환 ... }
 */
export function login({ email, password }: LoginFormValues): LoginResponse {
  if (email === PENDING_TEST_EMAIL) {
    return { error: 'PENDING_APPROVAL', message: '관리자 승인 대기 중입니다.' }
  }
  const testAccount = TEST_ACCOUNTS.find((account) => account.email === email && account.password === password)
  if (testAccount) {
    return { access_token: 'mock.jwt.token', org_tier: testAccount.org_tier, status: 'APPROVED' }
  }
  return { access_token: 'mock.jwt.token', org_tier: 'purchasing', status: 'APPROVED' }
}

/**
 * 회원가입(권한 신청) mock 함수. mock-schemas.md 스키마상 항상 PENDING 상태로 응답한다.
 *
 * 사용 예:
 *   const result = signup({ name, email, password, org_tier })
 */
export function signup(values: SignupFormValues): SignupResponse {
  const payload: SignupRequest = { ...values, org_name: DEFAULT_ORG_NAME }
  const userId = `USR-${payload.email.split('@')[0].slice(0, 4).toUpperCase()}`
  return { user_id: userId, status: 'PENDING', message: '관리자 승인 대기 중입니다.' }
}
