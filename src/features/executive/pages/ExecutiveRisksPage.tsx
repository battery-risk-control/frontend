import {
  ExecutivePageLayout,
} from '../components/ExecutivePageLayout'
import {
  ExecutiveSummaryPanel,
} from '../components/ExecutiveSummaryPanel'
import {
  ExecutiveSectionSkeleton,
} from '../components/ExecutiveSectionSkeleton'
import { ExecutiveEvidencePanel, type EvidenceTab } from '../components/ExecutiveEvidencePanel'
import type { AiBriefingDetail } from '../../../api/types'
import { useState } from 'react'
import {
  useExecutiveDashboard,
} from '../useExecutiveDashboard'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import styles from '../components/ExecutiveDashboardSections.module.css'

export function ExecutiveRisksPage() {
  const {
    dashboard,
    loading,
    errorMessage,
  } = useExecutiveDashboard()
  const evidence = useExecutiveEvidence()
  const [selected, setSelected] = useState<AiBriefingDetail | null>(null)
  const [tab, setTab] = useState<EvidenceTab>('summary')

  return (
    <ExecutivePageLayout
      title="핵심 위험"
      description={
        '원자재별 위험 점수와 최근 위험 변화 추세를 확인합니다.'
      }
      alertCount={
        dashboard?.verification_summary
          .review_required_count ?? 0
      }
      asOf={dashboard?.kpi.latest_assessed_at}
      detailKey={selected?.briefing_id ?? null}
      aside={selected ? <ExecutiveEvidencePanel item={selected} tab={tab} onTabChange={setTab} /> :
        <ExecutiveSummaryPanel
          dashboard={dashboard}
          loading={loading}
        />
      }
    >
      {loading && (
        <>
          <ExecutiveSectionSkeleton variant="riskGrid" rows={5} />
          <ExecutiveSectionSkeleton variant="list" rows={4} />
        </>
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
                'executive-material-risk-heading'
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
                      'executive-material-risk-heading'
                    }
                  >
                    원자재 위험 순위
                  </h2>
                </div>

                <span className={styles.count}>
                  상위
                  {' '}
                  {dashboard.top_risks.length}
                  건
                </span>
              </div>

              {dashboard.top_risks
                .length === 0 ? (
                <Message>
                  아직 저장된 원자재 위험 평가가 없습니다.
                </Message>
              ) : (
                <div className={styles.riskGrid}>
                  {dashboard.top_risks.map(
                    (risk) => (
                      <article
                        key={
                          `${risk.rank}-${risk.material}`
                        }
                        className={
                          styles.riskCard
                        }
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          const match = evidence.items.find((item) =>
                            (item.material_name ?? item.material_category ?? '').toLowerCase().includes(risk.material.toLowerCase()),
                          ) ?? evidence.items[0]
                          if (match) { setSelected(match); setTab('erp') }
                        }}
                      >
                        <div
                          className={
                            styles.riskRank
                          }
                        >
                          {risk.rank}
                        </div>

                        <div
                          className={
                            styles.riskBody
                          }
                        >
                          <strong>
                            {risk.material}
                          </strong>

                          <span>
                            위험 점수
                            {' '}
                            {risk.score.toFixed(
                              1,
                            )}
                          </span>
                        </div>

                        <span
                          className={
                            styles[
                              gradeTone(
                                risk.grade,
                              )
                            ]
                          }
                        >
                          {risk.grade}
                        </span>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>

            <section
              className={styles.section}
              aria-labelledby={
                'executive-risk-trend-heading'
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
                      'executive-risk-trend-heading'
                    }
                  >
                    최근 30일 누적 위험 추세
                  </h2>
                </div>
              </div>

              {dashboard.risk_trend
                .length === 0 ? (
                <Message>
                  분석 결과가 저장되면 일별 위험 추세가 표시됩니다.
                </Message>
              ) : (
                <div
                  className={
                    styles.trendList
                  }
                >
                  {dashboard.risk_trend.map(
                    (point) => (
                      <div
                        key={point.date}
                        className={
                          styles.trendRow
                        }
                      >
                        <time>
                          {formatDate(
                            point.date,
                          )}
                        </time>

                        <div
                          className={
                            styles.barTrack
                          }
                        >
                          <span
                            className={
                              styles.barFill
                            }
                            style={{
                              width:
                                `${clampPercent(
                                  point.average_risk_score,
                                )}%`,
                            }}
                          />
                        </div>

                        <strong>
                          {point
                            .average_risk_score
                            .toFixed(1)}
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              )}
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

function clampPercent(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(0, value),
  )
}

function formatDate(
  value: string,
): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      month: '2-digit',
      day: '2-digit',
    },
  ).format(date)
}
