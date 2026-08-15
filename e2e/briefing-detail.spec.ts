import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * 구형 브리핑 열람 화면(Seq 24, BriefingDetailPage) 제거 후의 동작 검증.
 *
 * 그 화면은 백엔드가 아니라 하드코딩된 mock 브리핑을 그리던 것이라, 실제 멀티에이전트 결과를
 * 보여주는 AI 브리핑 화면과 나란히 두면 어느 쪽이 진짜인지 구분되지 않았다. 화면은 걷어내고
 * 경로만 남겨 AI 브리핑으로 보낸다 — 기존 링크·북마크가 죽지 않게 하기 위해서다.
 */
test.describe('구형 브리핑 경로', () => {
  test('사이드바 "AI 브리핑"으로 들어가면 열람 전용 화면이 뜬다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    // 예전에는 대시보드 본문의 "브리핑 보기" 링크로 들어갔는데, 대시보드가 목업 기준으로
    // 재배치되며 그 링크가 사라졌다(2026-08-03). 지금 이 화면으로 가는 상시 동선은 사이드바다.
    await page.getByRole('link', { name: 'AI 브리핑', exact: true }).click()

    await expect(page).toHaveURL(/\/purchasing\/ai-briefing$/)
    await expect(page.getByRole('heading', { name: 'AI 구매 브리핑' })).toBeVisible()
    // 대상 없이 들어왔으므로 생성은 막혀 있고 열람만 가능하다.
    await expect(page.getByRole('button', { name: 'LLM 브리핑 생성' })).toBeDisabled()
  })

  test('미로그인 상태로 구형 브리핑 URL에 직접 접속하면 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/purchasing/briefing/RISK-2026-0721-001')
    await expect(page).toHaveURL(/\/auth$/)
  })
})
