import { useEffect } from 'react'
import styles from './PrivacyPolicyModal.module.css'

interface PrivacyPolicyModalProps {
  onClose: () => void
}

export function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h2 className={styles.title}>개인정보 및 사내 지식자산 처리방침</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {/* 서문 */}
          <section className={styles.preambleSection}>
            <h3 className={styles.subHeading}>서문</h3>
            <p>
              배터리 원자재 공급망 리스크 관제 AI 에이전트 시스템(이하 "회사" 및 "시스템")은 정보주체(임직원 및 인가된 사용인)의 개인정보와 기업의 핵심 지식자산을 보호하기 위해 「개인정보 보호법」 및 관계 법령, 사내 정보보안 규정을 엄격히 준수합니다.
              이에 따라 정보주체에게 처리 목적, 수집 항목, 보유 기간 및 데이터 보안에 관한 절차와 기준을 상세히 안내하고 원활한 고충 처리를 위해 본 처리방침을 수립·공개합니다.
            </p>
          </section>

          {/* 목차 */}
          <section className={styles.tocSection}>
            <h3 className={styles.subHeading}>목차</h3>
            <div className={styles.tocGrid}>
              <a href="#sec1" className={styles.tocLink}>제1조 총칙</a>
              <a href="#sec2" className={styles.tocLink}>제2조 수집 항목 및 처리 목적</a>
              <a href="#sec3" className={styles.tocLink}>제3조 데이터 파기 절차 및 방법</a>
              <a href="#sec4" className={styles.tocLink}>제4조 개인정보의 제3자 제공</a>
              <a href="#sec5" className={styles.tocLink}>제5조 개인정보 처리의 위탁</a>
              <a href="#sec6" className={styles.tocLink}>제6조 정보주체의 권리·의무 및 행사</a>
              <a href="#sec7" className={styles.tocLink}>제7조 개인정보 및 데이터의 안전성 확보조치</a>
              <a href="#sec8" className={styles.tocLink}>제8조 자동 수집 장치의 설치·운영 및 거부</a>
              <a href="#sec9" className={styles.tocLink}>제9조 정보보호 책임자 및 열람청구</a>
              <a href="#sec10" className={styles.tocLink}>제10조 권익침해 구제방법</a>
              <a href="#sec11" className={styles.tocLink}>제11조 개인정보 처리방침 변경 고지</a>
            </div>
          </section>

          {/* 주요 개인정보 처리 표시 (AIVLE 스타일 라벨) */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>👤</div>
              <strong className={styles.cardTitle}>개인정보 수집</strong>
              <span className={styles.cardDesc}>사번, 성명, 이메일, 접속 및 AI 질의(프롬프트) 이력</span>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>🔒</div>
              <strong className={styles.cardTitle}>제3자 제공 없음</strong>
              <span className={styles.cardDesc}>100% 사내 전용 폐쇄망(VPC) 단독 독립 운영</span>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardIcon}>🎧</div>
              <strong className={styles.cardTitle}>정보보호 담당자</strong>
              <span className={styles.cardDesc}>SCM 기획팀 & AI 혁신센터 (internal-ai-support@company.com)</span>
            </div>
          </div>

          {/* 제1조 총칙 */}
          <section id="sec1" className={styles.section}>
            <h3>제1조 총칙</h3>
            <p>
              1. 본 시스템은 사내 ERP(재무/구매), 계약 관리 시스템(CLM), SOP 가이드라인 문서 및 외부 지세/뉴스 신호를 통합하여 원자재 리스크 모니터링 및 AI 브리핑을 제공하는 의사결정 지원 플랫폼입니다.
            </p>
            <p>
              2. 회사는 임직원의 개인정보보호를 매우 중요시하며, 「개인정보 보호법」 등 제반 법령을 준수하고 있습니다.
            </p>
          </section>

          {/* 제2조 수집 항목 및 처리 목적 */}
          <section id="sec2" className={styles.section}>
            <h3>제2조 개인정보의 처리목적, 수집 항목, 보유 및 이용기간</h3>
            <p>회사는 서비스 제공 및 사내 보안 감사를 위해 최소한의 개인정보를 수집하여 처리합니다.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>수집/이용 목적</th>
                  <th>수집 항목</th>
                  <th>보유 및 이용기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>임직원 본인인증 및 권한별 대시보드 접근 제어</td>
                  <td>사번, 성명, 부서명, 직급, 사내 이메일 주소</td>
                  <td><strong>퇴사 또는 권한 해제 시 즉시 파기</strong></td>
                </tr>
                <tr>
                  <td>AI 에이전트 질의 오남용 방지 및 사내 보안 감사</td>
                  <td>접속 IP, AI 프롬프트 질의 이력, 브리핑 생성 기록</td>
                  <td><strong>관련 법령 및 사내 규정에 따라 1년 보관</strong></td>
                </tr>
                <tr>
                  <td>원자재 공급망 지식 온톨로지 연동 및 RAG 조회</td>
                  <td>ERP 자재 코드, 계약서 조항 인덱스, 협력사 위험도 평가 내역</td>
                  <td><strong>시스템 운영 기간 동안 지속 보관</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 제3조 파기절차 및 방법 */}
          <section id="sec3" className={styles.section}>
            <h3>제3조 개인정보의 파기절차 및 방법</h3>
            <p>
              1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
            </p>
            <p>
              2. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이 문서에 출력된 개인정보는 분쇄기로 분쇄하여 파기합니다.
            </p>
          </section>

          {/* 제4조 제3자 제공 */}
          <section id="sec4" className={styles.section}>
            <h3>제4조 개인정보의 제3자 제공</h3>
            <p>
              회사는 임직원의 개인정보를 제1조에서 명시한 범위를 넘어 타인 또는 타기업·기관에 제공하지 않습니다. 본 시스템은 사내 전용 VPC(Virtual Private Cloud) 폐쇄망에서만 동작하며 외부 상용 LLM의 학습 데이터로 수집 데이터를 제공하지 않습니다.
            </p>
          </section>

          {/* 제5조 개인정보 처리의 위탁 */}
          <section id="sec5" className={styles.section}>
            <h3>제5조 개인정보 처리의 위탁</h3>
            <p>
              회사는 원활한 시스템 운영 및 인프라 관리를 위해 사내 IT 자회사에 일부 기술적인 위탁 업무를 수행하고 있으며, 위탁 계약 시 법령에 따라 개인정보가 안전하게 관리되도록 규정하고 있습니다.
            </p>
          </section>

          {/* 제6조 정보주체의 권리 */}
          <section id="sec6" className={styles.section}>
            <h3>제6조 정보주체 및 법정대리인의 권리·의무 및 행사방법</h3>
            <p>
              1. 임직원은 언제든지 본인의 개인정보 및 AI 질의 이력에 대한 열람, 정지, 삭제를 요구할 수 있습니다.
            </p>
            <p>
              2. 권리 행사는 사내 IT 헬프데스크 또는 시스템 담당 부서를 통해 서면, 이메일로 요청하실 수 있으며 회사는 이에 대해 지체 없이 조치합니다.
            </p>
          </section>

          {/* 제7조 안전성 확보조치 */}
          <section id="sec7" className={styles.section}>
            <h3>제7조 개인정보 및 데이터의 안전성 확보조치</h3>
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ul>
              <li><strong>관리적 조치:</strong> 사내 정보보안 지침 수립, 담당자 최소화 및 정기 보안 교육</li>
              <li><strong>기술적 조치:</strong> 개인정보 및 계약 DB 암호화, 접근통제시스템 운영, 외부 LLM 데이터 유출 방지(DLP)</li>
              <li><strong>물리적 조치:</strong> 사내 전용 IDC 데이터센터 출입통제 및 통제구역 지정</li>
            </ul>
          </section>

          {/* 제8조 자동 수집 장치 */}
          <section id="sec8" className={styles.section}>
            <h3>제8조 개인정보 자동 수집장치의 설치·운영 및 그 거부에 관한 사항</h3>
            <p>
              본 시스템은 개인화된 대시보드 환경 및 세션 유지를 위해 '쿠키(Cookie)' 또는 세션 토큰을 사용합니다. 사용자는 브라우저 설정을 통해 쿠키 수집을 거부할 수 있으나, 이 경우 시스템 일부 기능 이용에 제한이 있을 수 있습니다.
            </p>
          </section>

          {/* 제9조 보호책임자 및 열람청구 */}
          <section id="sec9" className={styles.section}>
            <h3>제9조 개인정보 보호책임자 및 개인정보 열람청구</h3>
            <p>회사는 개인정보 처리 및 고충 처리를 총괄하기 위해 아래와 같이 담당 부서를 지정하고 있습니다.</p>
            <table className={styles.contactTable}>
              <thead>
                <tr>
                  <th>구분</th>
                  <th>담당 부서 / 직책</th>
                  <th>연락처 (이메일)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>시스템 운영 총괄</td>
                  <td>SCM 기획팀 & AI 혁신센터</td>
                  <td>internal-ai-support@company.com</td>
                </tr>
                <tr>
                  <td>사내 정보보호 책임자</td>
                  <td>사내 정보보호센터 (CISO)</td>
                  <td>security@company.com</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 제10조 권익침해 구제방법 */}
          <section id="sec10" className={styles.section}>
            <h3>제10조 권익침해 구제방법</h3>
            <p>
              개인정보침해에 대한 신고나 상담이 필요하신 경우 사내 정보보호센터 또는 외부 기관(개인정보분쟁조정위원회 1833-6972, 대검찰청 사이버수사과 등)에 문의하실 수 있습니다.
            </p>
          </section>

          {/* 제11조 고지 의무 */}
          <section id="sec11" className={styles.section}>
            <h3>제11조 개인정보 처리방침 고지</h3>
            <p>
              본 개인정보 및 사내 지식자산 처리방침은 2026년 8월 5일부터 적용되며, 법령 및 방침 변경 시 시스템 공지사항을 통해 사전 고지합니다.
            </p>
          </section>
        </div>

        <footer className={styles.modalFooter}>
          <button type="button" className={styles.confirmButton} onClick={onClose}>
            확인
          </button>
        </footer>
      </div>
    </div>
  )
}
