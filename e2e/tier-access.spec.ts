import { test, expect } from '@playwright/test'
import { loginAs } from './utils'

/**
 * app/routes.tsx RequireAuth의 org_tier 매칭 검증(roadmap.md Phase 8) + 계층 불일치 확인
 * 모달(Phase 8.5, qa-checklist.md C) 검증. 로그인 계정과 다른 계층 라우트로 이동을 시도하면
 * 무음 리다이렉트 대신 확인 모달이 뜨고, "내 화면으로 이동"을 눌러야만 자신의 실제 대시보드로
 * 이동한다. 계층이 다르면 안 되므로 공개 대시보드 탭(SPA 내 이동)을 통해 시도한다 —
 * page.goto()로 직접 접속하면 인메모리 인증 상태가 사라져 이 분기를 검증할 수 없다(그 경우는
 * e2e/route-guard.spec.ts의 "미로그인" 시나리오와 동일해진다).
 */
const TIER_TAB_LABEL: Record<string, string> = {
  '/purchasing': '구매팀',
  '/planning': '경영기획팀',
  '/executive': '경영진',
}

const CASES = [
  // 제목이 '구매팀 대시보드' → '구매 위험 관제 대시보드'로 바뀌었다(2026-08-02, 목업 반영).
  { email: 'purchasing@test.local', ownPath: '/purchasing', ownHeading: '구매 위험 관제 대시보드', tryPath: '/executive' },
  { email: 'planning@test.local', ownPath: '/planning', ownHeading: '경영기획팀 대시보드', tryPath: '/purchasing' },
  { email: 'executive@test.local', ownPath: '/executive', ownHeading: '누적 리스크 탐지 KPI', tryPath: '/planning' },
] as const

test.describe('계층 불일치 확인 모달', () => {
  for (const { email, ownPath, ownHeading, tryPath } of CASES) {
    test(`${email} 계정이 다른 계층 탭을 클릭하면 모달이 뜨고, "내 화면으로 이동"을 누르면 자신의 대시보드(${ownPath})로 이동한다`, async ({
      page,
    }) => {
      await loginAs(page, email)
      await expect(page).toHaveURL(new RegExp(`${ownPath}$`))

      await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
      await expect(page).toHaveURL(/\/$/)

      await page.getByRole('button', { name: TIER_TAB_LABEL[tryPath] }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(`이 화면은 회원님의 권한(${TIER_TAB_LABEL[ownPath]})으로 접근할 수 없습니다.`)).toBeVisible()

      await page.getByRole('button', { name: '내 화면으로 이동' }).click()
      await expect(page).toHaveURL(new RegExp(`${ownPath}$`))
      await expect(page.getByText(ownHeading)).toBeVisible()
    })
  }

  test('"취소"를 누르면 이동하지 않고 홈으로 돌아간다', async ({ page }) => {
    await loginAs(page, 'purchasing@test.local')
    await expect(page).toHaveURL(/\/purchasing$/)

    await page.getByRole('link', { name: '배터리 원자재 공급망 리스크 관제' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.getByRole('button', { name: '경영기획팀' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: '취소' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('글로벌 리스크 관제 맵')).toBeVisible()
  })
})
