import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSideNavState } from '../../lib/useSideNavState'
import { useScrollOverflowHint } from '../../lib/useScrollOverflowHint'
import styles from './SideNav.module.css'

export interface SideNavItem {
  label: string
  href: string
}

interface SideNavProps {
  items: SideNavItem[]
}

/**
 * 하위 화면이 많은 대시보드(2/3계층 등)에서 사용하는 사이드 메뉴. 뷰포트에 sticky로
 * 고정되고(`position:sticky; height:100vh`) 내부 콘텐츠만 독립적으로 스크롤한다(페이지
 * 스크롤과 함께 사라지지 않음) — 스크롤바는 시각적으로 숨기되(`scrollbar-width:none` 등)
 * 스크롤 자체는 유지. 실제로 오버플로할 때만 상/하단에 그라데이션+화살표 힌트를
 * 표시한다(ScrollCard와 동일한 `useScrollOverflowHint` 공용 훅 재사용).
 *
 * 사용 예:
 *   <SideNav
 *     items={[
 *       { label: '리스크 현황판', href: '/purchasing' },
 *       { label: '협력사별 의존도', href: '/purchasing/vendors' },
 *     ]}
 *   />
 */
export function SideNav({ items }: SideNavProps) {
  const { collapsed } = useSideNavState()
  const navRef = useRef<HTMLElement>(null)
  const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(navRef, !collapsed)

  return (
    <div className={collapsed ? `${styles.wrapper} ${styles.collapsed}` : styles.wrapper}>
      <nav
        ref={navRef}
        className={styles.sideNav}
        aria-label="사이드 메뉴"
        aria-hidden={collapsed}
      >
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.href}>
              <Link to={item.href} className={styles.link} tabIndex={collapsed ? -1 : undefined}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {hasOverflowTop && (
        <div className={styles.overflowHintTop} aria-hidden="true">
          <span className={styles.overflowArrow}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </span>
        </div>
      )}
      {hasOverflowBottom && (
        <div className={styles.overflowHintBottom} aria-hidden="true">
          <span className={styles.overflowArrow}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      )}
    </div>
  )
}
