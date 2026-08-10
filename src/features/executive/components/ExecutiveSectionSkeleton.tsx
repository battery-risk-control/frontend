import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import styles from './ExecutiveDashboardSections.module.css'

interface ExecutiveSectionSkeletonProps {
  /** 카드 그리드 형태. 실제 섹션이 쓰는 그리드 클래스를 그대로 골라 폭·열수를 맞춘다. */
  variant?: 'riskGrid' | 'verificationGrid' | 'list'
  /** 자리표시자 카드 개수. 실제로 들어올 항목 수에 가깝게 준다. */
  rows?: number
}

/**
 * 경영진 2차 페이지(핵심 위험·공급망·브리핑·검증) 공용 섹션 로딩 자리표시자.
 * `ExecutiveDashboardSections.module.css`의 `.section`/`.sectionHeader`와 그리드 클래스를 그대로
 * 재사용해, 헤더 한 줄 + 카드 그리드 모양으로 로딩을 표현한다(도착 시 레이아웃 점프 최소화).
 */
export function ExecutiveSectionSkeleton({
  variant = 'riskGrid',
  rows = 5,
}: ExecutiveSectionSkeletonProps) {
  return (
    <section
      className={styles.section}
      aria-busy="true"
      aria-label="데이터 불러오는 중"
    >
      <div className={styles.sectionHeader}>
        <div>
          <Skeleton variant="title" width="160px" />
        </div>
        <Skeleton width="48px" />
      </div>
      <div className={styles[variant]}>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} variant="block" height="72px" />
        ))}
      </div>
    </section>
  )
}
