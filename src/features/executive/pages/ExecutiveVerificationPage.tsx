import { useMemo, useState } from 'react'
import type { AiBriefingDetail } from '../../../api/types'
import { ExecutivePageLayout } from '../components/ExecutivePageLayout'
import { ExecutiveEvidencePanel, type EvidenceTab } from '../components/ExecutiveEvidencePanel'
import { ExecutiveSectionSkeleton } from '../components/ExecutiveSectionSkeleton'
import { useExecutiveDashboard } from '../useExecutiveDashboard'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import styles from '../components/ExecutiveDashboardSections.module.css'

type Filter = 'all' | 'passed' | 'review' | 'erp' | 'contract' | 'llm'

export function ExecutiveVerificationPage() {
  const { dashboard, loading, errorMessage } = useExecutiveDashboard()
  const evidence = useExecutiveEvidence()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<AiBriefingDetail | null>(null)
  const [tab, setTab] = useState<EvidenceTab>('verification')

  const filtered = useMemo(() => evidence.items.filter((item) => {
    if (filter === 'passed') return item.verification.review_passed === true
    if (filter === 'review') return item.verification.review_passed !== true
    if (filter === 'erp') return !item.erp_evidence
    if (filter === 'contract') return item.contract_findings.length === 0
    if (filter === 'llm') return Boolean(item.verification.llm_error) || item.verification.warnings.length > 0
    return true
  }), [evidence.items, filter])
  const selectedItem = selected && filtered.some((item) => item.briefing_id === selected.briefing_id)
    ? selected
    : filtered[0] ?? null

  function choose(item: AiBriefingDetail, nextTab: EvidenceTab = 'verification') {
    setSelected(item)
    setTab(nextTab)
  }

  const summary = dashboard?.verification_summary

  return (
    <ExecutivePageLayout
      title="AI 검증"
      description="ERP와 계약 RAG 근거가 최종 위험 판단에 올바르게 반영됐는지 확인합니다."
      alertCount={summary?.review_required_count ?? 0}
      asOf={dashboard?.as_of}
      detailKey={selected ? `${selected.briefing_id}:${tab}` : null}
      aside={<ExecutiveEvidencePanel item={selectedItem} tab={tab} onTabChange={setTab} mode="verification" />}
    >
      {(loading || evidence.loading) && (
        <>
          <ExecutiveSectionSkeleton variant="verificationGrid" rows={6} />
          <ExecutiveSectionSkeleton variant="list" rows={4} />
        </>
      )}
      {!loading && errorMessage && <Message>{errorMessage}</Message>}
      {!evidence.loading && evidence.errorMessage && <Message>{evidence.errorMessage}</Message>}

      {!loading && !errorMessage && dashboard && summary && (
        <>
          <section className={styles.section} aria-labelledby="executive-verification-heading">
            <div className={styles.sectionHeader}><h2 id="executive-verification-heading">저장 브리핑 누적 검증 요약</h2></div>
            <div className={styles.verificationGrid}>
              <VerificationItem label="전체 검증" value={summary.total_count} active={filter === 'all'} onClick={() => setFilter('all')} />
              <VerificationItem label="검증 통과" value={summary.passed_count} tone="success" active={filter === 'passed'} onClick={() => setFilter('passed')} />
              <VerificationItem label="검토 필요" value={summary.review_required_count} tone="warning" active={filter === 'review'} onClick={() => setFilter('review')} />
              <VerificationItem label="ERP 근거 누락" value={summary.erp_evidence_missing_count} tone="warning" active={filter === 'erp'} onClick={() => setFilter('erp')} />
              <VerificationItem label="계약 근거 누락" value={summary.contract_evidence_missing_count} tone="warning" active={filter === 'contract'} onClick={() => setFilter('contract')} />
              <VerificationItem label="LLM 경고" value={summary.llm_warning_count} tone="critical" active={filter === 'llm'} onClick={() => setFilter('llm')} />
            </div>
          </section>

          <section className={styles.section} aria-labelledby="verification-detail-heading">
            <div className={styles.sectionHeader}>
              <h2 id="verification-detail-heading">검증 대상</h2>
              <span className={styles.count}>{filtered.length}건</span>
            </div>
            {filtered.length === 0 ? <Message>선택한 조건에 해당하는 검증 대상이 없습니다.</Message> : (
              <div className={styles.list}>
                {filtered.map((item) => (
                  <button
                    key={item.briefing_id}
                    type="button"
                    className={item.briefing_id === selectedItem?.briefing_id
                      ? `${styles.listItem} ${styles.briefingItemSelected}`
                      : styles.listItem}
                    aria-pressed={item.briefing_id === selectedItem?.briefing_id}
                    onClick={() => choose(item)}
                  >
                    <div>
                      <strong>{item.subject_title ?? item.source_headline ?? item.material_name ?? '공급망 위험 분석'}</strong>
                      <span className={styles.verificationEvidenceRow}>
                        <b className={item.erp_evidence ? styles.evidenceReady : styles.evidenceMissing}>
                          ERP {item.erp_evidence ? '연결' : '누락'}
                        </b>
                        <b className={item.contract_findings.length > 0 ? styles.evidenceReady : styles.evidenceMissing}>
                          계약 RAG {item.contract_findings.length > 0 ? `${item.contract_findings.length}건` : '누락'}
                        </b>
                        <b className={item.verification.warnings.length > 0 ? styles.evidenceWarning : styles.evidenceReady}>
                          경고 {item.verification.warnings.length}건
                        </b>
                      </span>
                    </div>
                    <span className={item.verification.review_passed ? styles.success : styles.warning}>
                      {item.verification.review_passed ? '검증 통과' : '검토 필요'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section} aria-labelledby="verification-evidence-heading">
            <div className={styles.sectionHeader}><h2 id="verification-evidence-heading">근거 바로 확인</h2></div>
            <div className={styles.twoColumn}>
              <button type="button" className={styles.listItem} onClick={() => selectedItem && choose(selectedItem, 'erp')} disabled={!selectedItem}>
                <div><strong>ERP 근거</strong><span>재고·입고 일정·공급사 의존도와 공급 공백을 확인합니다.</span></div>
              </button>
              <button type="button" className={styles.listItem} onClick={() => selectedItem && choose(selectedItem, 'contract')} disabled={!selectedItem}>
                <div><strong>계약 RAG 근거</strong><span>검색된 계약 ID·페이지·납기 및 위약 조항을 확인합니다.</span></div>
              </button>
            </div>
          </section>
        </>
      )}
    </ExecutivePageLayout>
  )
}

function Message({ children }: { children: string }) {
  return <div className={styles.empty}>{children}</div>
}

function VerificationItem({ label, value, tone = 'neutral', active, onClick }: {
  label: string
  value: number
  tone?: 'success' | 'warning' | 'critical' | 'neutral'
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={styles.verificationItem} onClick={onClick} aria-pressed={active}>
      <span>{label}</span><strong className={styles[tone]}>{value}건</strong>
    </button>
  )
}
