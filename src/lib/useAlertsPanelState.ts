import { useContext } from 'react'
import { AlertsPanelContext, type AlertsPanelContextValue } from './AlertsPanelContext'

/**
 * 사용 예:
 *   const { expanded, toggle } = useAlertsPanelState()
 */
export function useAlertsPanelState(): AlertsPanelContextValue {
  const context = useContext(AlertsPanelContext)
  if (!context) {
    throw new Error('useAlertsPanelState는 AlertsPanelProvider 내부에서만 사용할 수 있습니다.')
  }
  return context
}
