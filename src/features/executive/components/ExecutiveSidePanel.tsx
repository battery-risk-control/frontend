import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useExecutiveEvidence } from '../useExecutiveEvidence'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import styles from './ExecutiveSidePanel.module.css'

type Tab = 'detail' | 'alerts' | 'briefings'

interface Props {
  detail: ReactNode
  alertCount: number
  requestedTab?: Tab
}

export function ExecutiveSidePanel({ detail, alertCount, requestedTab = 'detail' }: Props) {
  const evidence = useExecutiveEvidence()
  const [activeTab, setActiveTab] = useState<Tab>(requestedTab)
  const [previousRequestedTab, setPreviousRequestedTab] = useState(requestedTab)
  if (requestedTab !== previousRequestedTab) {
    setPreviousRequestedTab(requestedTab)
    setActiveTab(requestedTab)
  }

  return (
    <aside className={styles.wrapper} aria-label="경영진 상세 패널">
      <div className={styles.tabs} role="tablist">
        <TabButton active={activeTab === 'detail'} onClick={() => setActiveTab('detail')}>상세</TabButton>
        <TabButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} count={alertCount}>주요 알림</TabButton>
        <TabButton active={activeTab === 'briefings'} onClick={() => setActiveTab('briefings')}>브리핑</TabButton>
      </div>
      <div className={styles.content}>
        {activeTab === 'detail' && (
          <div className={styles.detailSummary}>{detail}</div>
        )}
        {activeTab === 'alerts' && (
          <div className={styles.listSection}>
            <div className={styles.panelHead}><h2>주요 알림</h2><Link to="/executive/verification">전체 보기</Link></div>
            {alertCount === 0 ? <p className={styles.empty}>현재 검토가 필요한 알림이 없습니다.</p> : (
              <Link className={styles.alert} to="/executive/verification">
                <strong>검토가 필요한 멀티에이전트 결과 {alertCount}건</strong>
                <span>ERP·계약 근거와 LLM 경고를 확인하세요.</span>
              </Link>
            )}
          </div>
        )}
        {activeTab === 'briefings' && (
          <div className={styles.listSection}>
            <div className={styles.panelHead}>
              <h2>최근 브리핑</h2>
              <Link to="/executive/briefings">전체 {evidence.totalCount}건</Link>
            </div>
            {evidence.loading ? (
              <div className={styles.listSection} aria-busy="true" aria-label="브리핑 불러오는 중">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className={styles.briefing}>
                    <Skeleton width="80%" />
                    <Skeleton width="45%" />
                  </div>
                ))}
              </div>
            ) : evidence.items.length === 0 ? (
              <p className={styles.empty}>저장된 브리핑이 없습니다.</p>
            ) : evidence.items.slice(0, 5).map((item) => (
              <Link
                key={item.briefing_id}
                className={styles.briefing}
                to={`/executive/briefings?briefing=${encodeURIComponent(item.briefing_id)}`}
              >
                <strong>{item.subject_title ?? item.source_headline ?? item.material_name ?? '공급망 위험 브리핑'}</strong>
                <span>
                  {item.procurement_risk_level} · {item.procurement_risk_score.toFixed(0)}점
                  {isTranslationPending(item.subject_title ?? item.source_headline) ? ' · 번역 대기' : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

    </aside>
  )
}

function TabButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} className={active ? styles.activeTab : styles.tab} onClick={onClick}>
    {children}{count != null && count > 0 && <span>{count}</span>}
  </button>
}

function isTranslationPending(title: string | null | undefined) {
  return Boolean(title) && !/[가-힣]/.test(title ?? '')
}
