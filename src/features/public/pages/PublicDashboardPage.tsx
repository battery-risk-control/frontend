import { Link, useNavigate } from 'react-router-dom'
import {
  fetchAiRecommendations,
  fetchGlobalRiskBoard,
  fetchMaterialPriceTrends,
  fetchNewsFeed,
} from '../../../api/public.api'
import { useAuthState } from '../../../lib/useAuthState'
import { GlobalRiskBoard } from '../components/GlobalRiskBoard'
import { AiPriorityList } from '../components/AiPriorityList'
import { MaterialPriceTrend } from '../components/MaterialPriceTrend'
import { SupplyNewsFeed } from '../components/SupplyNewsFeed'
import styles from './PublicDashboardPage.module.css'

const TIER_TABS = [
  { label: '구매팀', path: '/purchasing' },
  { label: '경영기획팀', path: '/planning' },
  { label: '경영진', path: '/executive' },
]

/**
 * 비로그인 공개 대시보드 (Seq 23). Figma 공개 대시보드 프레임 기준 —
 * 상단 3계층 탭 + 로그인/회원가입 버튼, 4개 패널 2x2 그리드.
 * 상단 탭 클릭 시 로그인 상태가 있으면 해당 계층 대시보드로, 없으면 /auth로 이동한다.
 */
export function PublicDashboardPage() {
  const navigate = useNavigate()
  const { orgTier } = useAuthState()
  const riskBoardItems = fetchGlobalRiskBoard()
  const recommendations = fetchAiRecommendations()
  const priceSeries = fetchMaterialPriceTrends()
  const newsItems = fetchNewsFeed()

  function handleTierTabClick(path: string) {
    navigate(orgTier ? path : '/auth')
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
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
        <Link to="/auth" className={styles.authButton}>
          로그인/회원가입
        </Link>
      </header>
      <main id="main-content" className={styles.grid}>
        <GlobalRiskBoard items={riskBoardItems} />
        <AiPriorityList recommendations={recommendations} />
        <MaterialPriceTrend series={priceSeries} />
        <SupplyNewsFeed items={newsItems} />
      </main>
    </div>
  )
}
