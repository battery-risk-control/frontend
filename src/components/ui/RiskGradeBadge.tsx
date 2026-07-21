import styles from './RiskGradeBadge.module.css'

export type RiskGrade = '정상' | '주의' | '심각'

const VARIANT_CLASS: Record<RiskGrade, string> = {
  정상: styles.normal,
  주의: styles.warning,
  심각: styles.critical,
}

interface RiskGradeBadgeProps {
  grade: RiskGrade
}

/**
 * 리스크 등급 배지. ConfidenceBadge(신뢰도 라벨)와는 별개 축이므로 색상·컴포넌트를 구분한다.
 * mock-schemas.md/CLAUDE.md의 `grade` 필드 값(정상/주의/심각)과 정확히 일치해야 한다.
 *
 * 사용 예:
 *   <RiskGradeBadge grade="심각" />
 *   <RiskGradeBadge grade={riskEvent.grade} />
 */
export function RiskGradeBadge({ grade }: RiskGradeBadgeProps) {
  return <span className={`${styles.badge} ${VARIANT_CLASS[grade]}`}>{grade}</span>
}
