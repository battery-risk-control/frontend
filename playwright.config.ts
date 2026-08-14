import { defineConfig, devices } from '@playwright/test'

/**
 * e2e/ 아래 시나리오를 빌드된 프로덕션 번들(dist/) 기준으로 검증한다.
 * CI 순서(install → tsc → eslint → build → e2e)상 이 설정이 실행되는 시점엔 dist/가
 * 이미 만들어져 있다고 가정한다 — `npm run build`를 먼저 실행한 뒤 `npm run test:e2e`를 돌릴 것.
 */
export default defineConfig({
  testDir: './e2e',
  // CI 러너에서는 대시보드의 비동기 쿼리와 SPA 렌더링이 로컬보다 느릴 수 있다.
  // 기능 실패가 아닌 일시적인 5초/30초 초과로 전체 체크가 흔들리지 않도록 여유를 둔다.
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
