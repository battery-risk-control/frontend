import {
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { AiBriefingDetail, NewsFeedItem, SelectedArticle } from '../../../api/types'
import { useEffect } from 'react'
import { fetchPublicNewsFeed, fetchPublicNewsFeedCount } from '../../../api/public.api'
import { fetchAcknowledgedAssessments } from '../../../api/publicPurchasingDashboard.api'
import { useAuthState } from '../../../lib/useAuthState'
import { fromNewsFeedItem } from '../../../lib/selectedArticle'
import { LatestNewsPanel } from '../../purchasing/components/LatestNewsPanel'
import {
  GlobalRiskBoard,
  type SelectedDetail,
} from '../../../components/widgets/GlobalRiskBoard'
import {
  ExecutiveKpiPanel,
} from '../components/ExecutiveKpiPanel'
import { KpiSummaryCards } from '../../planning/components/KpiSummaryCards'
import { useStrategyDashboard } from '../../planning/hooks/usePlanningQueries'
import {
  ExecutivePageLayout,
} from '../components/ExecutivePageLayout'
import {
  ExecutivePriorityAlert,
} from '../components/ExecutivePriorityAlert'
import {
  ExecutiveDashboardSkeleton,
} from '../components/ExecutiveDashboardSkeleton'
import {
  ExecutiveRiskDetailPanel,
} from '../components/ExecutiveRiskDetailPanel'
import { ExecutiveEvidencePanel, type EvidenceTab } from '../components/ExecutiveEvidencePanel'
import { ExecutiveNewsDetail } from '../components/ExecutiveNewsDetail'
import {
  useExecutiveDashboard,
} from '../useExecutiveDashboard'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import { useLiveRefresh } from '../../../lib/useLiveRefresh'
import styles from './ExecutiveDashboardPage.module.css'

// 구매팀 대시보드와 동일한 공용 지도 기본 높이.
const MAP_HEIGHT = 220
const NEWS_FEED_PAGE_SIZE = 5

export function ExecutiveDashboardPage() {
  const navigate = useNavigate()
  const liveRefreshKey = useLiveRefresh()
  const { accessToken } = useAuthState()
  const {
    dashboard,
    loading,
    errorMessage,
  } = useExecutiveDashboard()
  // 확인 완료된 평가 id 집합. "우선 브리핑 점수"가 확인 완료된 평가에 연결된 브리핑을 우선
  // 대상에서 빼도록, 아래 priorityBriefing 선택에서 제외한다(2026-08-20). 자재 랭킹은 백엔드가
  // 이미 제외하지만, 우선 브리핑은 브리핑(ai_briefings) 소스라 여기서 걸러야 한다.
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set())
  // 경영진 화면에도 경영기획팀 "KPI 요약 카드"를 함께 노출하기 위해 2계층 전략 대시보드를 조회한다.
  const planningQuery = useStrategyDashboard()

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
  const [newsPage, setNewsPage] = useState(0)
  const [newsTotal, setNewsTotal] = useState(0)
  const [newsLoading, setNewsLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState<SelectedArticle | null>(null)
  // 첫 진입에서만 "최신 뉴스"를 상세 기본값으로 세팅했는지 표시한다. 라이브 새로고침(60초 + 창
  // 포커스/가시성 변화)마다 뉴스 목록을 다시 불러오는데, 그때도 기본 선택을 다시 걸면 사용자가
  // '대응 확인'으로 열어둔 근거/위험 상세(그 순간 selectedNews=null)를 최신 뉴스 상세로 덮어써
  // 버린다(2026-08-20 버그). 최초 1회만 기본 선택하고 이후 새로고침은 목록만 갱신한다.
  const didInitialNewsSelect = useRef(false)
  const [detailInteractionKey, setDetailInteractionKey] = useState<string | null>(null)
  const priorityBriefing = evidence.items.find(
    (item) => item.composite && item.verification.review_passed === true
      && !acknowledgedIds.has(item.assessment_id ?? ''),
  ) ?? evidence.items.find(
    (item) => item.composite && !acknowledgedIds.has(item.assessment_id ?? ''),
  )
  const selectedEvidenceNews = selectedEvidence
    ? news.find((item) => (
        item.risk_event_id === selectedEvidence.news_id
        || String(item.event_id ?? '') === selectedEvidence.news_id
        || item.headline_original === selectedEvidence.source_headline
      ))
    : undefined

  useEffect(() => {
    let active = true
    fetchAcknowledgedAssessments(accessToken, 50)
      .then((items) => {
        if (active) setAcknowledgedIds(new Set(items.map((item) => item.assessment_id)))
      })
      .catch((error) => console.error('경영진 확인 완료 목록 조회 실패', error))
    return () => { active = false }
  }, [accessToken, liveRefreshKey])

  useEffect(() => {
    let active = true
    fetchPublicNewsFeedCount()
      .then((total) => { if (active) setNewsTotal(total) })
      .catch((error) => console.error('경영진 뉴스 건수 조회 실패', error))
    return () => { active = false }
  }, [liveRefreshKey])

  useEffect(() => {
    let active = true
    fetchPublicNewsFeed(NEWS_FEED_PAGE_SIZE, newsPage * NEWS_FEED_PAGE_SIZE)
      .then((items) => {
        if (!active) return
        setNews(items)
        // 최초 1회만 최신 뉴스를 기본 상세로 연다. 이후 새로고침 틱에서는 사용자가 열어둔 상세를
        // 건드리지 않는다 — selectedNews=null(근거/위험 상세를 보는 중)을 최신 뉴스로 덮지 않도록.
        if (!didInitialNewsSelect.current && items[0]) {
          didInitialNewsSelect.current = true
          setSelectedNews((current) => current ?? fromNewsFeedItem(items[0]))
        }
      })
      .catch((error) => {
        console.error('경영진 뉴스 조회 실패', error)
        if (active) setNews([])
      })
      .finally(() => { if (active) setNewsLoading(false) })
    return () => { active = false }
  }, [liveRefreshKey, newsPage])

  function openEvidence(item: AiBriefingDetail | undefined) {
    if (!item) return
    setSelectedDetail(null)
    setSelectedNews(null)
    setSelectedEvidence(item)
    setEvidenceTab('summary')
    setDetailInteractionKey(item.briefing_id)
  }

  function changeNewsPage(page: number) {
    setNewsLoading(true)
    setNewsPage(page)
  }

  return (
    <ExecutivePageLayout
      title="경영진 대시보드"
      description={
        'ERP·RAG·멀티에이전트 분석 결과를 경영진 관점으로 요약합니다.'
      }
      alertCount={
        dashboard?.verification_summary
          .review_required_count ?? 0
      }
      asOf={dashboard?.as_of}
      detailKey={detailInteractionKey}
      aside={
        selectedNews ? <ExecutiveNewsDetail article={selectedNews} /> : selectedEvidence ? <ExecutiveEvidencePanel item={selectedEvidence} tab={evidenceTab} onTabChange={setEvidenceTab} sourceUrl={selectedEvidenceNews?.url} /> : <ExecutiveRiskDetailPanel
          selectedDetail={
            selectedDetail
          }
          onClear={() => {
            setSelectedDetail(null)
          }}
        />
      }
    >
      {loading && <ExecutiveDashboardSkeleton />}

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
              topRiskScore={priorityBriefing?.procurement_risk_score ?? dashboard.top_risks[0]?.score}
              topRiskLabel="우선 브리핑 점수"
            />

            {planningQuery.data && (
              <KpiSummaryCards items={planningQuery.data.kpi_summary} />
            )}

            <ExecutivePriorityAlert
              risk={dashboard.top_risks[0]}
              briefing={priorityBriefing}
              topCountry={dashboard.country_dependency[0]}
              alternativeSupplierCount={dashboard.alternative_suppliers.length}
              reviewRequiredCount={
                dashboard.verification_summary
                  .review_required_count
              }
              onOpenBriefing={() => openEvidence(priorityBriefing)}
              onOpenAlternatives={() => navigate('/executive/supply-chain')}
              onOpenReview={() => navigate('/executive/verification')}
              onOpenDecision={() => openEvidence(priorityBriefing)}
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
                    setDetailInteractionKey(detail?.label ?? null)
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
                setDetailInteractionKey(String(item.risk_event_id))
              }}
              page={newsPage}
              pageSize={NEWS_FEED_PAGE_SIZE}
              total={newsTotal}
              onPageChange={changeNewsPage}
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
