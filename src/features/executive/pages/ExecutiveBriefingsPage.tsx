import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { AiBriefingDetail, KpiSummaryItem } from '../../../api/types'
import { ExecutivePageLayout } from '../components/ExecutivePageLayout'
import { ExecutiveEvidencePanel, type EvidenceTab } from '../components/ExecutiveEvidencePanel'
import { ExecutiveSectionSkeleton } from '../components/ExecutiveSectionSkeleton'
import { KpiSummaryCards } from '../../planning/components/KpiSummaryCards'
import { useExecutiveDashboard } from '../useExecutiveDashboard'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import styles from '../components/ExecutiveDashboardSections.module.css'

export function ExecutiveBriefingsPage() {
  const { dashboard, loading, errorMessage } = useExecutiveDashboard()
  const evidence = useExecutiveEvidence()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState<AiBriefingDetail | null>(null)
  const [tab, setTab] = useState<EvidenceTab>('summary')
  // 신뢰도 '확정' 기준 = 멀티에이전트 종합 완료(composite) + 검증 통과(review_passed).
  // 브리핑까지 다 생성돼 확정된 건만 목록에 노출한다(다른 화면의 판정 기준과 동일).
  const confirmedItems = evidence.items.filter(
    (item) => item.composite && item.verification.review_passed === true,
  )
  const requestedBriefingId = searchParams.get('briefing')
  const requestedItem = requestedBriefingId
    ? confirmedItems.find((item) => item.briefing_id === requestedBriefingId) ?? null
    : null
  const selectedItem = requestedItem ?? selected ?? confirmedItems[0] ?? null

  // 확정 브리핑 기준 KPI(2계층 AI 브리핑과 동일 구성: 심각 비중 / 정상 / 주의 / 심각).
  const criticalCount = confirmedItems.filter((item) => item.procurement_risk_level === 'CRITICAL').length
  const warningCount = confirmedItems.filter((item) => item.procurement_risk_level === 'WARNING').length
  const normalCount = confirmedItems.filter((item) => item.procurement_risk_level === 'NORMAL').length
  const criticalRatio =
    confirmedItems.length > 0 ? Math.round((criticalCount / confirmedItems.length) * 1000) / 10 : 0
  const kpiItems: KpiSummaryItem[] = [
    { label: '확정 브리핑', value: confirmedItems.length, unit: '건' },
    { label: '심각 비중', value: criticalRatio, unit: '%' },
    { label: '정상', value: normalCount, unit: '건' },
    { label: '주의', value: warningCount, unit: '건' },
    { label: '심각', value: criticalCount, unit: '건' },
  ]

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
        <>
          <KpiSummaryCards items={kpiItems} />
          <section className={styles.section} aria-labelledby="executive-briefings-heading">
          <div className={styles.sectionHeader}>
            <h2 id="executive-briefings-heading">최근 AI 브리핑</h2>
            <span className={styles.count}>
              확정 브리핑 {confirmedItems.length}건
            </span>
          </div>
          {confirmedItems.length === 0 ? <Message>아직 확정된 AI 브리핑이 없습니다.</Message> : (
            <div className={styles.briefingList}>
              {confirmedItems.map((item) => (
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
        </>
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
