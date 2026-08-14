import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { KpiSummaryCards } from '../components/KpiSummaryCards'
import { RankedBarChart } from '../components/RankedBarChart'
import { EntityBadgeList } from '../components/EntityBadgeList'
import { QueryState } from '../components/QueryState'
import { useContractStatus } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import { useAuthState } from '../../../lib/useAuthState'
import { downloadContractDocument } from '../../../api/contractRag.api'
import { saveBlob } from '../../../lib/saveBlob'
import styles from './ContractStatusPage.module.css'

/**
 * 2계층 계약 현황 탭. 사업부별 계약 커버리지와 만료 리스크를 전사 관점에서 본다(1계층
 * 계약·RAG는 조항 검색 중심이라 사업부 축이 없음).
 */
export function ContractStatusPage() {
  const query = useContractStatus()
  const { accessToken } = useAuthState()
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'DOCUMENT' | 'RAG'>('ALL')
  const [unitFilter, setUnitFilter] = useState<string | null>(null)

  async function handleDownload(documentId: string) {
    if (!accessToken) return
    const file = await downloadContractDocument(accessToken, documentId)
    if ('error' in file) return
    saveBlob(file.blob, file.fileName)
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>계약 현황</h1>
            <p className={styles.subheading}>사업부별 계약 커버리지와 만료 리스크를 전사 관점에서 봅니다</p>
          </div>
          <QueryState query={query}>
            {(dashboard) => {
              const coverageItems = dashboard.coverage_by_unit.map((item) => ({
                name: item.business_unit,
                value: item.contract_count,
                value_suffix: '건',
                tone: 'neutral' as const,
              }))
              const contracts = dashboard.contracts.filter((contract) => {
                if (unitFilter && contract.business_unit !== unitFilter) return false
                if (statusFilter === 'ACTIVE' && contract.status !== 'ACTIVE') return false
                if (statusFilter === 'EXPIRING') {
                  if (!contract.end_date) return false
                  const days = (new Date(contract.end_date).getTime() - Date.now()) / 86_400_000
                  if (days < 0 || days > 30) return false
                }
                if (statusFilter === 'DOCUMENT' && !contract.document_loaded) return false
                if (statusFilter === 'RAG' && !contract.rag_ready) return false
                return true
              })

              return (
                <>
                  <KpiSummaryCards items={dashboard.kpi_summary} />
                  <div className={styles.grid2}>
                    <RankedBarChart title="사업부별 계약 커버리지" items={coverageItems} />
                    <EntityBadgeList
                      title="만료 임박 계약"
                      items={dashboard.expiring}
                      linkTo={(item) => `/planning/contract/${encodeURIComponent(item.id)}`}
                    />
                  </div>
                  <section className={styles.contractSection}>
                    <div className={styles.contractHeader}>
                      <h2>계약서(RAG) 목록</h2>
                      <div className={styles.filters}>
                        {(['ALL', 'ACTIVE', 'EXPIRING', 'DOCUMENT', 'RAG'] as const).map((filter) => (
                          <button key={filter} type="button"
                            className={statusFilter === filter ? styles.activeFilter : ''}
                            onClick={() => setStatusFilter(filter)}>
                            {{ ALL: '전체', ACTIVE: 'ACTIVE', EXPIRING: '만료 임박', DOCUMENT: '문서 적재', RAG: 'RAG 검색 가능' }[filter]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className={styles.unitFilters}>
                      <button type="button" className={!unitFilter ? styles.activeFilter : ''} onClick={() => setUnitFilter(null)}>전체 사업부</button>
                      {dashboard.coverage_by_unit.map((unit) => (
                        <button type="button" key={unit.business_unit}
                          className={unitFilter === unit.business_unit ? styles.activeFilter : ''}
                          onClick={() => setUnitFilter(unit.business_unit)}>{unit.business_unit}</button>
                      ))}
                    </div>
                    <div className={styles.tableWrap}>
                      <table>
                        <thead><tr><th>계약번호</th><th>계약명</th><th>공급사</th><th>사업부</th><th>상태</th><th>문서/RAG</th><th>다운로드</th></tr></thead>
                        <tbody>
                          {contracts.map((contract) => (
                            <tr key={contract.contract_number}>
                              <td>{contract.contract_number}</td><td>{contract.contract_name}</td>
                              <td>{contract.supplier_name}</td><td>{contract.business_unit ?? '미분류'}</td>
                              <td>{contract.status}</td>
                              <td>{contract.document_loaded ? (contract.rag_ready ? 'RAG 가능' : '처리 중') : '미적재'}</td>
                              <td>{contract.documents.map((document) => (
                                <button className={styles.download} type="button" key={document.document_id}
                                  onClick={() => void handleDownload(document.document_id)}>다운로드</button>
                              ))}</td>
                            </tr>
                          ))}
                          {contracts.length === 0 && <tr><td colSpan={7} className={styles.empty}>조건에 맞는 계약이 없습니다.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </section>
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
import { useState } from 'react'
