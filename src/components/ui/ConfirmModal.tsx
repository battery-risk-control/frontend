import { useEffect, useRef } from 'react'
import styles from './ConfirmModal.module.css'

interface ConfirmModalProps {
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * 확인/취소 모달 (qa-checklist.md "C. 접근 제어·리다이렉트의 사용자 피드백").
 * 무음 리다이렉트 대신 사용자에게 이동 이유를 알리고 선택지를 준다.
 * `cancelLabel` 버튼이 기본 포커스 + 강조(주 버튼) 스타일, `confirmLabel` 버튼은 보조 스타일 —
 * 안전한 선택지(취소/현재 유지)가 기본이어야 한다는 체크리스트 원칙을 컴포넌트 레벨에서 강제한다.
 * 키보드 접근성: Esc는 취소와 동일하게 동작하고, Tab/Shift+Tab은 모달 내부 요소끼리만 순환한다(포커스 트랩).
 *
 * 사용 예:
 *   <ConfirmModal
 *     message="이 화면은 회원님의 권한(구매팀)으로 접근할 수 없습니다."
 *     confirmLabel="내 화면으로 이동"
 *     cancelLabel="취소"
 *     onConfirm={() => navigate('/purchasing')}
 *     onCancel={() => navigate('/')}
 *   />
 */
export function ConfirmModal({ message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmModalProps) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }
      if (event.key !== 'Tab' || !boxRef.current) {
        return
      }
      const focusable = Array.from(boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className={styles.overlay}>
      <div
        ref={boxRef}
        className={styles.box}
        role="dialog"
        aria-modal="true"
        aria-describedby="confirm-modal-message"
      >
        <p id="confirm-modal-message" className={styles.message}>
          {message}
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className={styles.primaryButton} onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
