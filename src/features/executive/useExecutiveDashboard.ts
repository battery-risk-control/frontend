import {
  useEffect,
  useState,
} from 'react'
import {
  fetchExecutiveOverview,
} from '../../api/executive.api'
import type {
  ExecutiveOverviewResponse,
} from '../../api/executive.types'
import {
  useAuthState,
} from '../../lib/useAuthState'

export interface ExecutiveDashboardState {
  dashboard: ExecutiveOverviewResponse | null
  loading: boolean
  errorMessage: string | null
}

/**
 * 3계층 경영진 페이지에서 공통으로 사용하는
 * 실제 대시보드 API 조회 Hook.
 */
export function useExecutiveDashboard():
  ExecutiveDashboardState {
  const {
    accessToken,
  } = useAuthState()

  const [
    dashboard,
    setDashboard,
  ] = useState<ExecutiveOverviewResponse | null>(
    null,
  )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      if (!accessToken) {
        if (active) {
          setDashboard(null)
          setErrorMessage(
            '경영진 데이터를 조회하려면 로그인이 필요합니다.',
          )
          setLoading(false)
        }

        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const result =
          await fetchExecutiveOverview(
            accessToken,
          )

        if (!active) {
          return
        }

        if ('error' in result) {
          setDashboard(null)
          setErrorMessage(
            result.message,
          )
          return
        }

        setDashboard(result)
      } catch (error) {
        if (!active) {
          return
        }

        setDashboard(null)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : '경영진 데이터를 불러오지 못했습니다.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [
    accessToken,
  ])

  return {
    dashboard,
    loading,
    errorMessage,
  }
}