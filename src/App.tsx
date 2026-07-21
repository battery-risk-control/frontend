import { AppRoutes } from './app/routes'
import { AuthProvider } from './lib/AuthProvider'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
