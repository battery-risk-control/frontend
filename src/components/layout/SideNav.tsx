import { Link } from 'react-router-dom'
import styles from './SideNav.module.css'

export interface SideNavItem {
  label: string
  href: string
}

interface SideNavProps {
  items: SideNavItem[]
}

/**
 * 하위 화면이 많은 대시보드(2/3계층 등)에서 사용하는 사이드 메뉴.
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
  return (
    <nav className={styles.sideNav} aria-label="사이드 메뉴">
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <Link to={item.href} className={styles.link}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
