import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * features/public/pages/PublicDashboardPage.tsx 상단 3계층 탭 내비게이션 검증.
 */
test.describe('공개 대시보드 상단 탭 내비게이션', () => {
  test('미로그인 상태로 탭 클릭 시 /auth로 이동한다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('글로벌 리스크 관제 맵')).toBeVisible()

    await page.getByRole('button', { name: '구매팀' }).click()
    await expect(page).toHaveURL(/\/auth$/)
  })

  test('로그인 상태에서 다른 계층 탭을 클릭하면 RequireAuth가 확인 모달을 거쳐 자신의 대시보드로 되돌린다', async ({
    page,
  }) => {
    // Phase 8부터 RequireAuth가 org_tier까지 매칭한다 — purchasing 계정은 경영기획팀 탭을 눌러도 /planning이 아니라
    // 계층 불일치 확인 모달(Phase 8.5)이 뜬다. 계층별 조합 전체는 e2e/tier-access.spec.ts에서 검증한다.
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    // Header 로고로 SPA 내 이동(인증 상태 유지, 하드 리로드 아님)
    await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole('button', { name: '경영기획팀' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('이 화면은 회원님의 권한(구매팀)으로 접근할 수 없습니다.')).toBeVisible()

    await page.getByRole('button', { name: '내 화면으로 이동' }).click()
    await expect(page).toHaveURL(/\/purchasing$/)
    await expect(page.getByText('구매팀 대시보드')).toBeVisible()
  })

  test('로그인 상태로 공개 대시보드에 진입하면 Header에 계정 정보와 로그아웃 버튼이 표시된다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
    await expect(page).toHaveURL(/\/$/)

    await expect(page.getByText('purchasing@test.local · 구매팀')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible()
    await expect(page.getByRole('link', { name: '로그인/회원가입' })).not.toBeVisible()
  })

  test('미로그인 상태로 공개 대시보드에 진입하면 Header에 로그인/회원가입 버튼이 표시된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: '로그인/회원가입' })).toBeVisible()
  })
})
