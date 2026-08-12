import type {
  ReactNode,
} from 'react'
import {
  Footer,
} from '../../../components/layout/Footer'
import {
  Header,
} from '../../../components/layout/Header'
import {
  AlertsBellButton,
} from '../../../components/layout/AlertsBellButton'
import {
  SideNav,
} from '../../../components/layout/SideNav'
import {
  SideNavToggleButton,
} from '../../../components/layout/SideNavToggleButton'
import {
  EXECUTIVE_SIDE_NAV_ITEMS,
} from '../../../lib/executiveNav'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { ExecutiveSidePanel } from './ExecutiveSidePanel'
import { formatAsOf } from '../../../lib/formatAsOf'
import styles from '../pages/ExecutiveDashboardPage.module.css'

interface ExecutivePageLayoutProps {
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
  alertCount?: number
  detailKey?: string | null
  asOf?: string | null
}

/**
 * 3계층 화면의 공통 골격.
 *
 * 헤더, 왼쪽 메뉴, 본문, 오른쪽 패널, 푸터를
 * 모든 경영진 페이지에서 동일하게 유지한다.
 */
export function ExecutivePageLayout({
  title,
  children,
  aside,
  alertCount = 0,
  detailKey = null,
  asOf = null,
}: ExecutivePageLayoutProps) {
  const [sideTab, setSideTab] = useState<'detail' | 'alerts'>('detail')
  const detailSectionRef = useRef<HTMLElement>(null)
  const detailExpanded = Boolean(detailKey)
  const asOfLabel = formatAsOf(asOf)

  useEffect(() => {
    if (detailKey) {
      requestAnimationFrame(() => detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }, [detailKey])

  return (
    <div className={styles.page}>
      <Header
        accountExtra={
          <AlertsBellButton
            count={alertCount}
            onOpenAlerts={() => {
              setSideTab('alerts')
            }}
            onMouseEnter={() => undefined}
            onMouseLeave={() => undefined}
          />
        }
      />

      <div className={styles.body}>
        <SideNavToggleButton />

        <SideNav
          items={
            EXECUTIVE_SIDE_NAV_ITEMS
          }
        />

        <main
          id="main-content"
          className={styles.main}
        >
          <div className={styles.titleRow}>
            <div>
              <h1>
                {title}
              </h1>
            </div>
            <time className={styles.headerDate} dateTime={asOf ?? undefined}>
              {asOfLabel} <span>기준</span>
            </time>
          </div>

          {children}

          {detailExpanded && aside && (
            <section ref={detailSectionRef} className={styles.expandedDetail} aria-label="선택 항목 상세 정보">
              <div className={styles.expandedDetailHeader}>
                <div>
                  <span>상세 근거</span>
                  <h2>선택 항목 상세 정보</h2>
                </div>
              </div>
              <div className={styles.expandedDetailContent}>{aside}</div>
            </section>
          )}
        </main>

        <ExecutiveSidePanel
          detail={aside}
          alertCount={alertCount}
          requestedTab={sideTab}
        />
      </div>

      <Footer />
    </div>
  )
}
