import styles from './DataImportStepper.module.css'

/**
 * 데이터 관리 화면 상단의 5단계 진행 표시.
 *
 * 단계는 사용자가 직접 고르는 게 아니라 화면 상태에서 파생된다. 그래서 클릭할 수 없다 — 누를 수
 * 있게 두면 "4단계를 눌러 건너뛴다"가 가능해 보이는데, 실제로는 품질검사 없이 승인할 수 없다.
 *
 * "승인 또는 거부"를 별도 칸으로 세운 이유는 이 화면의 핵심이 <b>사용자가 명시적으로 결정하기
 * 전까지 DB가 바뀌지 않는다</b>는 데 있기 때문이다. 검토와 승인을 한 칸에 합치면 그 경계가 흐려진다.
 */
const STEPS = ['파일 업로드', '데이터 검증', '매핑 및 검토', '승인 또는 거부', '반영 완료']

interface DataImportStepperProps {
  /** 1~5. 현재 진행 중인 단계. */
  current: number
  /** 거부로 끝난 상태. 체크 표시를 달면 "반영됐다"로 읽히므로 진행을 멈춘 것으로 그린다. */
  rejected?: boolean
}

export function DataImportStepper({ current, rejected = false }: DataImportStepperProps) {
  return (
    <ol className={styles.stepper} aria-label="진행 단계">
      {STEPS.map((label, index) => {
        const step = index + 1
        const state = rejected && step >= current
          ? 'todo'
          : step < current ? 'done' : step === current ? 'active' : 'todo'
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
