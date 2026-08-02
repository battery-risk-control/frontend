import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * features/purchasing/pages/BriefingDetailPage.tsx (Seq 24 "내부 브리핑 자료 열람 화면") 검증.
 */
test.describe('브리핑 자료 열람', () => {
  test('MaterialRiskStatusPanel의 "브리핑 보기" 링크로 진입해 계약조항 요약/협상 포인트를 확인할 수 있다', async ({
    page,
  }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    // MaterialRiskStatusPanel은 Phase 11(2026-07-29)에서 본문 밖으로 이동해 SideNav
    // "원자재 공급사 리스크 현황" 실제 라우트(/purchasing/material-risk)에서만 렌더링된다.
    await page.getByRole('link', { name: '원자재 공급사 리스크 현황' }).click()
    await expect(page).toHaveURL(/\/purchasing\/material-risk$/)

    await page.getByRole('link', { name: '브리핑 보기' }).first().click()
    await expect(page).toHaveURL(/\/purchasing\/briefing\/RISK-/)
    await expect(page.getByText('계약 조항 요약')).toBeVisible()
    await expect(page.getByText('협상 포인트')).toBeVisible()
  })

  test('미로그인 상태로 브리핑 상세 URL에 직접 접속하면 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/purchasing/briefing/RISK-2026-0721-001')
    await expect(page).toHaveURL(/\/auth$/)
  })
})
