import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthState } from '../../lib/useAuthState'
import { TIER_LABEL } from '../../lib/tierLabels'
import { maskEmailLocal } from '../../lib/masking'
import { DASHBOARD_PATH_BY_TIER } from '../../lib/dashboardPaths'
import { PrismHomeMark } from './PrismHomeMark'
import styles from './Header.module.css'

/**
 * 시연용 마스터 계정 전용 계층 전환 탭. 마스터는 RequireAuth를 전 계층에서 통과하므로
 * (routes.tsx), 어느 화면에 있든 이 탭으로 1·2·3계층 대시보드를 바로 오간다.
 * 공개 대시보드('/')의 비로그인용 상단 탭(PublicDashboardPage TIER_TABS)과 같은 구성이며,
 * 그 화면에서는 중복을 피해 마스터일 때 자체 탭을 숨긴다.
 */
const MASTER_TIER_TABS = [
  { label: '구매팀', path: '/purchasing' },
  { label: '경영기획팀', path: '/planning' },
  { label: '경영진', path: '/executive' },
]

interface HeaderProps {
  children?: ReactNode
  /** 계정 정보와 로그아웃 버튼 사이에 끼워넣을 콘텐츠(예: 알림 벨 아이콘) — 로그인 상태에서만
   * 의미가 있다. AlertsPanel처럼 특정 화면에만 있는 기능을 Header에 직접 결합시키지 않기
   * 위한 슬롯이다(SideNavToggleButton을 SideNav 바깥으로 분리한 것과 같은 이유). */
  accountExtra?: ReactNode
}

/**
 * 대시보드 공통 Head 영역 (Seq 22). 좌측 상단 로고 고정, 스크롤 시 상단 고정(sticky).
 * 로고 왼쪽에 별도 홈 아이콘 링크를 두고, 로고 텍스트 링크와 함께 각각 독립적으로 "/"(홈)로 이동한다.
 * 로그인 상태면 우측에 계정 정보(이메일·계층)와 로그아웃 버튼을, 미로그인 상태면 로그인/회원가입
 * 버튼을 표시한다 — 모든 화면(비로그인 공개 대시보드 포함)이 이 컴포넌트를 통해 동일하게 표시되어야 한다.
 * 로그아웃 시 인증 상태를 초기화하고 "/"로 이동한다. children으로 그 외 우측 영역(추가 액션 등)을 전달할 수 있다.
 * `accountExtra`(선택)는 계정 정보와 로그아웃 버튼 사이에 렌더링된다(2026-07-27, 예: AlertsPanel
 * 알림 벨 아이콘) — 미전달 시 기존과 완전히 동일하게 동작한다(다른 소비처 무변경).
 *
 * 사용 예:
 *   <Header />
 *   <Header><MyTabs /></Header>
 */
export function Header({ children, accountExtra }: HeaderProps) {
  const { orgTier, email, signOut } = useAuthState()
  const { pathname } = useLocation()
  const homePath = orgTier ? DASHBOARD_PATH_BY_TIER[orgTier] : '/'

  function handleLogout() {
    // react-router의 SPA navigate()를 쓰면 history 리스너가 인증 Context 갱신과 다른
    // 타이밍에 처리되면서, 현재 라우트의 RequireAuth가 orgTier=null을 감지해
    // /auth로 리다이렉트를 덮어써 버리는 경쟁이 생긴다(재현 확인됨). 인증 상태가 애초에
    // 메모리 전용(새로고침 시 소실)으로 설계됐으므로, 로그아웃은 하드 리다이렉트로 처리해
    // 이 경쟁 자체를 없앤다.
    signOut()
    window.location.href = '/'
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to={homePath} className={styles.homeIconLink} aria-label="홈으로 이동">
          <PrismHomeMark />
        </Link>
        <Link to={homePath} className={styles.brand}>
          PRISM: 배터리 원자재 공급망 리스크 관제
        </Link>
      </div>
      <div className={styles.actions}>
        {children}
        {/* 마스터 전용 계층 전환 탭 — 어느 화면에서든 다른 계층 대시보드로 바로 이동한다.
            현재 보고 있는 계층은 강조 표시해 "지금 어느 계층 화면인지"를 시연 중에 바로 알 수 있게 한다. */}
        {orgTier === 'master' && (
          <nav className={styles.tierTabs} aria-label="계층 대시보드 전환">
            {MASTER_TIER_TABS.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={
                  pathname.startsWith(tab.path)
                    ? `${styles.tierTab} ${styles.tierTabActive}`
                    : styles.tierTab
                }
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        )}
        {orgTier ? (
          <div className={styles.account}>
            <span className={styles.accountInfo}>
              {email ? `${maskEmailLocal(email)} · ${TIER_LABEL[orgTier]}` : TIER_LABEL[orgTier]}
            </span>
            {accountExtra}
            <button type="button" className={styles.logoutButton} onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <Link to="/auth" className={styles.authButton}>
            로그인/회원가입
          </Link>
        )}
      </div>
    </header>
  )
}
