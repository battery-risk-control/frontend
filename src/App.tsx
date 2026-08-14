import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './app/routes'
import { AuthProvider } from './lib/AuthProvider'
import { SideNavProvider } from './lib/SideNavProvider'
import { AlertsPanelProvider } from './lib/AlertsPanelProvider'
import { ScrollToTop } from './components/layout/ScrollToTop'

// retry:false — 실패는 값(FetchJsonError)으로 반환되거나 throw되는 모델이라(fetchWithAuth),
// 일시적 네트워크 실패를 자동 재시도하는 TanStack Query 기본값(3회)이 이 프로젝트 관례와
// 안 맞는다. refetchOnWindowFocus:false — 데모/시연 중 탭 전환마다 재요청되는 걸 방지.
//
// staleTime 60초 — 화면을 옮겼다 돌아올 때 방금 받은 데이터를 다시 부르지 않게 한다(기본값 0은
// 재마운트마다 즉시 stale로 보고 재요청). 이 대시보드 지표들은 수집 주기(15분)·집계 특성상 수십 초
// 안에서는 값이 바뀌지 않으므로 캐시를 그대로 보여줘도 안전하고, 페이지 전환의 네트워크 왕복이
// 통째로 사라진다. 최신값이 꼭 필요한 쓰기 후 갱신은 각 화면이 invalidateQueries로 명시 처리한다.
// [ROLLBACK] staleTime 한 줄만 지우면 기존 동작(항상 재요청)으로 돌아간다.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 60_000 } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SideNavProvider>
          <AlertsPanelProvider>
            <ScrollToTop />
            <AppRoutes />
          </AlertsPanelProvider>
        </SideNavProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
