import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * features/auth/components/PendingApprovalScreen.tsx로 전환되는 두 경로(로그인/회원가입)와
 * "처음으로" 복귀 동작을 검증한다.
 */
test.describe('승인 대기(PENDING) 플로우', () => {
  test('PENDING 테스트 계정으로 로그인하면 승인 대기 화면으로 전환된다', async ({ page }) => {
    await loginAs(page, 'pending@company.com', 'anything')
    await expect(page.getByRole('heading', { name: '관리자 승인 대기 중입니다' })).toBeVisible()
  })

  test('회원가입을 제출하면 항상 승인 대기 화면으로 전환된다', async ({ page }) => {
    // 고정 이메일을 쓰면 mock(무상태)에선 항상 통과하지만, 실 백엔드(영구 DB, 이메일 유니크
    // 제약)에선 같은 DB에 반복 실행 시 두 번째부터 중복으로 실패한다(실측 확인) — 실행마다
    // 고유한 이메일을 써서 실 DB 대상 반복 실행에도 안전하게 한다.
    const uniqueEmail = `hong-${Date.now()}@company.com`
    await page.goto('/auth')
    await page.getByRole('tab', { name: '권한 신청' }).click()
    await page.getByLabel('임직원 성명').fill('홍길동')
    await page.getByLabel('회사 이메일 계정 (ID)').fill(uniqueEmail)
    // Passw0rd!! = 영문+숫자+특수문자 3종 10자 → 규제 가이드 ② 비밀번호 규칙 통과.
    await page.getByLabel('접속 비밀번호 설정').fill('Passw0rd!!')
    await page.getByLabel('비밀번호 확인').fill('Passw0rd!!')
    await page.locator('input[type="radio"][value="purchasing"]').check()
    // 규제 가이드 ① 필수 개인정보 수집·이용 동의(전체동의로 필수·선택을 함께 체크).
    await page.getByText('약관에 모두 동의합니다.').click()
    await page.getByRole('button', { name: '가입 및 계정 승인 요청' }).click()
    await expect(page.getByRole('heading', { name: '관리자 승인 대기 중입니다' })).toBeVisible()
  })

  test('승인 대기 화면에서 "처음으로"를 클릭하면 로그인 탭으로 복귀한다', async ({ page }) => {
    await loginAs(page, 'pending@company.com', 'anything')
    await expect(page.getByRole('heading', { name: '관리자 승인 대기 중입니다' })).toBeVisible()

    await page.getByRole('button', { name: '처음으로' }).click()
    await expect(page.getByRole('tab', { name: '시스템 로그인' })).toBeVisible()
    await expect(page.getByLabel('사내 이메일 주소')).toBeVisible()
  })
})
