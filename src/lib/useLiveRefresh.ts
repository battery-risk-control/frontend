import { useEffect, useState } from 'react'

/** 백엔드 수집 주기보다 촘촘하게 화면을 갱신하는 근실시간 조회 주기. */
export const LIVE_REFRESH_INTERVAL_MS = 60_000

/** 화면이 보이는 동안 주기적으로, 탭 복귀 시에는 즉시 갱신 신호를 만든다. */
export function useLiveRefresh(intervalMs = LIVE_REFRESH_INTERVAL_MS) {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setRefreshKey((key) => key + 1)
      }
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    const timer = window.setInterval(refresh, intervalMs)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs])

  return refreshKey
}
