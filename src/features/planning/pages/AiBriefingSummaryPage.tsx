import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { QueryState } from '../components/QueryState'
import { useAiBriefing } from '../hooks/usePlanningQueries'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './AiBriefingSummaryPage.module.css'

const PAGE_SIZE = 10

/**
 * 2계층 AI 브리핑 탭. 1계층이 생성한 브리핑을 등급·사업부 단위로 취합해 보고한다(생성이
 * 아니라 취합·보고 역할 — product-overview.md 2계층 책임 정의와 일치).
 */
export function AiBriefingSummaryPage() {
  const [page, setPage] = useState(0)
  const query = useAiBriefing(page)

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>AI 브리핑 취합</h1>
            <p className={styles.subheading}>1계층이 생성한 브리핑을 등급·사업부 단위로 취합해 보고합니다</p>
          </div>
          <QueryState query={query}>
            {(dashboard) => {
              const totalPages = Math.max(1, Math.ceil(dashboard.recent_total_count / PAGE_SIZE))
              return (
                <>
                  <KpiSummaryCards items={dashboard.kpi_summary} />
                  <div className={styles.grid2}>
                    <RankedBarChart title="사업부별 브리핑 분포" items={dashboard.by_unit} />
                    <section className={styles.insightCard} aria-labelledby="recent-briefings-heading">
                      <h2 id="recent-briefings-heading" className={styles.insightTitle}>
                        최근 브리핑
                      </h2>
                      <ul className={styles.briefingList}>
                        {dashboard.recent.map((item) => (
                          <li key={item.risk_event_id} className={styles.briefingItem}>
                            <Link to={`/planning/briefing/${encodeURIComponent(item.risk_event_id)}`} className={styles.briefingLink}>
                              <div className={styles.briefingHeader}>
                                <RiskGradeBadge grade={item.grade} />
                                <span className={styles.briefingMaterial}>{item.material}</span>
                                <span className={styles.briefingUnit}>{item.business_unit}</span>
                              </div>
                              <p className={styles.briefingHeadline}>{item.headline}</p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className={styles.pagination}>
                        <button
                          type="button"
                          className={styles.pageButton}
                          onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                          disabled={page === 0}
                          aria-label="이전 페이지"
                        >
                          ‹
                        </button>
                        <span className={styles.pageLabel}>
                          {page + 1} / {totalPages}
                        </span>
                        <button
                          type="button"
                          className={styles.pageButton}
                          onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                          disabled={page >= totalPages - 1}
                          aria-label="다음 페이지"
                        >
                          ›
                        </button>
                      </div>
                    </section>
                  </div>
                </>
              )
            }}
          </QueryState>
        </main>
      </div>
      <Footer />
    </div>
  )
}
