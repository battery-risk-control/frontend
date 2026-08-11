import { useState, type FormEvent } from 'react'
import { isValidPassword, PASSWORD_RULE_TEXT } from '../../../lib/passwordPolicy'
import { maskEmailLocal } from '../../../lib/masking'
import styles from './SignupForm.module.css'

interface PasswordExpiredResetFormProps {
  /** 만료 판정된 계정의 로그인 아이디(이메일). 재설정 대상 식별에 쓴다. */
  email: string
  onSubmit: (input: { currentPassword: string; newPassword: string }) => void
  onCancel: () => void
}

/**
 * 비밀번호 유효기간(90일) 만료 시 재설정 화면(규제 가이드 ⑥, 접근통제 스크린샷 ②).
 * 아이디 표시 + 현재 비밀번호 + 새 비밀번호(복잡도 규칙) + 확인 후 재설정한다.
 */
export function PasswordExpiredResetForm({ email, onSubmit, onCancel }: PasswordExpiredResetFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const newValid = isValidPassword(newPassword)
  const matches = newPassword.length > 0 && newPassword === newPasswordConfirm

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newValid) {
      setError(`비밀번호 규칙을 확인해 주세요: ${PASSWORD_RULE_TEXT}`)
      return
    }
    if (!matches) {
      setError('새 비밀번호와 확인이 일치하지 않습니다.')
      return
    }
    setError(null)
    onSubmit({ currentPassword, newPassword })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        비밀번호 유효기간(90일)이 만료되었습니다. 새 비밀번호로 재설정한 후 다시 로그인해 주세요.
      </p>
      <label className={styles.field}>
        <span className={styles.label}>아이디</span>
        <input className={styles.input} value={maskEmailLocal(email)} readOnly />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>현재 비밀번호</span>
        <input
          type="password"
          className={styles.input}
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>새 비밀번호</span>
        <input
          type="password"
          className={styles.input}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-invalid={newPassword.length > 0 && !newValid}
          required
        />
        <span className={newPassword.length > 0 && !newValid ? styles.hintError : styles.hint}>
          {PASSWORD_RULE_TEXT}
        </span>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>새 비밀번호 확인</span>
        <input
          type="password"
          className={styles.input}
          value={newPasswordConfirm}
          onChange={(event) => setNewPasswordConfirm(event.target.value)}
          aria-invalid={newPasswordConfirm.length > 0 && !matches}
          required
        />
      </label>
      {error && <p className={styles.formError}>{error}</p>}
      <button type="submit" className={styles.submitButton}>
        비밀번호 재설정
      </button>
      <button type="button" className={styles.linkButtonRow} onClick={onCancel}>
        로그인으로 돌아가기
      </button>
    </form>
  )
}
