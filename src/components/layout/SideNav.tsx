import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSideNavState } from '../../lib/useSideNavState'
import { useScrollOverflowHint } from '../../lib/useScrollOverflowHint'
import styles from './SideNav.module.css'

export interface SideNavItem {
  label: string
  href: string
  /**
   * 이 항목이 활성으로 보여야 하는 추가 경로 접두사. 목록 화면(href)과 경로가 다른 드릴다운
   * 상세(예: AI 브리핑 목록 `/planning/briefings` ↔ 상세 `/planning/briefing/:id`)에서도 같은
   * 메뉴가 계속 활성으로 남게 한다. 지정하면 `pathname`이 이 접두사로 시작할 때도 활성이다.
   */
  matchPrefix?: string
}

interface SideNavProps {
  items: SideNavItem[]
}

/**
 * `item.href`가 현재 위치와 일치하는지 판단한다. 해시가 있는 href(`/purchasing#briefing`처럼
 * 아직 실제 라우트로 연결 안 된 placeholder, C3 참고)는 경로와 해시 둘 다 일치해야 활성으로
 * 본다 — 그래야 실제 라우트(Planning 7탭)와 해시 placeholder(Purchasing)를 하나의 로직으로
 * 같이 처리하면서도, 해시 placeholder 항목들이 같은 페이지라는 이유만으로 전부 동시에
 * 활성 표시되는 걸 막는다.
 */
function isSideNavItemActive(
  pathname: string,
  hash: string,
  href: string,
  matchPrefix?: string,
): boolean {
  const [path, itemHash] = href.split('#')
  if (itemHash) return pathname === path && hash === `#${itemHash}`
  if (pathname === path) return true
  // 드릴다운 상세 경로(matchPrefix)에서도 부모 탭을 활성으로 유지한다. 경계(`/` 또는 정확히 일치)를
  // 확인해 `/planning/contract`가 `/planning/contracts`까지 삼키지 않게 한다.
  if (matchPrefix) {
    return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`)
  }
  return false
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
  const location = useLocation()
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
          {items.map((item) => {
            const active = isSideNavItemActive(
              location.pathname,
              location.hash,
              item.href,
              item.matchPrefix,
            )
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={active ? `${styles.link} ${styles.linkActive}` : styles.link}
                  aria-current={active ? 'page' : undefined}
                  tabIndex={collapsed ? -1 : undefined}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
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
