import { useEffect, useState } from 'react'
import { fetchAiBriefing, fetchRecentAiBriefings } from '../../api/aiBriefing.api'
import type { AiBriefingDetail } from '../../api/types'
import { useAuthState } from '../../lib/useAuthState'

export function useExecutiveEvidence() {
  const { accessToken } = useAuthState()
  const [items, setItems] = useState<AiBriefingDetail[]>([])
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
        const page = await fetchRecentAiBriefings(accessToken, { page: 0, size: 10 })
        const details = await Promise.all(
          page.content.map((item) => fetchAiBriefing(accessToken, item.briefing_id)),
        )
        if (active) {
          setItems([...details].sort(compareBriefings))
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
  }, [accessToken])

  return { items, loading, errorMessage }
}

/** 경영진 화면은 최근 생성 순서보다 종합 위험 점수가 높은 검증 결과를 먼저 보여준다. */
function compareBriefings(left: AiBriefingDetail, right: AiBriefingDetail) {
  const scoreDifference = right.procurement_risk_score - left.procurement_risk_score
  if (scoreDifference !== 0) return scoreDifference

  return Date.parse(right.created_at) - Date.parse(left.created_at)
}
