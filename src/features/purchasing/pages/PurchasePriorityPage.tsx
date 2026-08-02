import { fetchRiskEvents } from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { Breadcrumb } from '../../../components/layout/Breadcrumb'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { PurchasePriorityPanel } from '../components/PurchasePriorityPanel'
import styles from './PurchasingSubPage.module.css'

/**
 * 구매 대응 우선순위 (Seq 24 하위 화면). Phase 11(2026-07-29)에서 본문에서 제거된
 * `PurchasePriorityPanel`을 SideNav 실제 라우트로 연결한다 — 이 항목은 그때 SideNav
 * 메뉴 자체에서도 빠져 있었으므로 이번에 `PURCHASING_SIDE_NAV_ITEMS`에 신규 추가했다
 * (2026-08-02, C3 부분 해결).
 */
export function PurchasePriorityPage() {
  const events = fetchRiskEvents()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <Breadcrumb items={[{ label: '구매팀 대시보드', href: '/purchasing' }, { label: '구매 대응 우선순위' }]} />
          <h1 className={styles.heading}>구매 대응 우선순위</h1>
          <PurchasePriorityPanel events={events} />
        </main>
      </div>
      <Footer />
    </div>
  )
}
