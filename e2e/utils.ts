import type { Page } from '@playwright/test'

/** /auth로 이동해 로그인 폼을 제출한다. 성공/PENDING 여부와 무관하게 제출까지만 수행한다. */
export async function loginAs(page: Page, email: string, password = 'test1234!') {
  await page.goto('/auth')
  await page.getByLabel('사내 이메일 주소').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '보안 세션 로그인' }).click()
}

/**
 * 페이지를 새로고침하지 않고 React Router 경로만 이동한다.
 *
 * mock 인증 정보는 메모리에 저장되므로 page.goto('/')를 사용하면
 * 로그인 상태가 사라진다. 로그인 상태를 유지한 채 공개 화면을
 * 검증해야 하는 E2E에서 사용한다.
 */
export async function navigateSpa(page: Page, path: string) {
  // 이 프로젝트의 TypeScript 설정은 E2E 파일에 DOM 타입을 포함하지 않는다.
  // 문자열 스크립트로 브라우저 컨텍스트에서 실행한다. React Router가 화면 전환을
  // 감지하도록 새 history 항목을 만들되, 빈 state를 넣지 않고 Router가 사용하는
  // idx/key/usr 형태를 유지한다.
  const targetPath = JSON.stringify(path)
  await page.evaluate(`(() => {
    const currentState = window.history.state || {}
    const currentIndex = Number.isInteger(currentState.idx) ? currentState.idx : 0
    window.history.pushState(
      { ...currentState, idx: currentIndex + 1, key: 'e2e-' + Date.now(), usr: null },
      '',
      ${targetPath},
    )
  })()`)

  // 합성 popstate는 일부 react-router 버전에서 무시될 수 있다. 실제 same-document
  // history traversal을 왕복하면 브라우저가 신뢰 가능한 popstate를 발생시키고,
  // 하드 리로드 없이 Router 화면과 주소가 함께 targetPath로 바뀐다.
  await page.goBack()
  await page.goForward()
}
