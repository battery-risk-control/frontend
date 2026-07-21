import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * app/routes.tsx RequireAuth의 org_tier 매칭 검증(roadmap.md Phase 8).
 * 로그인 계정과 다른 계층 라우트로 이동을 시도하면 403 화면 대신 자신의 실제
 * 대시보드로 리다이렉트된다. 계층이 다르면 안 되므로 공개 대시보드 탭(SPA 내 이동)을
 * 통해 시도한다 — page.goto()로 직접 접속하면 인메모리 인증 상태가 사라져 이 분기를
 * 검증할 수 없다(그 경우는 e2e/route-guard.spec.ts의 "미로그인" 시나리오와 동일해진다).
 */
const TIER_TAB_LABEL: Record<string, string> = {
  '/purchasing': '구매팀',
  '/planning': '경영기획팀',
  '/executive': '경영진',
}

const CASES = [
  { email: 'purchasing@test.local', ownPath: '/purchasing', ownHeading: '구매팀 대시보드', tryPath: '/executive' },
  { email: 'planning@test.local', ownPath: '/planning', ownHeading: '경영기획팀 대시보드', tryPath: '/purchasing' },
  { email: 'executive@test.local', ownPath: '/executive', ownHeading: '누적 리스크 탐지 KPI', tryPath: '/planning' },
] as const

test.describe('계층 불일치 리다이렉트', () => {
  for (const { email, ownPath, ownHeading, tryPath } of CASES) {
    test(`${email} 계정이 다른 계층 탭을 클릭해도 자신의 대시보드(${ownPath})로 되돌아간다`, async ({ page }) => {
      await loginAs(page, email)
      await expect(page).toHaveURL(new RegExp(`${ownPath}$`))

      await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
      await expect(page).toHaveURL(/\/$/)

      await page.getByRole('button', { name: TIER_TAB_LABEL[tryPath] }).click()
      await expect(page).toHaveURL(new RegExp(`${ownPath}$`))
      await expect(page.getByText(ownHeading)).toBeVisible()
    })
  }
})
