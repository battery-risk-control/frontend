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
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { PageSectionDots } from '../../../components/ui/PageSectionDots/PageSectionDots'
import { KpiSummaryPanel } from '../components/KpiSummaryPanel'
import { MaterialRiskOverviewSection } from '../components/MaterialRiskOverviewSection'
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

// alerts-heading(우측 알림 패널)은 항상 뷰포트 밖으로 스크롤되지 않는 별도 영역이라 제외.
const SECTION_DOTS_SECTIONS = [
  { id: '상단 KPI 요약', headingId: 'kpi-summary-heading' },
  { id: '원자재 리스크 요약', headingId: 'material-risk-summary-heading' },
  { id: '글로벌 리스크 맵', headingId: 'global-risk-board-heading' },
  { id: '수입 의존도', headingId: 'import-dependency-heading' },
  { id: '원자재 가격 추이', headingId: 'material-price-detail-heading' },
  { id: '원자재 공급사 리스크 현황', headingId: 'material-risk-heading' },
  { id: 'ERP 영향', headingId: 'erp-impact-heading' },
  { id: '구매 대응 우선순위', headingId: 'purchase-priority-heading' },
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
        <SideNavToggleButton />
        <SideNav items={SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <h1 className={styles.heading}>구매팀 대시보드</h1>
          <KpiSummaryPanel events={events} />
          <MaterialRiskOverviewSection gauges={gauges} scoreCards={scoreCards} />
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
        <PageSectionDots variant="withAside" sections={SECTION_DOTS_SECTIONS} />
        <AlertsPanel events={events} />
      </div>
      <Footer />
    </div>
  )
}
