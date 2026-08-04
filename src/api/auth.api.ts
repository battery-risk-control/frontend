// ⚠️ mock 관련 코드(테스트 계정 배열, loginMock/signupMock)는 ①단계(프론트엔드 단독)
// 전용이다. `VITE_API_BASE_URL`이 설정되면(②서비스 테스트/③실제 배포) 아래 loginApi/
// signupApi가 대신 호출된다 — ③ 진입 시 mock 코드 전체와 테스트 계정 정보를 삭제할 것.
// 클라이언트 쪽 라우트 접근 제어(app/routes.tsx RequireAuth)는 UX 안내일 뿐
// 실제 보안 경계가 아니며, 진짜 접근 통제는 백엔드 토큰 검증이 맡는다. (CLAUDE.md 참고)

import { fetchJson } from './http'
import type { LoginFormValues, LoginResponse, OrgTier, SignupFormValues, SignupRequest, SignupResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/** 데모에서 승인 대기(PENDING) 응답을 재현하기 위한 테스트 계정. 이 이메일로 로그인하면 락 화면으로 전환된다. */
const PENDING_TEST_EMAIL = 'pending@company.com'

/** 계층별 내비게이션·라우트 가드 데모용 테스트 계정 3종 — ①단계 전용, 배포 전 삭제 대상. */
const TEST_ACCOUNTS: { email: string; password: string; org_tier: OrgTier }[] = [
  { email: 'purchasing@test.local', password: 'test1234!', org_tier: 'purchasing' },
  { email: 'planning@test.local', password: 'test1234!', org_tier: 'planning' },
  { email: 'executive@test.local', password: 'test1234!', org_tier: 'executive' },
]

/** Figma 와이어프레임 회원가입 폼에는 소속 회사명 입력이 없어 임시로 고정한다. */
const DEFAULT_ORG_NAME = 'OO배터리'

/** 백엔드 signup 응답(`backend/docs/auth-integration-handoff.md` §2-1)에는 message 필드가 없어 고정 문구를 쓴다. */
const SIGNUP_PENDING_MESSAGE = '관리자 승인 대기 중입니다.'

function loginMock({ email, password }: LoginFormValues): LoginResponse {
  if (email === PENDING_TEST_EMAIL) {
    return { error: 'PENDING_APPROVAL', message: '관리자 승인 대기 중입니다.' }
  }
  const testAccount = TEST_ACCOUNTS.find((account) => account.email === email && account.password === password)
  if (testAccount) {
    return { access_token: 'mock.jwt.token', org_tier: testAccount.org_tier, status: 'APPROVED' }
  }
  return { access_token: 'mock.jwt.token', org_tier: 'purchasing', status: 'APPROVED' }
}

function signupMock(values: SignupFormValues): SignupResponse {
  const payload: SignupRequest = { ...values, org_name: DEFAULT_ORG_NAME }
  const userId = `USR-${payload.email.split('@')[0].slice(0, 4).toUpperCase()}`
  return { user_id: userId, status: 'PENDING', message: SIGNUP_PENDING_MESSAGE }
}

interface LoginApiData {
  access_token: string
  org_tier: OrgTier
  status: 'APPROVED'
}

async function loginApi(values: LoginFormValues): Promise<LoginResponse> {
  const result = await fetchJson<LoginApiData>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: values.email, password: values.password }),
  })
  if ('error' in result) {
    if (result.error === 'PENDING_APPROVAL') {
      return { error: 'PENDING_APPROVAL', message: result.message }
    }
    // INVALID_CREDENTIALS 등 — mock에는 없던 실패 케이스라 LoginResponse 타입에 슬롯이 없다.
    // 호출부(AuthPage)가 try/catch로 받아 안내 문구를 보여준다.
    throw new Error(result.message)
  }
  return { access_token: result.access_token, org_tier: result.org_tier, status: result.status }
}

interface SignupApiData {
  user_id: string
  status: 'PENDING'
  org_tier: OrgTier
}

async function signupApi(values: SignupFormValues): Promise<SignupResponse> {
  const payload: SignupRequest = { ...values, org_name: DEFAULT_ORG_NAME }
  const result = await fetchJson<SignupApiData>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if ('error' in result) {
    // DUPLICATE_USERNAME 등 — mock에는 없던 실패 케이스라 SignupResponse 타입에 슬롯이 없다.
    throw new Error(result.message)
  }
  return { user_id: result.user_id, status: result.status, message: SIGNUP_PENDING_MESSAGE }
}

/**
 * 로그인. `VITE_API_BASE_URL`이 설정돼 있으면 실제 백엔드(`POST /api/v1/auth/login`)를
 * 호출하고, 없으면(①단계) mock으로 동작한다. mock-schemas.md의 성공/PENDING 응답 스키마를
 * 그대로 따른다.
 *
 * 사용 예:
 *   const result = await login({ email, password, rememberMe })
 *   if ('error' in result) { ... PendingApprovalScreen으로 전환 ... }
 */
export function login(values: LoginFormValues): Promise<LoginResponse> {
  if (!API_BASE_URL) {
    return Promise.resolve(loginMock(values))
  }
  return loginApi(values)
}

/**
 * 회원가입(권한 신청). `VITE_API_BASE_URL`이 설정돼 있으면 실제 백엔드
 * (`POST /api/v1/auth/signup`)를 호출하고, 없으면(①단계) mock으로 동작한다.
 * mock-schemas.md 스키마상 항상 PENDING 상태로 응답한다.
 *
 * 사용 예:
 *   const result = await signup({ name, email, password, org_tier })
 */
export function signup(values: SignupFormValues): Promise<SignupResponse> {
  if (!API_BASE_URL) {
    return Promise.resolve(signupMock(values))
  }
  return signupApi(values)
}
