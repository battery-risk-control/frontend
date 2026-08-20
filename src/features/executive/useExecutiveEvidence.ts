import { useEffect, useState } from 'react'
import { fetchRecentAiBriefingDetails } from '../../api/aiBriefing.api'
import type { AiBriefingDetail } from '../../api/types'
import { useAuthState } from '../../lib/useAuthState'
import { useLiveRefresh } from '../../lib/useLiveRefresh'

/**
 * 경영진 첫 화면에서 한 번에 읽는 최근 브리핑 수.
 * 목록 전체를 순회한 뒤 모든 상세를 다시 호출하면 데이터 증가에 따라 요청 수가 무한히
 * 늘어나므로, 화면에서 실제로 검토 가능한 최근 20건으로 조회 범위를 고정한다.
 */
const BRIEFING_PAGE_SIZE = 20

export function useExecutiveEvidence() {
  const { accessToken } = useAuthState()
  const liveRefreshKey = useLiveRefresh()
  const [items, setItems] = useState<AiBriefingDetail[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!accessToken) {
        setLoading(false)
        setErrorMessage('로그인 정보가 없어 상세 근거를 조회할 수 없습니다.')
        return
      }

      try {
        setLoading(true)
        // 상세 20건을 한 번에 받는다(개별 fetchAiBriefing × 20 = N+1 제거). 반환 데이터는 이전과
        // 동일한 AiBriefingDetail[]이라 소비 화면 동작은 그대로다. 정렬(점수 desc)도 그대로 유지.
        const page = await fetchRecentAiBriefingDetails(accessToken, {
          page: 0,
          size: BRIEFING_PAGE_SIZE,
        })
        if (active) {
          setItems([...page.content].sort(compareBriefings))
          setTotalCount(page.total_elements)
          setErrorMessage(null)
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : '상세 근거 조회에 실패했습니다.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [accessToken, liveRefreshKey])

  return { items, totalCount, loading, errorMessage }
}

/** 경영진 화면은 최근 생성 순서보다 종합 위험 점수가 높은 검증 결과를 먼저 보여준다. */
function compareBriefings(left: AiBriefingDetail, right: AiBriefingDetail) {
  const scoreDifference = right.procurement_risk_score - left.procurement_risk_score
  if (scoreDifference !== 0) return scoreDifference

  return Date.parse(right.created_at) - Date.parse(left.created_at)
}
