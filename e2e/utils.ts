import type { Page } from '@playwright/test'

/** /auth로 이동해 로그인 폼을 제출한다. 성공/PENDING 여부와 무관하게 제출까지만 수행한다. */
export async function loginAs(page: Page, email: string, password = 'test1234!') {
  await page.goto('/auth')
  await page.getByLabel('사내 이메일 주소').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '보안 세션 로그인' }).click()
}
