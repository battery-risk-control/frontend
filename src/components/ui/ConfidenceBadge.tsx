import styles from './ConfidenceBadge.module.css'

export type ConfidenceLabel = '확정' | '참고' | '경고'

const VARIANT_CLASS: Record<ConfidenceLabel, string> = {
  확정: styles.confirmed,
  참고: styles.reference,
  경고: styles.warning,
}

interface ConfidenceBadgeProps {
  label: ConfidenceLabel
}

/**
 * 리스크 판단 신뢰도 라벨 배지 (Seq 20 — 전 화면 공통 필수 표시).
 * mock-schemas.md의 `confidence_label` 필드 값(확정/참고/경고)과 정확히 일치해야 한다.
 *
 * 사용 예:
 *   <ConfidenceBadge label="확정" />
 *   <ConfidenceBadge label={riskEvent.confidence_label} />
 */
export function ConfidenceBadge({ label }: ConfidenceBadgeProps) {
  return <span className={`${styles.badge} ${VARIANT_CLASS[label]}`}>{label}</span>
}
