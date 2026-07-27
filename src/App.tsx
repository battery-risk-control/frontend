import { AppRoutes } from './app/routes'
import { AuthProvider } from './lib/AuthProvider'
import { SideNavProvider } from './lib/SideNavProvider'
import { AlertsPanelProvider } from './lib/AlertsPanelProvider'

function App() {
  return (
    <AuthProvider>
      <SideNavProvider>
        <AlertsPanelProvider>
          <AppRoutes />
        </AlertsPanelProvider>
      </SideNavProvider>
    </AuthProvider>
  )
}

export default App
