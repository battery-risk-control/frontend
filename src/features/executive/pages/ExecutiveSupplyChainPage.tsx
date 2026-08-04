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

export function ExecutiveSupplyChainPage() {
  const {
    dashboard,
    loading,
    errorMessage,
  } = useExecutiveDashboard()

  return (
    <ExecutivePageLayout
      eyebrow="Supply Chain"
      title="공급망 현황"
      description={
        '국가별 수입 의존도와 공급사 위험 및 대체 공급사 후보를 확인합니다.'
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
          공급망 데이터를 조회하고 있습니다.
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
                'executive-dependency-heading'
              }
            >
              <div
                className={
                  styles.sectionHeader
                }
              >
                <div>
                  <p className={styles.eyebrow}>
                    Import Dependency
                  </p>

                  <h2
                    id={
                      'executive-dependency-heading'
                    }
                  >
                    국가별 수입 의존도
                  </h2>
                </div>
              </div>

              {dashboard
                .country_dependency
                .length === 0 ? (
                <Message>
                  수입 의존도 데이터가 없습니다.
                </Message>
              ) : (
                <div
                  className={
                    styles.dependencyList
                  }
                >
                  {dashboard
                    .country_dependency
                    .map((item) => (
                      <div
                        key={item.country}
                        className={
                          styles.dependencyRow
                        }
                      >
                        <strong>
                          {item.country}
                        </strong>

                        <div
                          className={
                            styles.barTrack
                          }
                        >
                          <span
                            className={
                              styles.dependencyFill
                            }
                            style={{
                              width:
                                `${clampPercent(
                                  item.share_ratio,
                                )}%`,
                            }}
                          />
                        </div>

                        <span>
                          {item.share_ratio
                            .toFixed(1)}
                          %
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section
              className={styles.section}
              aria-labelledby={
                'executive-supplier-heading'
              }
            >
              <div
                className={
                  styles.sectionHeader
                }
              >
                <div>
                  <p className={styles.eyebrow}>
                    Supplier Status
                  </p>

                  <h2
                    id={
                      'executive-supplier-heading'
                    }
                  >
                    공급사 위험 및 대체 후보
                  </h2>
                </div>
              </div>

              <div className={styles.twoColumn}>
                <div>
                  <h3
                    className={
                      styles.subheading
                    }
                  >
                    위험 분석 공급사
                  </h3>

                  {dashboard
                    .supplier_risks
                    .length === 0 ? (
                    <Message>
                      최근 90일 공급사 분석 이력이 없습니다.
                    </Message>
                  ) : (
                    <div className={styles.list}>
                      {dashboard
                        .supplier_risks
                        .map((supplier) => (
                          <article
                            key={
                              supplier.vendor_id
                            }
                            className={
                              styles.listItem
                            }
                          >
                            <div>
                              <strong>
                                {
                                  supplier.vendor_name
                                }
                              </strong>

                              <span>
                                {
                                  supplier.vendor_id
                                }
                                {' · '}
                                최근 위험
                                {' '}
                                {
                                  supplier.risk_count_90d
                                }
                                건
                              </span>
                            </div>

                            <StatusBadge
                              label={
                                supplier
                                  .approved_status
                              }
                            />
                          </article>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    className={
                      styles.subheading
                    }
                  >
                    추천 대체 공급사
                  </h3>

                  {dashboard
                    .alternative_suppliers
                    .length === 0 ? (
                    <Message>
                      등록된 대체 공급사 후보가 없습니다.
                    </Message>
                  ) : (
                    <div className={styles.list}>
                      {dashboard
                        .alternative_suppliers
                        .map((supplier) => (
                          <article
                            key={supplier.id}
                            className={
                              styles.listItem
                            }
                          >
                            <div>
                              <strong>
                                {
                                  supplier.primary
                                }
                              </strong>

                              <span>
                                {
                                  supplier.secondary ??
                                  '세부 조건 확인 필요'
                                }
                              </span>
                            </div>

                            <StatusBadge
                              label={
                                supplier.badge
                                  ?.label ??
                                '확인 필요'
                              }
                            />
                          </article>
                        ))}
                    </div>
                  )}
                </div>
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

function StatusBadge({
  label,
}: {
  label: string
}) {
  const normalized =
    label.toUpperCase()

  const tone =
    normalized === 'APPROVED'
      ? 'success'
      : normalized === 'REVIEW'
        ? 'warning'
        : 'neutral'

  return (
    <span className={styles[tone]}>
      {label}
    </span>
  )
}

function clampPercent(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(0, value),
  )
}