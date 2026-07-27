import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAiRecommendations,
  fetchMaterialPriceSummaries,
  fetchMaterialPriceTrends,
  fetchNewsFeed,
  fetchPublicRiskBoard,
} from '../../../api/public.api'
import type { GlobalRiskBoardItem } from '../../../api/types'
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
 * 해서 "더 볼 콘텐츠가 있다"를 별도 안내 컴포넌트 없이 레이아웃만으로 전달한다 — 섹션이
 * 적고 간소한 화면에 쓰는 페이지 레벨 콘텐츠 신호(`docs/design-tokens.md` "카드 레이아웃·
 * 스크롤 규칙" a 참고, 폐기된 IntersectionObserver 기반 `ScrollHint`를 대체). 실험적,
 * 전체 반응형 Phase 전까지의 임시 대응이라는 점은 동일.
 *
 * 글로벌 리스크 관제 지도만 `fetchPublicRiskBoard()`로 실 API(`GET /api/v1/public/risk-board`,
 * ②/③단계) 또는 mock(①단계)을 비동기로 조회한다(2026-07-27) — 나머지 3개 패널은 아직 동기
 * mock 함수 그대로다. 로딩 중에는 최소 텍스트만 표시(정식 스켈레톤 UI는 Phase 10.2, 미착수).
 */
export function PublicDashboardPage() {
  const navigate = useNavigate()
  const { orgTier } = useAuthState()
  const [riskBoardItems, setRiskBoardItems] = useState<GlobalRiskBoardItem[]>([])
  const [riskBoardLoading, setRiskBoardLoading] = useState(true)
  const recommendations = fetchAiRecommendations()
  const priceSeries = fetchMaterialPriceTrends()
  const priceSummaries = fetchMaterialPriceSummaries()
  const newsItems = fetchNewsFeed()

  // useQuery(TanStack Query) 대신 useState/useEffect로 최소 구현 — 이 화면이 최초의 실제
  // 비동기 API 연동이라 QueryClientProvider 도입 여부를 별도로 확정하기 전까지는 이렇게
  // 둔다(docs/roadmap-candidates.md C11 참고). ①단계(mock)에서는 fetchPublicRiskBoard가
  // 동기 mock을 그대로 Promise로 감싸 반환하므로 로딩 상태가 사실상 즉시 끝난다.
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
    return () => {
      cancelled = true
    }
  }, [])

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
        {riskBoardLoading ? (
          <div className={styles.riskBoardLoading}>지도 데이터를 불러오는 중입니다…</div>
        ) : (
          <GlobalRiskBoard items={riskBoardItems} />
        )}
        <AiPriorityList recommendations={recommendations} />
        <MaterialPriceDetail series={priceSeries} summaries={priceSummaries} />
        <SupplyNewsFeed items={newsItems} />
      </main>
    </div>
  )
}
