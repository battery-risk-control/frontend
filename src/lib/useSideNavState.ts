import { useContext } from 'react'
import { SideNavContext, type SideNavContextValue } from './SideNavContext'

/**
 * 사용 예:
 *   const { collapsed, toggle } = useSideNavState()
 */
export function useSideNavState(): SideNavContextValue {
  const context = useContext(SideNavContext)
  if (!context) {
    throw new Error('useSideNavState는 SideNavProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
