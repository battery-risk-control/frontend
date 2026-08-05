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
  useNavigate,
} from 'react-router-dom'
import styles from '../pages/ExecutiveDashboardPage.module.css'

interface ExecutivePageLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
  alertCount?: number
}

/**
 * 3계층 화면의 공통 골격.
 *
 * 헤더, 왼쪽 메뉴, 본문, 오른쪽 패널, 푸터를
 * 모든 경영진 페이지에서 동일하게 유지한다.
 */
export function ExecutivePageLayout({
  eyebrow,
  title,
  description,
  children,
  aside,
  alertCount = 0,
}: ExecutivePageLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <Header
        accountExtra={
          <AlertsBellButton
            count={alertCount}
            onOpenAlerts={() => {
              navigate('/executive/verification')
            }}
            onMouseEnter={() => undefined}
            onMouseLeave={() => undefined}
          />
        }
      >
        <time
          className={styles.headerDate}
          dateTime={new Date().toISOString().slice(0, 10)}
        >
          {new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date())}
        </time>
      </Header>

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
              <p className={styles.eyebrow}>
                {eyebrow}
              </p>

              <h1>
                {title}
              </h1>
            </div>

            <p className={styles.description}>
              {description}
            </p>
          </div>

          {children}
        </main>

        {aside}
      </div>

      <Footer />
    </div>
  )
}
