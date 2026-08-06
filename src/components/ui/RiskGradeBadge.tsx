import styles from './RiskGradeBadge.module.css'

export type RiskGrade = '정상' | '주의' | '심각'

const VARIANT_CLASS: Record<RiskGrade, string> = {
  정상: styles.normal,
  주의: styles.warning,
  심각: styles.critical,
}

interface RiskGradeBadgeProps {
  grade: RiskGrade
  /** 'sm'(기본) 유지, 'md'는 글씨·패딩을 키운다(원자재 요약 카드 가독성, 2026-08-06 item 5). */
  size?: 'sm' | 'md'
}

/**
 * 리스크 등급 배지. ConfidenceBadge(신뢰도 라벨)와는 별개 축이므로 색상·컴포넌트를 구분한다.
 * mock-schemas.md/CLAUDE.md의 `grade` 필드 값(정상/주의/심각)과 정확히 일치해야 한다.
 *
 * 사용 예:
 *   <RiskGradeBadge grade="심각" />
 *   <RiskGradeBadge grade={riskEvent.grade} size="md" />
 */
export function RiskGradeBadge({ grade, size = 'sm' }: RiskGradeBadgeProps) {
  const sizeClass = size === 'md' ? styles.md : ''
  return <span className={`${styles.badge} ${sizeClass} ${VARIANT_CLASS[grade]}`}>{grade}</span>
}
