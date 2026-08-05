import {
  useState,
} from 'react'
import {
  GlobalRiskBoard,
  type SelectedDetail,
} from '../../../components/widgets/GlobalRiskBoard'
import {
  ExecutiveKpiPanel,
} from '../components/ExecutiveKpiPanel'
import {
  ExecutivePageLayout,
} from '../components/ExecutivePageLayout'
import {
  ExecutiveRiskDetailPanel,
} from '../components/ExecutiveRiskDetailPanel'
import {
  useExecutiveDashboard,
} from '../useExecutiveDashboard'
import styles from './ExecutiveDashboardPage.module.css'

const MAP_HEIGHT = 390

export function ExecutiveDashboardPage() {
  const {
    dashboard,
    loading,
    errorMessage,
  } = useExecutiveDashboard()

  const [
    selectedDetail,
    setSelectedDetail,
  ] = useState<SelectedDetail | null>(
    null,
  )

  return (
    <ExecutivePageLayout
      title="경영진 공급망 위험 대시보드"
      description={
        'ERP·RAG·멀티에이전트 분석 결과를 경영진 관점으로 요약합니다.'
      }
      alertCount={
        dashboard?.verification_summary
          .review_required_count ?? 0
      }
      aside={
        <ExecutiveRiskDetailPanel
          selectedDetail={
            selectedDetail
          }
          onClear={() => {
            setSelectedDetail(null)
          }}
        />
      }
    >
      {loading && (
        <PageMessage
          title="대시보드 불러오는 중"
          message={
            '최신 공급망 위험 정보를 조회하고 있습니다.'
          }
        />
      )}

      {!loading &&
        errorMessage && (
          <PageMessage
            title={
              '대시보드를 불러오지 못했습니다'
            }
            message={errorMessage}
            tone="error"
          />
        )}

      {!loading &&
        !errorMessage &&
        dashboard && (
          <>
            <ExecutiveKpiPanel
              kpi={dashboard.kpi}
            />

            <section
              className={
                styles.mapSection
              }
              aria-label={
                '글로벌 위험 지도'
              }
            >
              <GlobalRiskBoard
                items={
                  dashboard.risk_map
                }
                mapHeight={MAP_HEIGHT}
                onSelect={
                  setSelectedDetail
                }
              />
            </section>
          </>
        )}
    </ExecutivePageLayout>
  )
}

function PageMessage({
  title,
  message,
  tone = 'neutral',
}: {
  title: string
  message: string
  tone?: 'neutral' | 'error'
}) {
  return (
    <section
      className={`${styles.message} ${
        tone === 'error'
          ? styles.errorMessage
          : ''
      }`}
    >
      <strong>
        {title}
      </strong>

      <p>
        {message}
      </p>
    </section>
  )
}
