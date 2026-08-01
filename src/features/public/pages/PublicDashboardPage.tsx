import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchPublicAiRecommendations,
  fetchPublicExchangeRates,
  fetchPublicImportDependency,
  fetchPublicNewsFeed,
  fetchPublicPriceSummaries,
  fetchPublicPriceTrends,
  fetchPublicRiskBoard,
} from '../../../api/public.api'
import type {
  AiRecommendation,
  ExchangeRateBoard,
  GlobalRiskBoardItem,
  ImportDependencyData,
  MaterialPriceSeries,
  MaterialPriceSummary,
  NewsFeedItem,
} from '../../../api/types'
import { useAuthState } from '../../../lib/useAuthState'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { AiPriorityList } from '../components/AiPriorityList'
import { ExchangeRateBand } from '../components/ExchangeRateBand'
import { MaterialPriceTrendCard } from '../components/MaterialPriceTrendCard'
import { ImportDependencyPanel } from '../../purchasing/components/ImportDependencyPanel'
import { MaterialPriceDetail } from '../../../components/widgets/MaterialPriceDetail'
import { DEFAULT_PERIOD, PERIOD_DAYS } from '../../../lib/materialPricePeriods'
import { SupplyNewsFeed } from '../components/SupplyNewsFeed'
import styles from './PublicDashboardPage.module.css'

/** 컴팩트 카드가 보여줄 구간(일). 목업의 x축(07/25~07/31)에 맞춘 한 주다. */
const TREND_CARD_DAYS = 7

/**
 * 컴팩트 카드가 대표로 보여줄 자재. 목업 기준이며, 데이터에 없으면 첫 자재로 넘어간다 —
 * 백엔드 자재 구성이 바뀌어도 카드가 빈 채로 남지 않게 한다.
 */
const TREND_CARD_MATERIAL = '코발트'

const TIER_TABS = [
  { label: '구매팀', path: '/purchasing' },
  { label: '경영기획팀', path: '/planning' },
  { label: '경영진', path: '/executive' },
]

/**
 * 비로그인 공개 대시보드 (Seq 23). Figma 공개 대시보드 프레임 기준 —
 * 상단 3계층 탭 + 로그인/회원가입 버튼, 4개 패널 2x2 그리드(760px 미만에서는 1열 4행으로
 * 전환 — 실험적 브레이크포인트, 전체 앱 반응형 Phase 전까지의 임시 대응).
 * 상단 탭 클릭 시 로그인 상태가 있으면 해당 계층 대시보드로, 없으면 /auth로 이동한다.
 * 그리드를 뷰포트 높이보다 살짝 낮게 제한(컷오프)해 다음 행이 하단에 일부 잘려 보이도록
 * 해서 "더 볼 콘텐츠가 있다"를 별도 안내 컴포넌트 없이 레이아웃만으로 전달한다 — 섹션이
 * 적고 간소한 화면에 쓰는 페이지 레벨 콘텐츠 신호(`docs/design-tokens.md` "카드 레이아웃·
 * 스크롤 규칙" a 참고, 폐기된 IntersectionObserver 기반 `ScrollHint`를 대체). 실험적,
 * 전체 반응형 Phase 전까지의 임시 대응이라는 점은 동일.
 *
 * 4개 패널 전부 실 API(②/③단계) 또는 mock(①단계)을 비동기 조회한다 — `fetchPublicRiskBoard`,
 * `fetchPublicAiRecommendations`, `fetchPublicNewsFeed`, `fetchPublicPriceTrends`,
 * `fetchPublicPriceSummaries`. 백엔드에서 지도와 권고 리스트는 같은 분석 집합을, 가격 차트와 요약
 * 카드는 같은 가격 구간을 공유하므로 짝지어진 화면이 서로 어긋나지 않는다. 뉴스 속보만 분석 이전의
 * 수집 원본이라 별개 집합이다.
 * 로딩 중에는 최소 텍스트만 표시(정식 스켈레톤 UI는 Phase 10.2, 미착수).
 */
