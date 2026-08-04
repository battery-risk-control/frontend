import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    // live(②서비스 테스트, 실 백엔드 연결) 모드만 포트(5173)를 고정한다 — 백엔드
    // CORS_ALLOWED_ORIGINS는 5173만 허용하므로, 이 모드에서 조용한 포트 fallback은 브라우저에서
    // 뒤늦게 "Failed to fetch"로만 드러나는 원인 불명 오류를 만든다(실측으로 확인). 기본 dev(①mock)는
    // Vite 기본 동작(점유 시 5174 등으로 자동 이동)을 그대로 둬, dev(mock)와 dev:live(실 백엔드)를
    // 동시에 띄워 화면을 나란히 비교 시연할 수 있게 한다.
    strictPort: mode === 'live',
  },
}))
