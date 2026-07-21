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

  test('로그인 상태에서는 로그인한 계층과 달라도 클릭한 탭의 대시보드로 이동한다', async ({ page }) => {
    // purchasing 계정으로 로그인한 뒤에도 경영기획팀 탭으로 진입 가능해야 한다 — 계층 매칭은 이번 범위 밖.
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    // Header 로고로 SPA 내 이동(인증 상태 유지, 하드 리로드 아님)
    await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole('button', { name: '경영기획팀' }).click()
    await expect(page).toHaveURL(/\/planning$/)
    await expect(page.getByText('경영기획팀 대시보드')).toBeVisible()
  })
})
