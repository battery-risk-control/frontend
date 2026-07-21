import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Header.module.css'

interface HeaderProps {
  children?: ReactNode
}

/**
 * 대시보드 공통 Head 영역 (Seq 22). 좌측 상단 로고 고정, 스크롤 시 상단 고정(sticky).
 * 로고(브랜드 텍스트) 클릭 시 "/"(홈)로 이동한다. children으로 우측 영역(사용자 메뉴 등)을 전달할 수 있다.
 *
 * 사용 예:
 *   <Header>
 *     <button>로그아웃</button>
 *   </Header>
 */
export function Header({ children }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        배터리 원자재 공급망 리스크 관제
      </Link>
      {children ? <div className={styles.actions}>{children}</div> : null}
    </header>
  )
}
