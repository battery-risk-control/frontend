import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * components/layout/Header.tsx의 로그인 계정 정보 표시 + 로그아웃 동작 검증(roadmap.md Phase 8).
 */
test.describe('Header 계정 정보 및 로그아웃', () => {
  test('로그인하면 Header에 이메일과 계층이 표시된다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)
    await expect(page.getByText('purchasing@test.local · 구매팀')).toBeVisible()
  })

  test('로그아웃하면 인증 상태가 초기화되고 "/"로 이동하며 보호 라우트가 다시 막힌다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    await page.getByRole('button', { name: '로그아웃' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('글로벌 리스크 관제 맵')).toBeVisible()

    await page.goto('/purchasing')
    await expect(page).toHaveURL(/\/auth$/)
  })
})
