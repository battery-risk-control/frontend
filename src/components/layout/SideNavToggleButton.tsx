import { useSideNavState } from '../../lib/useSideNavState'
import styles from './SideNavToggleButton.module.css'

/**
 * SideNav 접기/펼치기 토글 버튼. SideNav가 접힐 때 폭이 0이 되어 내부 요소가 클릭 불가능해지므로,
 * 이 버튼은 SideNav 바깥(각 페이지의 `.body`, `<SideNav>` 바로 앞)에 별도로 둔다 — 접힌 상태에서도
 * 계속 클릭 가능해야 하기 때문이다. Header에 넣지 않는 이유는 SideNav가 없는 화면(공개
 * 대시보드/경영진)까지 결합도가 올라가는 걸 피하기 위함(구현 계획 결정 사항).
 *
 * 사용 예:
 *   <SideNavToggleButton />
 *   <SideNav items={...} />
 */
export function SideNavToggleButton() {
  const { collapsed, toggle } = useSideNavState()

  return (
    <button
      type="button"
      className={styles.toggleButton}
      onClick={toggle}
      aria-label={collapsed ? '사이드 메뉴 펼치기' : '사이드 메뉴 접기'}
      aria-expanded={!collapsed}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ transform: collapsed ? 'rotate(180deg)' : undefined }}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
