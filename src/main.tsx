import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './index.css'
import App from './App.tsx'

// [코드 스플리팅 안전장치] 재배포 직후, 이전 버전 index.html을 띄워 둔 브라우저는 사라진 해시의
// lazy 청크를 요청해 404가 난다(단일 번들일 땐 없던 문제다). 그때 한 번만 새로고침해 새 index.html
// 과 새 청크 목록을 받게 한다. 무한 새로고침을 막으려 sessionStorage로 1회만 시도한다 —
// 진짜 네트워크 오프라인이면 리로드해도 또 실패하므로, 두 번째부터는 Suspense가 그대로 에러를
// 드러내 사용자가 상황을 인지하게 둔다.
window.addEventListener('vite:preloadError', () => {
  const KEY = 'vite-preload-reloaded'
  if (sessionStorage.getItem(KEY)) return
  sessionStorage.setItem(KEY, '1')
  window.location.reload()
})
// 정상적으로 로드가 끝난 세션에서는 플래그를 지워, 다음 재배포 때 다시 1회 리로드가 가능하게 한다.
window.addEventListener('load', () => sessionStorage.removeItem('vite-preload-reloaded'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
