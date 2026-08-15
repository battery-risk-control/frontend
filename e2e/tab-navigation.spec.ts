import { test, expect } from '@playwright/test'

/**
 * features/public/pages/PublicDashboardPage.tsx 상단 3계층 탭 내비게이션 검증.
 */
test.describe('공개 대시보드 상단 탭 내비게이션', () => {
  test('미로그인 상태로 탭 클릭 시 /auth로 이동한다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '구매 위험 관제 대시보드', exact: true })).toBeVisible()

    await page.getByRole('button', { name: '구매팀' }).click()
    await expect(page).toHaveURL(/\/auth$/)
  })

  test('미로그인 상태로 공개 대시보드에 진입하면 Header에 로그인/회원가입 버튼이 표시된다', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: '로그인/회원가입' })).toBeVisible()
  })
})
