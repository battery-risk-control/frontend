import { Skeleton, SkeletonText } from '../ui/Skeleton/Skeleton'
import styles from './DashboardBootstrapSkeleton.module.css'

/**
 * 인증 세션 복원(부트스트랩) 중 라우트 가드가 띄우는 전체 화면 스켈레톤.
 *
 * <p>F5·직접 URL 진입 시 AuthProvider가 HttpOnly 쿠키로 세션을 복원하는 동안
 * (`refresh → /auth/me`), RequireAuth는 대시보드 페이지를 아직 마운트하지 못한다. 이 구간을
 * 평문 "불러오는 중…" 대신 대시보드 골격(헤더 바 · KPI 행 · 패널 그리드)으로 그려,
 * 세션 복원 → 대시보드 자체 데이터 스켈레톤으로 화면이 튀지 않고 이어지게 한다.
 *
 * <p>계층별로 레이아웃이 조금씩 다르지만, 복원 시점에는 어느 계층인지 판정 전이라 공용 골격 하나로
 * 둔다. 스크린리더에는 영역 하나가 "불러오는 중"이라고 한 번만 들리도록 컨테이너에만 aria를 단다.
 */
export function DashboardBootstrapSkeleton() {
  return (
    <div className={styles.page} role="status" aria-busy="true" aria-label="대시보드를 불러오는 중">
      <div className={styles.header}>
        <Skeleton variant="block" width="220px" height="20px" />
        <div className={styles.headerRight}>
          <Skeleton variant="block" width="160px" height="18px" />
          <Skeleton variant="block" width="72px" height="30px" />
        </div>
      </div>
      <div className={styles.main}>
        <Skeleton variant="title" width="min(280px, 60%)" />
        <div className={styles.kpiRow}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="block" height="92px" />
          ))}
        </div>
        <div className={styles.panelGrid}>
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className={styles.panel}>
              <Skeleton variant="title" width="40%" />
              <SkeletonText lines={5} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
