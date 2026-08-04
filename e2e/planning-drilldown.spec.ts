import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * features/planning/pages/AiBriefingDetailPage.tsx / ContractDetailPage.tsx (2026-08-03 신규) 검증.
 * mock 빌드(vite preview, VITE_API_BASE_URL 미설정) 기준이라 planning.api.ts의 mock 상세 함수가
 * 실제 검증 대상이 된다.
 */
test.describe('2계층 드릴다운', () => {
  test('AI 브리핑 탭에서 최근 브리핑을 클릭하면 상세 화면으로 이동한다', async ({ page }) => {
    await loginAs(page, 'planning@test.local')
    await expect(page).toHaveURL(/\/planning$/)

    await page.getByRole('link', { name: 'AI 브리핑' }).click()
    await expect(page).toHaveURL(/\/planning\/briefings$/)

    await page.getByRole('link', { name: /인도네시아 니켈 수출 관세 인상/ }).click()
    await expect(page).toHaveURL(/\/planning\/briefing\/RISK-/)
    // 제목(heading)으로 좁힌다 — 사이드바에도 "AI 브리핑" 메뉴가 있어 본문 텍스트로 찾으면
    // 둘이 함께 잡혀 어느 것을 가리키는지 모호해진다(strict 위반).
    await expect(page.getByRole('heading', { name: 'AI 브리핑' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '권고 조치' })).toBeVisible()
  })

  test('계약 현황 탭에서 만료 임박 계약을 클릭하면 상세 화면으로 이동한다', async ({ page }) => {
    await loginAs(page, 'planning@test.local')
    await expect(page).toHaveURL(/\/planning$/)

    await page.getByRole('link', { name: '계약 현황' }).click()
    await expect(page).toHaveURL(/\/planning\/contracts$/)

    await page.getByRole('link', { name: /BA-2025-0014/ }).click()
    await expect(page).toHaveURL(/\/planning\/contract\/BA-2025-0014$/)
    await expect(page.getByText('계약 개요')).toBeVisible()
    await expect(page.getByText('적재 문서')).toBeVisible()
  })

  test('미로그인 상태로 드릴다운 URL에 직접 접속하면 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/planning/briefing/RISK-2026-0721-001')
    await expect(page).toHaveURL(/\/auth$/)

    await page.goto('/planning/contract/BA-2025-0014')
    await expect(page).toHaveURL(/\/auth$/)
  })
})
