import { useEffect, useRef } from 'react'
import styles from './DataImportModals.module.css'

interface ModalShellProps {
  titleId: string
  title: string
  onCancel: () => void
  children: React.ReactNode
  footer: React.ReactNode
}

/**
 * 되돌릴 수 없는 결정 앞에 세우는 확인 창의 공통 껍데기.
 *
 * ESC와 배경 클릭으로 닫히지만 <b>취소로만</b> 닫힌다 — 실수로 배경을 눌렀을 때 반영이
 * 실행되면 안 된다. 열리면 첫 버튼에 포커스를 옮겨, 키보드만 쓰는 사용자도 바로 판단할 수 있게 한다.
 */
function ModalShell({ titleId, title, onCancel, children, footer }: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className={styles.backdrop} onClick={onCancel} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // 창 안쪽 클릭이 배경까지 올라가면 버튼을 누르는 순간 창이 닫힌다.
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>{footer}</div>
      </div>
    </div>
  )
}

interface ConfirmCommitModalProps {
  warningCount: number
  duplicateCount: number
  rowCount: number
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 경고·중복이 남은 채로 반영하려 할 때의 확인. 오류가 있으면 아예 승인 버튼이 열리지 않으므로
 * 이 창은 "경고만 있는" 경우에만 뜬다.
 *
 * 경고를 그냥 통과시키지 않는 이유는, 경고 대부분이 <b>값이 조용히 버려지는</b> 상황이기
 * 때문이다(무시되는 컬럼, 알 수 없는 컬럼). 사용자가 그걸 알고 넘기는 것과 모르고 넘기는 것은 다르다.
 */
export function ConfirmCommitModal({
  warningCount,
  duplicateCount,
  rowCount,
  onCancel,
  onConfirm,
}: ConfirmCommitModalProps) {
  return (
    <ModalShell
      titleId="confirm-commit-title"
      title="경고를 확인하고 반영할까요?"
      onCancel={onCancel}
      footer={
        <>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            취소
          </button>
          <button type="button" className={styles.primary} onClick={onConfirm}>
            경고 확인 및 반영 승인
          </button>
        </>
      }
    >
      <p className={styles.message}>
        경고 {warningCount.toLocaleString()}건과 중복 {duplicateCount.toLocaleString()}건이 있습니다.
        <br />
        검증된 데이터를 ERP DB에 반영하시겠습니까?
      </p>
      <p className={styles.note}>
        {rowCount.toLocaleString()}행이 반영됩니다. 반영된 데이터는 이 화면에서 되돌릴 수 없습니다.
      </p>
    </ModalShell>
  )
}

interface RejectImportModalProps {
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 업로드 거부 확인. 아직 DB에 아무것도 들어가지 않았다는 사실을 분명히 말해준다 — 이 문장이
 * 없으면 사용자는 "거부하면 방금 올린 게 DB에서 지워지나?"를 알 수 없다.
 */
export function RejectImportModal({ onCancel, onConfirm }: RejectImportModalProps) {
  return (
    <ModalShell
      titleId="reject-import-title"
      title="업로드를 거부할까요?"
      onCancel={onCancel}
      footer={
        <>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            취소
          </button>
          <button type="button" className={styles.danger} onClick={onConfirm}>
            폐기하고 처음으로
          </button>
        </>
      }
    >
      <p className={styles.message}>
        현재 업로드 파일과 검증 결과를 폐기하시겠습니까?
        <br />
        아직 데이터베이스에는 반영되지 않았습니다.
      </p>
      <p className={styles.note}>
        폐기하면 파일을 다시 올려야 합니다. 데이터베이스는 그대로 유지됩니다.
      </p>
    </ModalShell>
  )
}
