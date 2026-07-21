import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * app/routes.tsx의 RequireAuth 가드 검증. 클라이언트 UX 수준 가드이며(CLAUDE.md 참고),
 * 인메모리 인증 상태가 없으면 /purchasing, /planning, /executive 접근을 /auth로 돌려보낸다.
 */
test.describe('RequireAuth 라우트 가드', () => {
  for (const path of ['/purchasing', '/planning', '/executive']) {
    test(`미로그인 상태로 ${path} 직접 접속 시 /auth로 리다이렉트된다`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/auth$/)
      await expect(page.getByRole('tab', { name: '시스템 로그인' })).toBeVisible()
    })
  }

  test('로그인 후 새로고침하면 인메모리 인증 상태가 사라져 다시 /auth로 막힌다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    await page.reload()
    await expect(page).toHaveURL(/\/auth$/)
  })
})
