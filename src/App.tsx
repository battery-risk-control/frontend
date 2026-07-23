import { AppRoutes } from './app/routes'
import { AuthProvider } from './lib/AuthProvider'
import { SideNavProvider } from './lib/SideNavProvider'

function App() {
  return (
    <AuthProvider>
      <SideNavProvider>
        <AppRoutes />
      </SideNavProvider>
    </AuthProvider>
  )
}

export default App
