import { useState, type FormEvent } from 'react'
import type { OrgTier, SignupFormValues } from '../../../api/types'
import { isValidPassword, PASSWORD_RULE_TEXT } from '../../../lib/passwordPolicy'
import { ConsentSection } from './ConsentSection'
import styles from './SignupForm.module.css'

type SignupTier = Exclude<OrgTier, 'admin' | 'master'>

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void
  /** ConsentSection "전문 보기" → 개인정보 처리방침 모달을 연다(AuthPage가 소유). */
  onOpenPolicy: () => void
}

const ORG_TIER_OPTIONS: { value: SignupTier; title: string; description: string }[] = [
  {
    value: 'purchasing',
    title: '1계층 : 구매팀 실무 사용자',
    description: '원자재별 리스크 실시간 관제 및 내부 브리핑 리포트 생성 권한',
  },
  {
    value: 'planning',
    title: '2계층 : 경영기획팀 분석 사용자',
    description: '전사 관점 위험 노출도 및 협력사 리스크 패턴 비교 분석 권한',
  },
  {
    value: 'executive',
    title: '3계층 : 경영진',
    description: '누적 리스크 핵심 KPI 요약 및 시뮬레이션 비용 최종 의사결정 권한',
  },
]

/**
 * 권한 신청(회원가입) 폼. 임직원 성명/회사 이메일/비밀번호(+확인)와 3계층 접근권한 라디오,
 * 그리고 개인정보 수집·이용 동의(규제 가이드 ①)를 받는다. 비밀번호 복잡도(②)와 확인 일치,
 * 필수 동의를 모두 만족해야 제출된다.
 */
export function SignupForm({ onSubmit, onOpenPolicy }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [orgTier, setOrgTier] = useState<SignupTier | ''>('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [marketingAgreed, setMarketingAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordValid = isValidPassword(password)
  const passwordMatches = password.length > 0 && password === passwordConfirm

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!orgTier) return
    if (!passwordValid) {
      setError(`비밀번호 규칙을 확인해 주세요: ${PASSWORD_RULE_TEXT}`)
      return
    }
    if (!passwordMatches) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    if (!privacyAgreed) {
      setError('개인정보 수집·이용(필수) 동의가 필요합니다.')
      return
    }
    setError(null)
    onSubmit({
      name,
      email,
      password,
      org_tier: orgTier,
      privacy_required_consent: privacyAgreed,
      marketing_optional_consent: marketingAgreed,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>임직원 성명</span>
        <input
          type="text"
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>회사 이메일 계정 (ID)</span>
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
        <span className={styles.label}>접속 비밀번호 설정</span>
        <input
          type="password"
          className={styles.input}
          placeholder="영문·숫자·특수문자 조합"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={password.length > 0 && !passwordValid}
          required
        />
        <span className={password.length > 0 && !passwordValid ? styles.hintError : styles.hint}>
          {PASSWORD_RULE_TEXT}
        </span>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>비밀번호 확인</span>
        <input
          type="password"
          className={styles.input}
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          aria-invalid={passwordConfirm.length > 0 && !passwordMatches}
          required
        />
        {passwordConfirm.length > 0 && !passwordMatches && (
          <span className={styles.hintError}>비밀번호가 일치하지 않습니다.</span>
        )}
      </label>
      <fieldset className={styles.tierField}>
        <legend className={styles.label}>신청 보안 접근권한 이름</legend>
        {ORG_TIER_OPTIONS.map((option) => (
          <label key={option.value} className={styles.tierOption}>
            <input
              type="radio"
              name="orgTier"
              value={option.value}
              checked={orgTier === option.value}
              onChange={() => setOrgTier(option.value)}
              required
            />
            <span className={styles.tierText}>
              <span className={styles.tierTitle}>{option.title}</span>
              <span className={styles.tierDescription}>{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <ConsentSection
        privacyAgreed={privacyAgreed}
        marketingAgreed={marketingAgreed}
        onPrivacyChange={setPrivacyAgreed}
        onMarketingChange={setMarketingAgreed}
        onOpenPolicy={onOpenPolicy}
      />
      {error && <p className={styles.formError}>{error}</p>}
      <button type="submit" className={styles.submitButton}>
        가입 및 계정 승인 요청
      </button>
    </form>
  )
}
