import { useEffect, useState } from 'react'

/** 백엔드 수집 주기보다 촘촘하게 화면을 갱신하는 근실시간 조회 주기. 뉴스처럼 자주 변하는 데이터용. */
export const LIVE_REFRESH_INTERVAL_MS = 60_000

/**
 * 천천히 변하는 데이터(지도·수입의존도·환율·가격·브리핑 요약)용 폴링 주기. 원천 갱신이
 * 드물어(환율 하루 2회, 가격 15분 간격, 지도는 분석 파이프라인) 60초 폴링은 서버 부하만 만든다.
 * 탭 복귀 시 즉시 갱신은 주기와 무관하게 동작하므로(아래 focus 리스너) 화면 복귀 신선도는 같다.
 * [ROLLBACK] 이 상수를 쓰는 호출부를 기본 주기(60초)로 되돌리면 끝.
 */
export const LIVE_REFRESH_SLOW_INTERVAL_MS = 300_000

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
