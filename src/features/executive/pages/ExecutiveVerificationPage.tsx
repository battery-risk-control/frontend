import {
  ExecutivePageLayout,
} from '../components/ExecutivePageLayout'
import {
  ExecutiveSummaryPanel,
} from '../components/ExecutiveSummaryPanel'
import {
  useExecutiveDashboard,
} from '../useExecutiveDashboard'
import styles from '../components/ExecutiveDashboardSections.module.css'

export function ExecutiveVerificationPage() {
  const {
    dashboard,
    loading,
    errorMessage,
  } = useExecutiveDashboard()

  return (
    <ExecutivePageLayout
      eyebrow="Agent Verification"
      title="AI 검증"
      description={
        'ERP 근거, 계약 RAG 근거와 멀티에이전트 검증 상태를 확인합니다.'
      }
      alertCount={
        dashboard?.verification_summary
          .review_required_count ?? 0
      }
      aside={
        <ExecutiveSummaryPanel
          dashboard={dashboard}
          loading={loading}
        />
      }
    >
      {loading && (
        <Message>
          검증 결과를 조회하고 있습니다.
        </Message>
      )}

      {!loading &&
        errorMessage && (
          <Message>
            {errorMessage}
          </Message>
        )}

      {!loading &&
        !errorMessage &&
        dashboard && (
          <>
            <section
              className={styles.section}
              aria-labelledby={
                'executive-verification-heading'
              }
            >
              <div
                className={
                  styles.sectionHeader
                }
              >
                <div>
                  <p className={styles.eyebrow}>
                    Verification Summary
                  </p>

                  <h2
                    id={
                      'executive-verification-heading'
                    }
                  >
                    멀티에이전트 검증 요약
                  </h2>
                </div>
              </div>

              <div
                className={
                  styles.verificationGrid
                }
              >
                <VerificationItem
                  label="전체 검증"
                  value={
                    dashboard
                      .verification_summary
                      .total_count
                  }
                />

                <VerificationItem
                  label="검증 통과"
                  value={
                    dashboard
                      .verification_summary
                      .passed_count
                  }
                  tone="success"
                />

                <VerificationItem
                  label="검토 필요"
                  value={
                    dashboard
                      .verification_summary
                      .review_required_count
                  }
                  tone="warning"
                />

                <VerificationItem
                  label="ERP 근거 누락"
                  value={
                    dashboard
                      .verification_summary
                      .erp_evidence_missing_count
                  }
                  tone="warning"
                />

                <VerificationItem
                  label="계약 근거 누락"
                  value={
                    dashboard
                      .verification_summary
                      .contract_evidence_missing_count
                  }
                  tone="warning"
                />

                <VerificationItem
                  label="LLM 경고"
                  value={
                    dashboard
                      .verification_summary
                      .llm_warning_count
                  }
                  tone="critical"
                />
              </div>
            </section>

            <section
              className={styles.section}
              aria-labelledby={
                'executive-verification-guide-heading'
              }
            >
              <div
                className={
                  styles.sectionHeader
                }
              >
                <div>
                  <p className={styles.eyebrow}>
                    Validation Guide
                  </p>

                  <h2
                    id={
                      'executive-verification-guide-heading'
                    }
                  >
                    검증 항목 설명
                  </h2>
                </div>
              </div>

              <div className={styles.twoColumn}>
                <article
                  className={styles.listItem}
                >
                  <div>
                    <strong>
                      ERP 근거
                    </strong>

                    <span>
                      재고일수, 안전재고,
                      입고 예정일과 공급사 의존도를
                      검증합니다.
                    </span>
                  </div>
                </article>

                <article
                  className={styles.listItem}
                >
                  <div>
                    <strong>
                      계약 RAG 근거
                    </strong>

                    <span>
                      검색된 계약 ID와 페이지,
                      납기·위약금·해지 조항의
                      존재를 검증합니다.
                    </span>
                  </div>
                </article>

                <article
                  className={styles.listItem}
                >
                  <div>
                    <strong>
                      위험 등급 일치
                    </strong>

                    <span>
                      규칙 엔진의 최종 위험 단계와
                      AI 브리핑 표현이 일치하는지
                      확인합니다.
                    </span>
                  </div>
                </article>

                <article
                  className={styles.listItem}
                >
                  <div>
                    <strong>
                      LLM 경고
                    </strong>

                    <span>
                      입력에 없는 사실이나
                      확인되지 않은 근거가 포함됐는지
                      확인합니다.
                    </span>
                  </div>
                </article>
              </div>
            </section>
          </>
        )}
    </ExecutivePageLayout>
  )
}

function Message({
  children,
}: {
  children: string
}) {
  return (
    <div className={styles.empty}>
      {children}
    </div>
  )
}

function VerificationItem({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: number
  tone?:
    | 'success'
    | 'warning'
    | 'critical'
    | 'neutral'
}) {
  return (
    <article
      className={
        styles.verificationItem
      }
    >
      <span>
        {label}
      </span>

      <strong className={styles[tone]}>
        {value}건
      </strong>
    </article>
  )
}
