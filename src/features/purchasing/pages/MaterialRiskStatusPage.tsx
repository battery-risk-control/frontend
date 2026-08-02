import { fetchRiskEvents } from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { Breadcrumb } from '../../../components/layout/Breadcrumb'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { MaterialRiskStatusPanel } from '../components/MaterialRiskStatusPanel'
import styles from './PurchasingSubPage.module.css'

/**
 * 원자재 공급사 리스크 현황 (Seq 24 하위 화면). Phase 11(2026-07-29)에서 본문에서 제거된
 * `MaterialRiskStatusPanel`을 SideNav 실제 라우트로 연결한다(그동안 컴포넌트 파일만 남고
 * 어디에도 렌더링되지 않던 상태 — 2026-08-02, C3 부분 해결).
 */
export function MaterialRiskStatusPage() {
  const events = fetchRiskEvents()

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <Breadcrumb items={[{ label: '구매팀 대시보드', href: '/purchasing' }, { label: '원자재 공급사 리스크 현황' }]} />
          <h1 className={styles.heading}>원자재 공급사 리스크 현황</h1>
          <MaterialRiskStatusPanel events={events} />
        </main>
      </div>
      <Footer />
    </div>
  )
}
