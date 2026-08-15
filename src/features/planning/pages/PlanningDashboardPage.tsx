import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPublicNewsFeed, fetchPublicNewsFeedCount } from '../../../api/public.api'
import { Header } from '../../../components/layout/Header'
import { AlertsBellButton } from '../../../components/layout/AlertsBellButton'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { DashboardSidePanel } from '../../purchasing/components/DashboardSidePanel'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { ExecutiveKpiPanel } from '../../executive/components/ExecutiveKpiPanel'
import { useExecutiveDashboard } from '../../executive/useExecutiveDashboard'
import { ComparisonChart } from '../components/ComparisonChart'
import { VendorRiskHistory } from '../components/VendorRiskHistory'
import { RankedBarChart } from '../components/RankedBarChart'
import { QueryState } from '../components/QueryState'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { useAiBriefing, useStrategyDashboard, useGlobalRiskBoard } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import { useAlertsPanelState } from '../../../lib/useAlertsPanelState'
import { fromNewsFeedItem, fromRiskBoardItem } from '../../../lib/selectedArticle'
import { formatAsOf } from '../../../lib/formatAsOf'
import { useLiveRefresh } from '../../../lib/useLiveRefresh'
import { LatestNewsPanel } from '../../purchasing/components/LatestNewsPanel'
import type { NewsFeedItem, SelectedArticle } from '../../../api/types'
import styles from './PlanningDashboardPage.module.css'

const ALL_UNITS = '전체'
const NEWS_PAGE_SIZE = 5

/**
 * 2계층 경영기획팀 대시보드 (Seq 25) — "전략 대시보드" 탭. Figma "경영기획팀 대시보드" 프레임
 * 기준으로 좌측 사이드바(7탭 공용, `PLANNING_SIDE_NAV_ITEMS`) + 단일 컬럼(KPI 요약 카드 →
 * 핵심 시각화 및 비교 → 협력사 리스크 이력 및 탐색) 구조를 따른다.
 */
