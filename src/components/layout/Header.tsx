import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuthState } from '../../lib/useAuthState'
import type { OrgTier } from '../../api/types'
import styles from './Header.module.css'

interface HeaderProps {
  children?: ReactNode
}

const TIER_LABEL: Record<OrgTier, string> = {
  purchasing: '구매팀',
  planning: '경영기획팀',
  executive: '경영진',
}

/**
 * 대시보드 공통 Head 영역 (Seq 22). 좌측 상단 로고 고정, 스크롤 시 상단 고정(sticky).
 * 로고(브랜드 텍스트) 클릭 시 "/"(홈)로 이동한다. 로그인 상태면 우측에 계정 정보(이메일·계층)와
 * 로그아웃 버튼을 표시한다 — 로그아웃 시 인증 상태를 초기화하고 "/"로 이동한다.
 * children으로 그 외 우측 영역(추가 액션 등)을 전달할 수 있다.
 *
 * 사용 예:
 *   <Header />
 */
export function Header({ children }: HeaderProps) {
  const { orgTier, email, signOut } = useAuthState()

  function handleLogout() {
    // react-router의 SPA navigate()를 쓰면 history 리스너가 인증 Context 갱신과 다른
    // 타이밍에 처리되면서, 현재 라우트의 RequireAuth가 orgTier=null을 감지해
    // /auth로 리다이렉트를 덮어써 버리는 경쟁이 생긴다(재현 확인됨). 인증 상태가 애초에
    // 메모리 전용(새로고침 시 소실)으로 설계됐으므로, 로그아웃은 하드 리다이렉트로 처리해
    // 이 경쟁 자체를 없앤다.
    signOut()
    window.location.href = '/'
  }

  const hasActions = Boolean(children) || Boolean(orgTier)

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        배터리 원자재 공급망 리스크 관제
      </Link>
      {hasActions && (
        <div className={styles.actions}>
          {children}
          {orgTier && (
            <div className={styles.account}>
              <span className={styles.accountInfo}>
                {email ? `${email} · ${TIER_LABEL[orgTier]}` : TIER_LABEL[orgTier]}
              </span>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
