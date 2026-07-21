import { useState, type FormEvent } from 'react'
import type { OrgTier, SignupFormValues } from '../../../api/types'
import styles from './SignupForm.module.css'

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => void
}

const ORG_TIER_OPTIONS: { value: OrgTier; title: string; description: string }[] = [
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
 * 권한 신청(회원가입) 폼. 임직원 성명/회사 이메일/비밀번호와
 * 3계층 접근권한(구매팀 실무/경영기획팀 분석/경영진) 라디오 선택을 받는다(Seq 3, Seq 34).
 *
 * 사용 예:
 *   <SignupForm onSubmit={(values) => console.log(values)} />
 */
export function SignupForm({ onSubmit }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgTier, setOrgTier] = useState<OrgTier | ''>('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!orgTier) return
    onSubmit({ name, email, password, org_tier: orgTier })
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
          placeholder="8자리 이상, 특수문자 포함"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
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
      <button type="submit" className={styles.submitButton}>
        가입 및 계정 승인 요청
      </button>
    </form>
  )
}
