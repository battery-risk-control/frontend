import { useNavigate } from 'react-router-dom'
import {
  fetchAiRecommendations,
  fetchGlobalRiskBoard,
  fetchMaterialPriceSummaries,
  fetchMaterialPriceTrends,
  fetchNewsFeed,
} from '../../../api/public.api'
import { useAuthState } from '../../../lib/useAuthState'
import { Header } from '../../../components/layout/Header'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { AiPriorityList } from '../components/AiPriorityList'
import { MaterialPriceDetail } from '../../../components/widgets/MaterialPriceDetail'
import { SupplyNewsFeed } from '../components/SupplyNewsFeed'
import styles from './PublicDashboardPage.module.css'

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
 * 해서 "더 볼 콘텐츠가 있다"를 별도 안내 컴포넌트 없이 레이아웃만으로 전달한다(기존
 * IntersectionObserver 기반 `ScrollHint`를 대체 — 실험적, 전체 반응형 Phase 전까지의 임시
 * 대응이라는 점은 동일).
 */
export function PublicDashboardPage() {
  const navigate = useNavigate()
  const { orgTier } = useAuthState()
  const riskBoardItems = fetchGlobalRiskBoard()
  const recommendations = fetchAiRecommendations()
  const priceSeries = fetchMaterialPriceTrends()
  const priceSummaries = fetchMaterialPriceSummaries()
  const newsItems = fetchNewsFeed()

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
      <main id="main-content" className={styles.grid}>
        <GlobalRiskBoard items={riskBoardItems} />
        <AiPriorityList recommendations={recommendations} />
        <MaterialPriceDetail series={priceSeries} summaries={priceSummaries} />
        <SupplyNewsFeed items={newsItems} />
      </main>
    </div>
  )
}
