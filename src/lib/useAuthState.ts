import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './AuthContext'

/**
 * 사용 예:
 *   const { orgTier, signIn, signOut } = useAuthState()
 */
export function useAuthState(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthState는 AuthProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
