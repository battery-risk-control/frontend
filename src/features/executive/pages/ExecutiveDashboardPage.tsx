import {
  useState,
} from 'react'
import type { AiBriefingDetail, NewsFeedItem, SelectedArticle } from '../../../api/types'
import { useEffect } from 'react'
import { fetchPublicNewsFeed } from '../../../api/public.api'
import { fromNewsFeedItem } from '../../../lib/selectedArticle'
import { LatestNewsPanel } from '../../purchasing/components/LatestNewsPanel'
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
  ExecutivePriorityAlert,
} from '../components/ExecutivePriorityAlert'
import {
  ExecutiveRiskDetailPanel,
} from '../components/ExecutiveRiskDetailPanel'
import { ExecutiveEvidencePanel, type EvidenceTab } from '../components/ExecutiveEvidencePanel'
import { ExecutiveNewsDetail } from '../components/ExecutiveNewsDetail'
import {
  useExecutiveDashboard,
} from '../useExecutiveDashboard'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import styles from './ExecutiveDashboardPage.module.css'

// 구매팀 대시보드와 동일한 공용 지도 기본 높이.
const MAP_HEIGHT = 220

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
  const evidence = useExecutiveEvidence()
  const [selectedEvidence, setSelectedEvidence] = useState<AiBriefingDetail | null>(null)
  const [evidenceTab, setEvidenceTab] = useState<EvidenceTab>('summary')
  const [news, setNews] = useState<NewsFeedItem[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState<SelectedArticle | null>(null)

  useEffect(() => {
    let active = true
    fetchPublicNewsFeed(5, 0)
      .then((items) => { if (active) setNews(items) })
      .finally(() => { if (active) setNewsLoading(false) })
    return () => { active = false }
  }, [])

  function openEvidence(item: AiBriefingDetail | undefined) {
    if (!item) return
    setSelectedDetail(null)
    setSelectedNews(null)
    setSelectedEvidence(item)
    setEvidenceTab('summary')
  }

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
      detailKey={selectedNews?.id ?? selectedEvidence?.briefing_id ?? selectedDetail?.label ?? null}
      aside={
        selectedNews ? <ExecutiveNewsDetail article={selectedNews} /> : selectedEvidence ? <ExecutiveEvidencePanel item={selectedEvidence} tab={evidenceTab} onTabChange={setEvidenceTab} /> : <ExecutiveRiskDetailPanel
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

            <ExecutivePriorityAlert
              risk={dashboard.top_risks[0]}
              reviewRequiredCount={
                dashboard.verification_summary
                  .review_required_count
              }
              onClick={() => openEvidence(evidence.items[0])}
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
                  (detail) => {
                    setSelectedEvidence(null)
                    setSelectedNews(null)
                    setSelectedDetail(detail)
                  }
                }
              />
            </section>

            <LatestNewsPanel
              items={news}
              isLoading={newsLoading}
              selectedId={selectedNews?.id}
              onSelect={(item) => {
                setSelectedEvidence(null)
                setSelectedDetail(null)
                setSelectedNews(fromNewsFeedItem(item))
              }}
              page={0}
              pageSize={5}
              total={news.length}
              onPageChange={() => undefined}
            />
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
