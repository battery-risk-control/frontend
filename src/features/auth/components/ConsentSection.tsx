import { useState } from 'react'
import styles from './ConsentSection.module.css'

interface ConsentSectionProps {
  privacyAgreed: boolean
  marketingAgreed: boolean
  onPrivacyChange: (value: boolean) => void
  onMarketingChange: (value: boolean) => void
  /** "전문 보기" 클릭 시 개인정보 처리방침 모달을 연다(부모 AuthPage가 소유). */
  onOpenPolicy: () => void
}

/** 수집·이용 내역 표. PrivacyPolicyModal 제2조 표와 동일 내용을 요약해 담는다(규제 가이드 ①). */
const COLLECTION_ROWS: { purpose: string; items: string; retention: string }[] = [
  {
    purpose: '임직원 본인확인 및 권한별 대시보드 접근 제어',
    items: '성명, 사내 이메일 주소, 소속 계층',
    retention: '퇴사 또는 권한 해제 시 즉시 파기',
  },
  {
    purpose: 'AI 질의 오남용 방지 및 사내 보안 감사',
    items: '접속 IP, AI 프롬프트 질의 이력, 브리핑 생성 기록',
    retention: '관련 법령 및 사내 규정에 따라 1년 보관',
  },
]

/**
 * 회원가입 시 개인정보 수집·이용 동의(규제 가이드 ①). 전체동의 + [필수] 개인정보 수집·이용 동의
 * (접이식 수집 내역 표) + [선택] 이벤트·뉴스 수신 동의로 구성한다. 필수 미동의 시 부모가 제출을 막는다.
 */
export function ConsentSection({
  privacyAgreed,
  marketingAgreed,
  onPrivacyChange,
  onMarketingChange,
  onOpenPolicy,
}: ConsentSectionProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const allAgreed = privacyAgreed && marketingAgreed

  function handleAllChange(checked: boolean) {
    onPrivacyChange(checked)
    onMarketingChange(checked)
  }

  return (
    <div className={styles.section}>
      <label className={styles.allRow}>
        <input
          type="checkbox"
          checked={allAgreed}
          onChange={(event) => handleAllChange(event.target.checked)}
        />
        약관에 모두 동의합니다.
      </label>

      <div className={styles.row}>
        <label className={styles.rowLabel}>
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(event) => onPrivacyChange(event.target.checked)}
          />
          <span>
            <span className={styles.required}>[필수]</span> 개인정보 수집·이용 동의
          </span>
        </label>
        <div className={styles.rowActions}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => setDetailOpen((open) => !open)}
            aria-expanded={detailOpen}
          >
            {detailOpen ? '내용 접기' : '내용 보기'}
          </button>
          <button type="button" className={styles.linkButton} onClick={onOpenPolicy}>
            전문 보기
          </button>
        </div>
      </div>

      {detailOpen && (
        <div className={styles.detail}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>수집·이용 목적</th>
                <th>수집 항목</th>
                <th>보유·이용기간</th>
              </tr>
            </thead>
            <tbody>
              {COLLECTION_ROWS.map((row) => (
                <tr key={row.purpose}>
                  <td>{row.purpose}</td>
                  <td>{row.items}</td>
                  <td>{row.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.row}>
        <label className={styles.rowLabel}>
          <input
            type="checkbox"
            checked={marketingAgreed}
            onChange={(event) => onMarketingChange(event.target.checked)}
          />
          <span>
            <span className={styles.optional}>[선택]</span> 이벤트·뉴스 정보 수신 동의
          </span>
        </label>
      </div>
    </div>
  )
}
