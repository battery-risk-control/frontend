import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 포트(5173)가 이미 사용 중이면 다른 포트로 조용히 넘어가지 않고 즉시 에러로 실패한다 —
    // 백엔드 CORS_ALLOWED_ORIGINS는 5173만 허용하므로, 조용한 포트 fallback은 브라우저에서
    // 뒤늦게 "Failed to fetch"로만 드러나는 원인 불명 오류를 만든다(실측으로 확인).
    strictPort: true,
  },
})
