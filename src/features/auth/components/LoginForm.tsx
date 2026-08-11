import { useState, type FormEvent } from 'react'
import type { LoginFormValues } from '../../../api/types'
import styles from './LoginForm.module.css'

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void
  /** 로그인 실패가 누적돼 캡챠가 필요할 때 부모가 채워 준다(null이면 캡챠 미표시). */
  captcha?: { id: string; image: string } | null
  /** 캡챠 이미지 새로고침 요청. */
  onRefreshCaptcha?: () => void
}

/**
 * 시스템 로그인 폼. 사내 이메일/비밀번호, 로그인 상태 유지, 비밀번호 초기화 신청 링크.
 * 로그인 실패가 누적되면(캡챠 요구) 자동입력 방지 문자 입력란이 함께 나타난다(규제 가이드 ⑥).
 */
export function LoginForm({ onSubmit, captcha, onRefreshCaptcha }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      email,
      password,
      rememberMe,
      captchaId: captcha?.id,
      captchaAnswer: captcha ? captchaAnswer : undefined,
    })
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
      {captcha && (
        <div className={styles.field}>
          <span className={styles.label}>자동입력 방지 문자</span>
          <div className={styles.captchaRow}>
            <img className={styles.captchaImage} src={captcha.image} alt="자동입력 방지 문자" />
            <button
              type="button"
              className={styles.captchaRefresh}
              onClick={onRefreshCaptcha}
              aria-label="새로고침"
            >
              ↻
            </button>
          </div>
          <input
            type="text"
            className={styles.input}
            placeholder="이미지의 문자를 입력하세요"
            value={captchaAnswer}
            onChange={(event) => setCaptchaAnswer(event.target.value)}
            autoComplete="off"
            required
          />
        </div>
      )}
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
