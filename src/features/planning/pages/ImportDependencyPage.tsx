import { useState } from 'react'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { EntityBadgeList } from '../components/EntityBadgeList'
import { QueryState } from '../components/QueryState'
import { useImportDependency } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './ImportDependencyPage.module.css'

/**
 * 2계층 수입 의존도 탭. 국가·사업부 이중 관점에서 공급망 집중도를 점검한다(1계층 수입
 * 의존도 패널은 자재 1건의 국가 breakdown만 보여줘 사업부 축이 없음).
 */
export function ImportDependencyPage() {
  const query = useImportDependency()
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null)

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>수입 의존도 분석</h1>
            <p className={styles.subheading}>국가·사업부 이중 관점에서 공급망 집중도를 점검합니다</p>
          </div>
          <QueryState query={query}>
            {(dashboard) => {
              const countryItems = dashboard.by_country.map((item) => ({
                name: item.country,
                value: item.share_ratio,
                value_suffix: '%',
                tone:
                  item.share_ratio >= 80 ? ('critical' as const) : item.share_ratio >= 55 ? ('warning' as const) : ('normal' as const),
              }))

              // 사업부별 의존 매트릭스 — 국가가 사업부당 10개 이상으로 많아 전부 한 그래프에
              // 넣으면 항목이 너무 늘어지므로, 드롭다운으로 사업부 1개를 골라 그 국가별
              // 내역만 막대그래프로 본다.
              const units = Array.from(new Set(dashboard.by_unit.map((item) => item.business_unit)))
              const activeUnit = selectedUnit && units.includes(selectedUnit) ? selectedUnit : units[0]
              const unitItems = dashboard.by_unit
                .filter((item) => item.business_unit === activeUnit)
                .map((item) => ({
                  name: item.country,
                  value: item.share_ratio,
                  value_suffix: '%',
                  tone: item.share_ratio >= 80 ? ('critical' as const) : ('normal' as const),
                }))

              return (
                <>
                  <KpiSummaryCards items={dashboard.kpi_summary} />
                  <div className={styles.grid2}>
                    <RankedBarChart title="국가별 의존도" caption="전 자재 가중 평균" items={countryItems} />
                    <RankedBarChart
                      title="사업부별 의존 매트릭스"
                      caption="선택한 사업부의 국가별 내역"
                      items={unitItems}
                      titleAction={
                        <select
                          className={styles.unitSelect}
                          value={activeUnit}
                          onChange={(event) => setSelectedUnit(event.target.value)}
                          aria-label="사업부 선택"
                        >
                          {units.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      }
                    />
                  </div>
                  <EntityBadgeList title="대체 공급망 후보" items={dashboard.alternative_suppliers} />
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
