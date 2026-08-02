import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * api/auth.api.ts의 DEV/DEMO 테스트 계정 3종이 각자의 org_tier 대시보드로
 * 정확히 로그인되는지 확인한다.
 */
const TEST_ACCOUNTS = [
  // 제목이 '구매팀 대시보드' → '구매 위험 관제 대시보드'로 바뀌었다(2026-08-02, 목업 반영).
  { email: 'purchasing@test.local', path: '/purchasing', heading: '구매 위험 관제 대시보드' },
  { email: 'planning@test.local', path: '/planning', heading: '경영기획팀 대시보드' },
  { email: 'executive@test.local', path: '/executive', heading: '누적 리스크 탐지 KPI' },
] as const

test.describe('테스트 계정 로그인', () => {
  for (const account of TEST_ACCOUNTS) {
    test(`${account.email} 로그인 시 ${account.path}로 이동한다`, async ({ page }) => {
      await loginAs(page, account.email)
      await expect(page).toHaveURL(new RegExp(`${account.path}$`))
      await expect(page.getByText(account.heading)).toBeVisible()
    })
  }
})
