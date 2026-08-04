import { useState, type FormEvent } from 'react'
import type { LoginFormValues } from '../../../api/types'
import styles from './LoginForm.module.css'

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
}

/**
 * 시스템 로그인 폼. 사내 이메일/비밀번호, 로그인 상태 유지, 비밀번호 초기화 신청 링크.
 * 개인 식별정보 입력값은 기본값을 미리 지정하지 않는다(UI/UX 가이드라인 기본패턴).
 *
 * 사용 예:
 *   <LoginForm onSubmit={(values) => console.log(values)} />
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({ email, password, rememberMe })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>사내 이메일 주소</span>
        <input
          type="email"
          className={styles.input}
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>비밀번호</span>
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      <button type="submit" className={styles.submitButton}>
        보안 세션 로그인
      </button>
      <div className={styles.meta}>
        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          로그인 상태 유지
        </label>
        <a href="#" className={styles.link}>
          비밀번호 초기화 신청
        </a>
      </div>
    </form>
  )
}
