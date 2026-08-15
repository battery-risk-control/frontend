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
  build: {
    // [성능] 무거운 vendor를 안정된 이름의 청크로 분리한다. 라우트 lazy(routes.tsx)만으로도
    // 페이지별 청크는 갈라지지만, 여러 페이지가 공유하는 대형 라이브러리를 여기서 한 청크로
    // 묶어 두면 ① 페이지를 옮겨도 그 라이브러리를 다시 받지 않고(브라우저 캐시 적중) ② 앱
    // 코드만 바뀐 재배포에서 vendor 청크 해시가 유지돼 재다운로드가 준다.
    // three(약 570KB)·recharts(272KB)·leaflet 계열(273KB)이 최대 항목이라 각각 분리한다.
    // [ROLLBACK] 이 build 블록을 통째로 지우면 Vite 기본 청크 전략으로 되돌아간다.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/three/') || id.includes('/three-') || id.includes('three/addons')) return 'vendor-three'
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) return 'vendor-charts'
          if (id.includes('/leaflet') || id.includes('/topojson') || id.includes('/world-atlas')) return 'vendor-map'
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/@tanstack/')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
}))
