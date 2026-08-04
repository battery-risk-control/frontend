import { useMemo, useState } from 'react'
import { Header } from '../../../components/layout/Header'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { ComparisonChart } from '../components/ComparisonChart'
import { VendorRiskHistory } from '../components/VendorRiskHistory'
import { QueryState } from '../components/QueryState'
import { GlobalRiskBoard } from '../../../components/widgets/GlobalRiskBoard'
import { useStrategyDashboard, useGlobalRiskBoard } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './PlanningDashboardPage.module.css'

const ALL_UNITS = '전체'

/**
 * 2계층 경영기획팀 대시보드 (Seq 25) — "전략 대시보드" 탭. Figma "경영기획팀 대시보드" 프레임
 * 기준으로 좌측 사이드바(7탭 공용, `PLANNING_SIDE_NAV_ITEMS`) + 단일 컬럼(KPI 요약 카드 →
 * 핵심 시각화 및 비교 → 협력사 리스크 이력 및 탐색) 구조를 따른다. 2026-08-02 — 사이드바를
 * 2항목 해시 placeholder에서 7탭 실제 라우트로 확장. 2026-08-03 — 사업부 드롭다운을 실기능화
 * (risk_exposure_by_unit만 클라이언트 측 필터 — vendor_risk_history엔 사업부 필드가 없어
 * 필터 대상에서 제외, 억지로 안 맞는 필터링 흉내 안 냄). 기간/달력/알림은 여전히 장식용
 * 텍스트라 인터랙티브한 사업부 드롭다운과 혼동되지 않도록 배경/테두리를 뺐다.
 */
export function PlanningDashboardPage() {
  const query = useStrategyDashboard()
  const mapQuery = useGlobalRiskBoard()
  const [selectedUnit, setSelectedUnit] = useState(ALL_UNITS)

  const filteredExposure = useMemo(() => {
    if (!query.data) return []
    if (selectedUnit === ALL_UNITS) return query.data.risk_exposure_by_unit
    return query.data.risk_exposure_by_unit.filter((item) => item.business_unit === selectedUnit)
  }, [query.data, selectedUnit])

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <header className={styles.topBar}>
            <h1 className={styles.heading}>경영기획팀 대시보드</h1>
            <div className={styles.filters}>
              <select
                className={styles.filterSelect}
                value={selectedUnit}
                onChange={(event) => setSelectedUnit(event.target.value)}
                aria-label="사업부 필터"
              >
                <option value={ALL_UNITS}>사업부 전체</option>
                {(query.data?.risk_exposure_by_unit ?? []).map((item) => (
                  <option key={item.business_unit} value={item.business_unit}>
                    {item.business_unit}
                  </option>
                ))}
              </select>
              <span className={styles.filterLabel}>2026년 2분기</span>
              <span className={styles.filterLabel}>달력</span>
              <span className={styles.filterLabel}>알림</span>
            </div>
          </header>
          <QueryState query={query}>
            {(dashboard) => <KpiSummaryCards items={dashboard.kpi_summary} />}
          </QueryState>
          <QueryState query={mapQuery}>{(items) => <GlobalRiskBoard items={items} />}</QueryState>
          <QueryState query={query}>
            {(dashboard) => (
              <>
                <ComparisonChart items={filteredExposure} />
                <VendorRiskHistory items={dashboard.vendor_risk_history} />
              </>
            )}
          </QueryState>
        </main>
      </div>
    </div>
  )
}