export function PublicDashboardPage() {
  const navigate = useNavigate()
  const { orgTier } = useAuthState()
  const [riskBoardItems, setRiskBoardItems] = useState<GlobalRiskBoardItem[]>([])
  const [riskBoardLoading, setRiskBoardLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([])
  const [newsItems, setNewsItems] = useState<NewsFeedItem[]>([])
  const [priceSeries, setPriceSeries] = useState<MaterialPriceSeries[]>([])
  const [priceSummaries, setPriceSummaries] = useState<MaterialPriceSummary[]>([])
  // 컴팩트 카드는 최근 7일만 본다. 30일 응답을 잘라 쓰지 않고 따로 조회하는 이유는 지수 기준일이
  // 구간에 종속되기 때문이다 — 30일 응답을 7일로 자르면 첫 점이 100이 아니라 105쯤에서 시작해
  // "기준일=100" 표기와 화면이 어긋난다.
  const [trendCardSeries, setTrendCardSeries] = useState<MaterialPriceSeries[]>([])
  // 기간 탭 상태는 페이지가 소유한다 — 탭이 바뀌면 차트와 요약 카드를 같은 days로 함께 다시
  // 불러야 하고, 그 조회는 이 페이지의 책임이기 때문이다.
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const [importDependency, setImportDependency] = useState<ImportDependencyData>({
    total: 0,
    breakdown: [],
  })
  // 초기값을 빈 밴드로 둬서, 조회 전·실패 시 모두 ExchangeRateBand의 빈 상태 분기로 수렴한다.
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateBoard>({
    rate_date: null,
    base_currency: 'KRW',
    rates: [],
  })

  // useQuery(TanStack Query) 대신 useState/useEffect로 최소 구현 — 이 화면이 최초의 실제
  // 비동기 API 연동이라 QueryClientProvider 도입 여부를 별도로 확정하기 전까지는 이렇게
  // 둔다(docs/roadmap-candidates.md C11 참고). ①단계(mock)에서는 fetchPublicRiskBoard가
  // 동기 mock을 그대로 Promise로 감싸 반환하므로 로딩 상태가 사실상 즉시 끝난다.
  // 두 조회는 서로 독립적으로 처리한다 — 한쪽이 실패해도 다른 패널은 그대로 그려야 하기 때문이다.
  useEffect(() => {
    let cancelled = false
    fetchPublicRiskBoard()
      .then((items) => {
        if (!cancelled) setRiskBoardItems(items)
      })
      .catch((err) => {
        console.error('공개 리스크 지도 조회 실패', err)
      })
      .finally(() => {
        if (!cancelled) setRiskBoardLoading(false)
      })
    fetchPublicAiRecommendations()
      .then((items) => {
        if (!cancelled) setRecommendations(items)
      })
      .catch((err) => {
        console.error('공개 권고 조치 리스트 조회 실패', err)
      })
    fetchPublicNewsFeed()
      .then((items) => {
        if (!cancelled) setNewsItems(items)
      })
      .catch((err) => {
        console.error('공개 뉴스 속보 조회 실패', err)
      })
    fetchPublicPriceTrends(TREND_CARD_DAYS)
      .then((series) => {
        if (!cancelled) setTrendCardSeries(series)
      })
      .catch((err) => {
        console.error('공개 원자재 가격 추이(단기) 조회 실패', err)
      })
    fetchPublicImportDependency()
      .then((data) => {
        if (!cancelled) setImportDependency(data)
      })
      .catch((err) => {
        console.error('공개 수입 의존도 조회 실패', err)
      })
    // 환율은 다른 패널과 원천이 완전히 다르다(한국수출입은행 고시환율). 실패해도 나머지 패널은
    // 그대로 그려야 하므로 다른 조회와 마찬가지로 분리한다.
    fetchPublicExchangeRates()
      .then((board) => {
        if (!cancelled) setExchangeRates(board)
      })
      .catch((err) => {
        console.error('공개 환율 조회 실패', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 가격 차트·요약 카드만 기간 탭에 반응한다. 위 마운트 훅과 분리한 이유는 지도·뉴스·환율까지
  // 탭을 누를 때마다 다시 부를 이유가 없어서다.
  //
  // 둘을 반드시 **같은 days로** 부른다 — 백엔드가 "같은 구간에서 파생"을 전제로 만들어져 있어,
  // 한쪽만 기간이 바뀌면 차트는 6개월인데 요약 카드는 1개월 등락을 말하는 상태가 된다.
  useEffect(() => {
    let cancelled = false
    const days = PERIOD_DAYS[period]
    fetchPublicPriceTrends(days)
      .then((series) => {
        if (!cancelled) setPriceSeries(series)
      })
      .catch((err) => {
        console.error('공개 원자재 가격 추이 조회 실패', err)
      })
    fetchPublicPriceSummaries(days)
      .then((summaries) => {
        if (!cancelled) setPriceSummaries(summaries)
      })
      .catch((err) => {
        console.error('공개 원자재 요약 카드 조회 실패', err)
      })
    return () => {
      cancelled = true
    }
  }, [period])

  function handleTierTabClick(path: string) {
    navigate(orgTier ? path : '/auth')
  }

  return (
    <div className={styles.page}>
      <Header>
        <div className={styles.tierTabs}>
          {TIER_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={styles.tierTab}
              onClick={() => handleTierTabClick(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Header>
      {/* 기획서 ②번 줄. 지도(③) 위에 놓이는 가로 띠라 4패널 그리드 바깥에 둔다 —
          뉴스속보 마퀴가 붙으면 이 줄을 좌우로 나눠 쓰게 된다(마퀴 미구현). */}
      <div className={styles.band}>
        <ExchangeRateBand rateDate={exchangeRates.rate_date} rates={exchangeRates.rates} />
      </div>
      <main id="main-content" className={styles.grid}>
        {riskBoardLoading ? (
          <div className={styles.riskBoardLoading}>지도 데이터를 불러오는 중입니다…</div>
        ) : (
          <GlobalRiskBoard items={riskBoardItems} />
        )}
        <AiPriorityList recommendations={recommendations} />
        <MaterialPriceDetail
          series={priceSeries}
          summaries={priceSummaries}
          period={period}
          onPeriodChange={setPeriod}
        />
        <SupplyNewsFeed items={newsItems} />
        {/* 기획서 ④번 행(수입 의존도 | 가격추이).
            비로그인 블러는 검증 편의를 위해 꺼둔 상태다. 되살리려면 blurred={!orgTier}로 바꾼다
            (ImportDependencyPanel의 blurred 처리는 그대로 살아 있다). 단, 블러는 시각적 구분일 뿐
            값은 응답에 그대로 담겨 있으므로 실제로 가리려면 백엔드에서 막아야 한다. */}
        <ImportDependencyPanel data={importDependency} />
        <MaterialPriceTrendCard
          series={
            trendCardSeries.find((s) => s.material === TREND_CARD_MATERIAL) ?? trendCardSeries[0]
          }
        />
      </main>
      {/* 기획서 ⑨번. 그리드 아래에 붙지만 컷오프 기법(.page의 height:100vh + .grid의 auto 행)을
          깨지 않는다 — 첫 화면에는 그리드 2행이 잘린 채로 보이고 footer는 스크롤 끝에 있다.
          외부 데이터 출처 표기 의무(ExchangeRate-API)가 여기서 충족된다. */}
      <Footer />
    </div>
  )
}
