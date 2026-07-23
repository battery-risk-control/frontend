import {
  fetchGlobalRiskBoard,
  fetchImportDependency,
  fetchMaterialPriceSummaries,
  fetchMaterialPriceTrends,
  fetchMaterialRiskGauges,
  fetchRiskEvents,
  fetchScoreCards,
} from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { KpiSummaryPanel } from '../components/KpiSummaryPanel'
import { MaterialRiskOverviewRow } from '../components/MaterialRiskOverviewRow'
import { ImportDependencyRow } from '../components/ImportDependencyRow'
import { MaterialRiskStatusPanel } from '../components/MaterialRiskStatusPanel'
import { ErpImpactPanel } from '../components/ErpImpactPanel'
import { PurchasePriorityPanel } from '../components/PurchasePriorityPanel'
import { AlertsPanel } from '../components/AlertsPanel'
import styles from './PurchasingDashboardPage.module.css'

const SIDE_NAV_ITEMS = [
  { label: '리스크 현황판', href: '/purchasing#risk-board' },
  // 별도 목록 화면이 없어 대시보드 내 각 리스크 항목의 "브리핑 보기" 링크로 진입한다.
  // href는 SideNav의 React key 중복을 피하기 위해 /purchasing 뒤에 서로 다른 해시를 붙였다.
  { label: '브리핑 자료', href: '/purchasing#briefing' },
]

/**
 * 1계층 구매팀 대시보드 (Seq 24). Figma '구매팀 대시보드' 프레임 + 데모(화면ID UX-01-DB)
 * 요약 영역(5칸 게이지 그리드 → 지도 → 도넛+가격추이 2단, Phase 9.4 surin 이식)을 결합한 구조 —
 * 좌측 사이드바 + 단일 컬럼(요약 영역 3종 + 기존 4단 패널) + 우측 알림 패널.
 */
export function PurchasingDashboardPage() {
  const events = fetchRiskEvents()
  const gauges = fetchMaterialRiskGauges()
  const scoreCards = fetchScoreCards()
  const riskBoardItems = fetchGlobalRiskBoard()
  const importDependency = fetchImportDependency()
  const priceSeries = fetchMaterialPriceTrends()
  const priceSummaries = fetchMaterialPriceSummaries()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <h1 className={styles.heading}>구매팀 대시보드</h1>
          <KpiSummaryPanel events={events} />
          <MaterialRiskOverviewRow gauges={gauges} scoreCards={scoreCards} />
          <GlobalRiskBoard items={riskBoardItems} />
          <ImportDependencyRow
            importDependency={importDependency}
            priceSeries={priceSeries}
            priceSummaries={priceSummaries}
          />
          <MaterialRiskStatusPanel events={events} />
          <ErpImpactPanel events={events} />
          <PurchasePriorityPanel events={events} />
        </main>
        <AlertsPanel events={events} />
      </div>
      <Footer />
    </div>
  )
}
