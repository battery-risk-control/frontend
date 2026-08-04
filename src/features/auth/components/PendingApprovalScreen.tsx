import styles from './PendingApprovalScreen.module.css'

interface PendingApprovalScreenProps {
  message: string
  onGoHome: () => void
}

/**
 * 승인 대기 보안 락 화면 (Seq 35). 로그인/회원가입 시 PENDING 응답을 받으면 이 화면으로 전환하고,
 * 메인 대시보드 진입은 차단한다. '처음으로' 버튼으로 로그인 화면으로 복귀한다.
 *
 * 사용 예:
 *   <PendingApprovalScreen message={result.message} onGoHome={() => setPendingMessage(null)} />
 */
export function PendingApprovalScreen({ message, onGoHome }: PendingApprovalScreenProps) {
  return (
    <div className={styles.screen} role="alert">
      <div className={styles.card}>
        <p className={styles.eyebrow}>보안 접근 제한</p>
        <h1 className={styles.title}>관리자 승인 대기 중입니다</h1>
        <p className={styles.message}>{message}</p>
        <p className={styles.description}>승인이 완료되기 전까지 대시보드에 접근할 수 없습니다.</p>
        <button type="button" className={styles.homeButton} onClick={onGoHome}>
          처음으로
        </button>
      </div>
    </div>
  )
}
