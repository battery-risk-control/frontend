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

  test('로그인 상태에서 다른 계층 탭을 클릭하면 RequireAuth가 자신의 대시보드로 되돌린다', async ({ page }) => {
    // Phase 8부터 RequireAuth가 org_tier까지 매칭한다 — purchasing 계정은 경영기획팀 탭을 눌러도 /planning이 아니라 /purchasing에 남는다.
    // 계층별 조합 전체는 e2e/tier-access.spec.ts에서 검증한다.
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    // Header 로고로 SPA 내 이동(인증 상태 유지, 하드 리로드 아님)
    await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole('button', { name: '경영기획팀' }).click()
    await expect(page).toHaveURL(/\/purchasing$/)
    await expect(page.getByText('구매팀 대시보드')).toBeVisible()
  })
})
