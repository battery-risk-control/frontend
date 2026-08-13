import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AiBriefingDetail } from '../../../api/types'
import { ExecutivePageLayout } from '../components/ExecutivePageLayout'
import { ExecutiveEvidencePanel, type EvidenceTab } from '../components/ExecutiveEvidencePanel'
import { ExecutiveSectionSkeleton } from '../components/ExecutiveSectionSkeleton'
import { useExecutiveDashboard } from '../useExecutiveDashboard'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import styles from '../components/ExecutiveDashboardSections.module.css'

export function ExecutiveBriefingsPage() {
  const { dashboard, loading, errorMessage } = useExecutiveDashboard()
  const evidence = useExecutiveEvidence()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<AiBriefingDetail | null>(null)
  const [tab, setTab] = useState<EvidenceTab>('summary')
  const requestedBriefingId = searchParams.get('briefing')
  const requestedItem = requestedBriefingId
    ? evidence.items.find((item) => item.briefing_id === requestedBriefingId) ?? null
    : null
  const selectedItem = requestedItem ?? selected ?? evidence.items[0] ?? null

  function chooseBriefing(item: AiBriefingDetail) {
    setSelected(item)
    setTab('summary')
    setSearchParams({ briefing: item.briefing_id }, { replace: true })
  }

  return (
    <ExecutivePageLayout
      title="AI 브리핑"
      description="구매 위험의 영향, 근거와 권고 조치를 경영진 관점에서 확인합니다."
      alertCount={dashboard?.verification_summary.review_required_count ?? 0}
      asOf={dashboard?.as_of}
      detailKey={selected?.briefing_id ?? null}
      aside={<ExecutiveEvidencePanel item={selectedItem} tab={tab} onTabChange={setTab} mode="briefing" />}
    >
      {(loading || evidence.loading) && <ExecutiveSectionSkeleton variant="list" rows={5} />}
      {!loading && errorMessage && <Message>{errorMessage}</Message>}
      {!evidence.loading && evidence.errorMessage && <Message>{evidence.errorMessage}</Message>}
      {!evidence.loading && !evidence.errorMessage && (
        <section className={styles.section} aria-labelledby="executive-briefings-heading">
          <div className={styles.sectionHeader}>
            <h2 id="executive-briefings-heading">최근 AI 브리핑</h2>
            <span className={styles.count}>
              최근 {evidence.items.length}건 / 전체 {evidence.totalCount}건
            </span>
          </div>
          {evidence.items.length === 0 ? <Message>아직 생성된 AI 브리핑이 없습니다.</Message> : (
            <div className={styles.briefingList}>
              {evidence.items.map((item) => (
                <button
                  key={item.briefing_id}
                  type="button"
                  className={item.briefing_id === selectedItem?.briefing_id
                    ? `${styles.briefingItem} ${styles.briefingItemSelected}`
                    : styles.briefingItem}
                  aria-pressed={item.briefing_id === selectedItem?.briefing_id}
                  onClick={() => chooseBriefing(item)}
                >
                  <div className={styles.briefingBody}>
                    <div className={styles.briefingTopline}>
                      <span className={styles[levelTone(item.procurement_risk_level)]}>{levelLabel(item.procurement_risk_level)}</span>
                      <span className={styles.verified}>
                        권고 조치 {item.recommended_actions.length}건
                        {isTranslationPending(item) ? ' · 번역 대기' : ''}
                      </span>
                    </div>
                    <strong>{item.subject_title ?? item.source_headline ?? item.material_name ?? '공급망 위험 브리핑'}</strong>
                    <p>
                      {item.recommended_actions[0]
                        ?? `${item.material_name ?? item.material_category ?? '원자재'} 관련 경영 의사결정 요약`}
                    </p>
                  </div>
                  <span className={styles.briefingScore}>{item.procurement_risk_score.toFixed(0)}점</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </ExecutivePageLayout>
  )
}

function Message({ children }: { children: string }) { return <div className={styles.empty}>{children}</div> }
function isTranslationPending(item: AiBriefingDetail) {
  const title = item.subject_title ?? item.source_headline ?? ''
  return Boolean(title) && !/[가-힣]/.test(title)
}
function levelTone(level: string): 'critical' | 'warning' | 'normal' {
  if (level === 'CRITICAL') return 'critical'
  if (level === 'WARNING') return 'warning'
  return 'normal'
}
function levelLabel(level: string) {
  if (level === 'CRITICAL') return '심각'
  if (level === 'WARNING') return '주의'
  return '정상'
}