export function PlanningDashboardPage() {
  const query = useStrategyDashboard()
  // 경영기획팀 화면 상단에 경영진 대시보드의 "핵심 위험 요약" 카드를 함께 노출한다.
  const executive = useExecutiveDashboard()
  const mapQuery = useGlobalRiskBoard()
  const briefingQuery = useAiBriefing(0)
  const liveRefreshKey = useLiveRefresh()
  const [selectedUnit] = useState(ALL_UNITS)
  const [selectedNews, setSelectedNews] = useState<SelectedArticle | null>(null)
  const [selectedNewsItems, setSelectedNewsItems] = useState<SelectedArticle[]>([])
  const [newsItems, setNewsItems] = useState<NewsFeedItem[]>([])
  const [newsPage, setNewsPage] = useState(0)
  const [newsTotal, setNewsTotal] = useState(0)
  const [newsLoading, setNewsLoading] = useState(true)
  const newsQueryKey = `${newsPage}|${liveRefreshKey}`
  const [previousNewsQueryKey, setPreviousNewsQueryKey] = useState(newsQueryKey)
  if (newsQueryKey !== previousNewsQueryKey) {
    setPreviousNewsQueryKey(newsQueryKey)
    setNewsLoading(true)
  }

  const { expanded: alertsExpanded, open: openAlertsPanel } = useAlertsPanelState()

  // 헤더 알림 벨(다른 계층과 동일하게 노출). 누르면 우측 패널을 열고 "주요 알림" 탭으로 옮긴다
  // — 구매팀과 같은 focusAlertsToken 방식(토큰 증가 → DashboardSidePanel이 탭 전환)이다.
  // 경영기획 대시보드는 자체 알림 목록이 없어(alerts=[]) 배지 숫자는 뜨지 않고 아이콘만 보인다.
  const [alertsFocusToken, setAlertsFocusToken] = useState(0)
  const handleOpenAlerts = useCallback(() => {
    openAlertsPanel()
    setAlertsFocusToken((previous) => previous + 1)
  }, [openAlertsPanel])

  const handleSelectArticle = useCallback(
    (article: SelectedArticle) => {
      setSelectedNews(article)
      setSelectedNewsItems([article])
      openAlertsPanel()
    },
    [openAlertsPanel]
  )

  const filteredExposure = useMemo(() => {
    if (!query.data) return []
    if (selectedUnit === ALL_UNITS) return query.data.risk_exposure_by_unit
    return query.data.risk_exposure_by_unit.filter((item) => item.business_unit === selectedUnit)
  }, [query.data, selectedUnit])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchPublicNewsFeed(NEWS_PAGE_SIZE, newsPage * NEWS_PAGE_SIZE),
      fetchPublicNewsFeedCount(),
    ])
      .then(([items, total]) => {
        if (cancelled) return
        setNewsItems(items)
        setNewsTotal(total)
      })
      .catch((error) => console.error('경영기획 최신 뉴스 조회 실패', error))
      .finally(() => {
        if (!cancelled) setNewsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [liveRefreshKey, newsPage])

  return (
    <div className={styles.page}>
      <Header
        accountExtra={
          <AlertsBellButton
            count={0}
            onOpenAlerts={handleOpenAlerts}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        }
      />
      <div className={styles.body}>
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <header className={styles.topBar}>
            <div className={styles.titleGroup}>
              <h1 className={styles.heading}>경영기획팀 대시보드</h1>
              <span className={styles.staticUnitLabel}>사업부 전체</span>
            </div>
            {query.data?.as_of && (
              <time className={styles.asOf} dateTime={query.data.as_of}>
                {formatAsOf(query.data.as_of)} <span className={styles.asOfSuffix}>기준</span>
              </time>
            )}
          </header>
          {executive.dashboard && (
            <ExecutiveKpiPanel
              kpi={executive.dashboard.kpi}
              topRiskScore={executive.dashboard.top_risks[0]?.score}
            />
          )}
          <QueryState query={query}>
            {(dashboard) => <KpiSummaryCards items={dashboard.kpi_summary} />}
          </QueryState>
          <section className={styles.planningOverview} aria-labelledby="planning-overview-heading">
            <div className={styles.quickLinkCard}>
              <h2 id="planning-overview-heading" className={styles.sectionHeading}>세부 분석 바로가기</h2>
              <div className={styles.quickLinkGrid}>
                <Link to="/planning/materials" className={styles.quickLink}>
                  <b>자재 위험</b><span>재고·노출도 상세</span>
                </Link>
                <Link to="/planning/import-dependency" className={styles.quickLink}>
                  <b>수입 의존도</b><span>국가·자재 집중도</span>
                </Link>
                <Link to="/planning/suppliers" className={styles.quickLink}>
                  <b>공급사 분석</b><span>협력사 위험 이력</span>
                </Link>
                <Link to="/planning/briefings" className={styles.quickLink}>
                  <b>AI 브리핑</b><span>사업부별 취합 보고</span>
                </Link>
              </div>
            </div>
            <QueryState query={briefingQuery}>
              {(briefing) => (
                <RankedBarChart title="사업부별 AI 브리핑 현황" items={briefing.by_unit} />
              )}
            </QueryState>
          </section>
          <QueryState query={mapQuery}>
            {(items) => (
              <GlobalRiskBoard
                items={items}
                onSelect={(detail) => {
                  if (!detail || detail.events.length === 0) return
                  const articles = detail.events.map(fromRiskBoardItem)
                  setSelectedNews(articles[0])
                  setSelectedNewsItems(articles)
                  openAlertsPanel()
                }}
              />
            )}
          </QueryState>
          <QueryState query={query}>
            {(dashboard) => (
              <>
                <ComparisonChart items={filteredExposure} />
                <VendorRiskHistory items={dashboard.vendor_risk_history} />
              </>
            )}
          </QueryState>
          <LatestNewsPanel
            items={newsItems}
            isLoading={newsLoading}
            selectedId={selectedNews?.id}
            onSelect={(item) => handleSelectArticle(fromNewsFeedItem(item))}
            page={newsPage}
            pageSize={NEWS_PAGE_SIZE}
            total={newsTotal}
            onPageChange={setNewsPage}
          />
        </main>
        <DashboardSidePanel
          selectedNews={selectedNews}
          selectedNewsItems={selectedNewsItems}
          isNewsLoading={newsLoading}
          alerts={[]}
          briefings={[]}
          expanded={alertsExpanded}
          focusAlertsToken={alertsFocusToken}
          isPreviewing={false}
          onPreviewMouseEnter={() => {}}
          onPreviewMouseLeave={() => {}}
          showUploadCard={false}
          // 경영기획팀엔 리스크 모니터링 화면이 없어 "전체 보기"·기사 브리핑 버튼을 모두
          // 경영기획팀 AI 브리핑(/planning/briefings)으로 보낸다(구매팀 전용 라우트로 넘어가
          // RequireAuth 계층 불일치 모달이 뜨던 문제 해소).
          alertsMoreTo="/planning/briefings"
          newsBriefingLabel="이 기사의 브리핑 확인"
          newsBriefingTo={() => '/planning/briefings'}
        />
      </div>
      <Footer />
    </div>
  )
}
