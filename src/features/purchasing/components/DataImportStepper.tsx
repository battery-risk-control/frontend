import styles from './DataImportStepper.module.css'

/**
 * 데이터 관리 화면 상단의 4단계 진행 표시.
 *
 * 단계는 사용자가 직접 고르는 게 아니라 화면 상태에서 파생된다(파일 없음 → 1, 분석 전 → 2,
 * 분석 완료 → 3, 반영 완료 → 4). 그래서 클릭할 수 없다 — 누를 수 있게 두면 "3단계를 눌러
 * 건너뛴다"가 가능해 보이는데 실제로는 분석 없이 반영할 수 없다.
 */
const STEPS = ['파일 업로드', '내용 분석', '매핑 및 확인', '반영 완료']

interface DataImportStepperProps {
  /** 1~4. 현재 진행 중인 단계. */
  current: number
}

export function DataImportStepper({ current }: DataImportStepperProps) {
  return (
    <ol className={styles.stepper} aria-label="진행 단계">
      {STEPS.map((label, index) => {
        const step = index + 1
        const state = step < current ? 'done' : step === current ? 'active' : 'todo'
        return (
          <li key={label} className={styles.step} aria-current={state === 'active' ? 'step' : undefined}>
            <span className={`${styles.marker} ${styles[state]}`}>
              {state === 'done' ? '✓' : step}
            </span>
            <span className={state === 'todo' ? styles.labelTodo : styles.label}>{label}</span>
            {step < STEPS.length && <span className={styles.connector} aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
