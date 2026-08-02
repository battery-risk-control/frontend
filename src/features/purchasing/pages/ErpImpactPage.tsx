import { fetchRiskEvents } from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { Breadcrumb } from '../../../components/layout/Breadcrumb'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { ErpImpactPanel } from '../components/ErpImpactPanel'
import styles from './PurchasingSubPage.module.css'

/**
 * ERP 영향 자재 재고 계약 분석 (Seq 24 하위 화면). Phase 11(2026-07-29)에서 본문에서
 * 제거된 `ErpImpactPanel`을 SideNav 실제 라우트로 연결한다(2026-08-02, C3 부분 해결).
 */
export function ErpImpactPage() {
  const events = fetchRiskEvents()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <Breadcrumb items={[{ label: '구매팀 대시보드', href: '/purchasing' }, { label: 'ERP 영향' }]} />
          <h1 className={styles.heading}>ERP 영향 자재 재고 계약 분석</h1>
          <ErpImpactPanel events={events} />
        </main>
      </div>
      <Footer />
    </div>
  )
}
