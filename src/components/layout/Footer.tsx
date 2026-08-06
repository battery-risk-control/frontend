import { useState } from 'react'
import { PrivacyPolicyModal } from './PrivacyPolicyModal'
import styles from './Footer.module.css'

/**
 * 모든 화면에 공통으로 위치·순서가 일관된 하단 영역.
 * 운영기관 식별 정보, 사내 처리방침 모달, 외부 데이터 출처를 표시한다.
 */
export function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)

  return (
    <>
      <footer className={styles.footer}>
        <p className={styles.text}>
          배터리 원자재 공급망 리스크 관제 AI 에이전트 시스템
          <span className={styles.divider}> · </span>
          <button
            type="button"
            className={styles.policyButton}
            onClick={() => setIsPrivacyOpen(true)}
          >
            개인정보 및 정보보호 처리방침
          </button>
        </p>
        <p className={styles.subText}>
          운영: SCM 기획팀 & AI 혁신센터 (internal-ai-support@company.com)
        </p>
        <p className={styles.credits}>
          환율{' '}
          <a
            className={styles.creditLink}
            href="https://www.exchangerate-api.com"
            target="_blank"
            rel="noreferrer"
          >
            Rates By Exchange Rate API
          </a>
          {' · '}한국수출입은행 현재환율
        </p>
      </footer>

      {isPrivacyOpen && <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} />}
    </>
  )
}
