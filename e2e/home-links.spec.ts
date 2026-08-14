import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * AuthPage의 "홈으로" 링크는 공개 대시보드로 이동하고,
 * 로그인 후 Header 로고는 사용자 자신의 계층 대시보드로 이동하는지 검증한다.
 */
test.describe('홈 이동 링크', () => {
  test('AuthPage의 "홈으로" 링크를 클릭하면 공개 대시보드로 이동한다', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('link', { name: /홈으로/ }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: '구매 위험 관제 대시보드', exact: true })).toBeVisible()
  })

  test('로그인 상태에서 Header 로고를 클릭하면 자신의 대시보드로 이동한다', async ({ page }) => {
    test.setTimeout(120_000)
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    // 하위 화면으로 이동한 뒤 로고가 구매팀 홈으로 돌아가는지 확인한다.
    await page.getByRole('link', {
      name: '리스크 모니터링',
      exact: true,
    }).click()

    await expect(page).toHaveURL(/\/purchasing\/risk-monitoring$/)

    await page.getByRole('link', {
      name: '배터리 원자재 공급망 리스크 관제',
    }).click()

    await expect(page).toHaveURL(/\/purchasing$/)
    await expect(
      page.getByRole('heading', {
        name: '구매팀 대시보드',
        exact: true,
      }),
    ).toBeVisible()
  })
})
