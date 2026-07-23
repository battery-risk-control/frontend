import type { RiskGrade } from './RiskGradeBadge'
import styles from './RiskGauge.module.css'

const RISK_GRADES: RiskGrade[] = ['정상', '주의', '심각']

const DOT_COLOR_VAR: Record<RiskGrade, string> = {
  정상: 'var(--color-risk-normal)',
  주의: 'var(--color-risk-warning)',
  심각: 'var(--color-risk-critical)',
}

interface RiskGaugeProps {
  grade: RiskGrade
}

/**
 * 3단계 리스크 게이지(surin RiskStepGauge 이식). surin은 4단계(정상/주의/경고/심각)를 쓰지만
 * 여기서는 기존 RiskGrade(정상/주의/심각)를 그대로 재사용한다 — ConfidenceLabel의 "경고"와
 * 혼동되지 않도록(design-tokens.md 참고). 점 색상도 surin의 리터럴 hex 대신 기존
 * --color-risk-* 토큰을 그대로 사용한다.
 *
 * 사용 예:
 *   <RiskGauge grade="심각" />
 */
export function RiskGauge({ grade }: RiskGaugeProps) {
  const activeIdx = RISK_GRADES.indexOf(grade)
  const activeColor = DOT_COLOR_VAR[grade]

  return (
    <div className={styles.gauge}>
      <div className={styles.steps}>
        {RISK_GRADES.map((_, idx) => (
          <div key={idx} className={styles.step}>
            <span
              className={styles.dot}
              style={{
                borderColor: idx <= activeIdx ? activeColor : 'var(--color-border)',
                backgroundColor: idx === activeIdx ? activeColor : 'var(--color-surface)',
              }}
            />
            {idx < RISK_GRADES.length - 1 && (
              <div
                className={styles.line}
                style={{ backgroundColor: idx < activeIdx ? activeColor : 'var(--color-border)' }}
              />
            )}
          </div>
        ))}
      </div>
      <div className={styles.labels}>
        {RISK_GRADES.map((level) => (
          <span key={level} className={level === grade ? styles.labelActive : undefined}>
            {level}
          </span>
        ))}
      </div>
    </div>
  )
}
