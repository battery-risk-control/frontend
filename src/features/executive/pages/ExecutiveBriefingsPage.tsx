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

export function ExecutiveBriefingsPage() {
  const {
    dashboard,
    loading,
    errorMessage,
  } = useExecutiveDashboard()

  return (
    <ExecutivePageLayout
      title="AI 브리핑"
      description={
        '멀티에이전트가 생성한 최근 공급망 위험 브리핑을 확인합니다.'
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
          AI 브리핑을 조회하고 있습니다.
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
          <section
            className={styles.section}
            aria-labelledby={
              'executive-briefings-heading'
            }
          >
            <div
              className={
                styles.sectionHeader
              }
            >
              <div>
                <h2
                  id={
                    'executive-briefings-heading'
                  }
                >
                  최근 AI 브리핑
                </h2>
              </div>

              <span className={styles.count}>
                {
                  dashboard
                    .recent_briefings
                    .length
                }
                건
              </span>
            </div>

            {dashboard
              .recent_briefings
              .length === 0 ? (
              <Message>
                아직 생성된 AI 브리핑이 없습니다.
              </Message>
            ) : (
              <div
                className={
                  styles.briefingList
                }
              >
                {dashboard
                  .recent_briefings
                  .map((briefing) => (
                    <article
                      key={
                        briefing.risk_event_id
                      }
                      className={
                        styles.briefingItem
                      }
                    >
                      <div>
                        <span
                          className={
                            styles[
                              gradeTone(
                                briefing.grade,
                              )
                            ]
                          }
                        >
                          {briefing.grade}
                        </span>

                        <strong>
                          {briefing.headline}
                        </strong>
                      </div>

                      <p>
                        {briefing.material}
                        {' · '}
                        {
                          briefing.business_unit
                        }
                      </p>
                    </article>
                  ))}
              </div>
            )}
          </section>
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

function gradeTone(
  grade: string,
): 'critical' | 'warning' | 'normal' {
  if (grade === '심각') {
    return 'critical'
  }

  if (grade === '주의') {
    return 'warning'
  }

  return 'normal'
}
