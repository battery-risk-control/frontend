import { useState } from 'react'
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
  const [selected, setSelected] = useState<AiBriefingDetail | null>(null)
  const [tab, setTab] = useState<EvidenceTab>('summary')

  return (
    <ExecutivePageLayout
      title="AI 브리핑"
      description="구매 위험의 영향, 근거와 권고 조치를 경영진 관점에서 확인합니다."
      alertCount={dashboard?.verification_summary.review_required_count ?? 0}
      detailKey={selected?.briefing_id ?? null}
      aside={<ExecutiveEvidencePanel item={selected ?? evidence.items[0] ?? null} tab={tab} onTabChange={setTab} />}
    >
      {(loading || evidence.loading) && <ExecutiveSectionSkeleton variant="list" rows={5} />}
      {!loading && errorMessage && <Message>{errorMessage}</Message>}
      {!evidence.loading && evidence.errorMessage && <Message>{evidence.errorMessage}</Message>}
      {!evidence.loading && !evidence.errorMessage && (
        <section className={styles.section} aria-labelledby="executive-briefings-heading">
          <div className={styles.sectionHeader}>
            <h2 id="executive-briefings-heading">최근 AI 브리핑</h2>
            <span className={styles.count}>{evidence.items.length}건</span>
          </div>
          {evidence.items.length === 0 ? <Message>아직 생성된 AI 브리핑이 없습니다.</Message> : (
            <div className={styles.briefingList}>
              {evidence.items.map((item) => (
                <button key={item.briefing_id} type="button" className={styles.briefingItem} onClick={() => { setSelected(item); setTab('summary') }}>
                  <div>
                    <span className={styles[levelTone(item.procurement_risk_level)]}>{levelLabel(item.procurement_risk_level)}</span>
                    <strong>{item.subject_title ?? item.source_headline ?? item.material_name ?? '공급망 위험 브리핑'}</strong>
                  </div>
                  <p>{item.material_name ?? item.material_category ?? '원자재'} · {item.procurement_risk_score.toFixed(0)}점 · {item.verification.review_passed ? '검증 통과' : '검토 필요'}</p>
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
