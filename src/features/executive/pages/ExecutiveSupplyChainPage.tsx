import {
  ExecutivePageLayout,
} from '../components/ExecutivePageLayout'
import {
  ExecutiveSummaryPanel,
} from '../components/ExecutiveSummaryPanel'
import {
  ExecutiveSectionSkeleton,
} from '../components/ExecutiveSectionSkeleton'
import type { EntityBadgeItem, SupplierRiskRankItem } from '../../../api/types'
import { useState } from 'react'
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
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRiskRankItem | null>(null)
  const [selectedAlternative, setSelectedAlternative] = useState<EntityBadgeItem | null>(null)

  return (
    <ExecutivePageLayout
      title="공급망 현황"
      description={
        '국가별 수입 의존도와 공급사 위험 및 대체 공급사 후보를 확인합니다.'
      }
      alertCount={
        dashboard?.verification_summary
          .review_required_count ?? 0
      }
      asOf={dashboard?.as_of}
      detailKey={selectedSupplier || selectedAlternative ? JSON.stringify(selectedSupplier ?? selectedAlternative) : null}
      aside={selectedSupplier || selectedAlternative ? (
        <SupplierDetail supplier={selectedSupplier} alternative={selectedAlternative} />
      ) : <ExecutiveSummaryPanel
          dashboard={dashboard}
          loading={loading}
        />
      }
    >
      {loading && (
        <>
          <ExecutiveSectionSkeleton variant="list" rows={4} />
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
                'executive-dependency-heading'
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
                            role="button"
                            tabIndex={0}
                            onClick={() => { setSelectedSupplier(supplier); setSelectedAlternative(null) }}
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
                            role="button"
                            tabIndex={0}
                            onClick={() => { setSelectedAlternative(supplier); setSelectedSupplier(null) }}
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

function SupplierDetail({ supplier, alternative }: {
  supplier: SupplierRiskRankItem | null
  alternative: EntityBadgeItem | null
}) {
  return (
    <aside className={styles.section}>
      <div className={styles.sectionHeader}><h2>공급사 상세</h2></div>
      {supplier ? (
        <div className={styles.list}>
          <Detail label="공급사" value={supplier.vendor_name} />
          <Detail label="ERP 공급사 ID" value={supplier.vendor_id} />
          <Detail label="최근 90일 위험" value={`${supplier.risk_count_90d}건`} />
          <Detail label="승인 상태" value={supplier.approved_status} />
          <Detail label="연결 사업부" value={supplier.linked_units.length ? supplier.linked_units.join(', ') : '연결 정보 없음'} />
        </div>
      ) : alternative ? (
        <div className={styles.list}>
          <Detail label="대체 공급사" value={alternative.primary} />
          <Detail label="후보 ID" value={alternative.id} />
          <Detail label="추천 사유" value={alternative.secondary ?? '검토 필요'} />
          <Detail label="승인 상태" value={alternative.badge?.label ?? '확인 필요'} />
          <p className={styles.empty}>구매팀은 공급 가능 수량과 납기를 확인한 뒤 전환 여부를 결정합니다.</p>
        </div>
      ) : null}
    </aside>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className={styles.listItem}><span>{label}</span><strong>{value}</strong></div>
}
