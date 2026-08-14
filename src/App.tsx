import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './app/routes'
import { AuthProvider } from './lib/AuthProvider'
import { SideNavProvider } from './lib/SideNavProvider'
import { AlertsPanelProvider } from './lib/AlertsPanelProvider'
import { ScrollToTop } from './components/layout/ScrollToTop'

// retry:false — 실패는 값(FetchJsonError)으로 반환되거나 throw되는 모델이라(fetchWithAuth),
// 일시적 네트워크 실패를 자동 재시도하는 TanStack Query 기본값(3회)이 이 프로젝트 관례와
// 안 맞는다. refetchOnWindowFocus:false — 데모/시연 중 탭 전환마다 재요청되는 걸 방지.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
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
