import { useParams } from 'react-router-dom'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { Breadcrumb } from '../../../components/layout/Breadcrumb'
import { QueryState } from '../components/QueryState'
import { useContractDetail } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './ContractDetailPage.module.css'

/**
 * 2계층 계약 현황 드릴다운(`/planning/contract/:contractNumber`). 1계층 BriefingDetailPage와
 * 동일 골격 — 목록 캐시(EntityBadgeItem)엔 없는 공급사·자재·문서 목록까지 백엔드 단건 상세로 새로 조회한다.
 */
export function ContractDetailPage() {
  const { contractNumber } = useParams<{ contractNumber: string }>()
  const query = useContractDetail(contractNumber ?? '')

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <Breadcrumb items={[{ label: '경영기획팀 대시보드', href: '/planning' }, { label: '계약 상세' }]} />
          <QueryState query={query}>
            {(detail) => (
              <>
                <div className={styles.titleRow}>
                  <h1 className={styles.heading}>{detail.contract_name}</h1>
                  <span className={styles.statusBadge}>{detail.status}</span>
                </div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>계약 개요</h2>
                  <dl className={styles.infoGrid}>
                    <div>
                      <dt>계약 번호</dt>
                      <dd>{detail.contract_number}</dd>
                    </div>
                    <div>
                      <dt>공급사</dt>
                      <dd>{detail.supplier_name}</dd>
                    </div>
                    <div>
                      <dt>자재</dt>
                      <dd>{detail.material_name ?? '미지정'}</dd>
                    </div>
                    <div>
                      <dt>사업부</dt>
                      <dd>{detail.business_unit ?? '미지정'}</dd>
                    </div>
                    <div>
                      <dt>계약 시작일</dt>
                      <dd>{detail.start_date ?? '미지정'}</dd>
                    </div>
                    <div>
                      <dt>계약 종료일</dt>
                      <dd>{detail.end_date ?? '미지정'}</dd>
                    </div>
                  </dl>
                </section>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>적재 문서</h2>
                  {detail.documents.length > 0 ? (
                    <ul className={styles.documentList}>
                      {detail.documents.map((doc) => (
                        <li key={doc.document_id} className={styles.documentItem}>
                          <span className={styles.documentName}>{doc.original_file_name}</span>
                          <span className={styles.documentMeta}>
                            {doc.processing_status} · 청크 {doc.chunk_count}건
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.empty}>적재된 문서가 없습니다.</p>
                  )}
                </section>
              </>
            )}
          </QueryState>
        </main>
      </div>
      <Footer />
    </div>
  )
}
