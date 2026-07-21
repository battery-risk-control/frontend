import { fetchRiskEvents } from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { KpiSummaryPanel } from '../components/KpiSummaryPanel'
import { MaterialRiskStatusPanel } from '../components/MaterialRiskStatusPanel'
import { ErpImpactPanel } from '../components/ErpImpactPanel'
import { PurchasePriorityPanel } from '../components/PurchasePriorityPanel'
import { AlertsPanel } from '../components/AlertsPanel'
import styles from './PurchasingDashboardPage.module.css'

const SIDE_NAV_ITEMS = [
  { label: '리스크 현황판', href: '#risk-board' },
  { label: '브리핑 자료', href: '#briefing' },
]

/**
 * 1계층 구매팀 대시보드 (Seq 24). Figma '구매팀 대시보드' 프레임 기준으로
 * 좌측 사이드바 + 단일 컬럼 4단 패널 + 우측 알림 패널 구조를 따른다.
 */
export function PurchasingDashboardPage() {
  const events = fetchRiskEvents()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <h1 className={styles.heading}>구매팀 대시보드</h1>
          <KpiSummaryPanel events={events} />
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
