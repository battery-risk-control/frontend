import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * AuthPage의 "홈으로" 링크와 Header 로고 링크가 "/"(비로그인 공개 대시보드)로
 * 이동하는지 검증한다.
 */
test.describe('홈 이동 링크', () => {
  test('AuthPage의 "홈으로" 링크를 클릭하면 공개 대시보드로 이동한다', async ({ page }) => {
    await page.goto('/auth')
    await page.getByRole('link', { name: /홈으로/ }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('글로벌 리스크 관제 맵')).toBeVisible()
  })

  test('Header 로고를 클릭하면 공개 대시보드로 이동한다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('글로벌 리스크 관제 맵')).toBeVisible()
  })
})
