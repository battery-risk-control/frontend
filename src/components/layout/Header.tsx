import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthState } from '../../lib/useAuthState'
import { TIER_LABEL } from '../../lib/tierLabels'
import { maskEmailLocal } from '../../lib/masking'
import { DASHBOARD_PATH_BY_TIER } from '../../lib/dashboardPaths'
import { PrismHomeMark } from './PrismHomeMark'
import styles from './Header.module.css'

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
          배터리 원자재 공급망 리스크 관제
        </Link>
      </div>
      <div className={styles.actions}>
        {children}
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
