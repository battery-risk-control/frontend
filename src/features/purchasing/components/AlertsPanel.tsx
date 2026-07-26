import { useRef } from 'react'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import type { RiskEvent } from '../../../api/types'
import styles from './AlertsPanel.module.css'

interface AlertsPanelProps {
  events: RiskEvent[]
}

/**
 * 주요 알림 및 빠른 작업. 등급이 '심각'이거나 신뢰도가 '경고'인 risk_event를 우선 노출한다.
 * 뷰포트에 sticky로 고정되고(`position:sticky; height:100vh`) 내부 콘텐츠만 독립적으로
 * 스크롤한다(페이지 스크롤과 함께 사라지지 않음) — 스크롤바는 숨기고, 실제로 오버플로할
 * 때만 상/하단 힌트를 표시한다(`SideNav`와 동일한 `useScrollOverflowHint` 공용 훅 재사용).
 *
 * 사용 예:
 *   <AlertsPanel events={events} />
 */
export function AlertsPanel({ events }: AlertsPanelProps) {
  const alerts = events.filter((event) => event.grade === '심각' || event.confidence_label === '경고')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(scrollRef, true)

  return (
    <aside className={styles.wrapper} aria-labelledby="alerts-heading">
      <div ref={scrollRef} className={styles.panel}>
        <h2 id="alerts-heading" className={styles.title}>
          주요 알림 및 빠른 작업
        </h2>
        {alerts.length === 0 ? (
          <p className={styles.empty}>표시할 알림이 없습니다.</p>
        ) : (
          <ul className={styles.list}>
            {alerts.map((event) => (
              <li key={event.risk_event_id} className={styles.item}>
                <div className={styles.badges}>
                  <RiskGradeBadge grade={event.grade} />
                  <ConfidenceBadge label={event.confidence_label} />
                </div>
                <p className={styles.summary}>{event.market_context.event_summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasOverflowTop && (
        <div className={styles.overflowHintTop} aria-hidden="true">
          <span className={styles.overflowArrow}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </span>
        </div>
      )}
      {hasOverflowBottom && (
        <div className={styles.overflowHintBottom} aria-hidden="true">
          <span className={styles.overflowArrow}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      )}
    </aside>
  )
}
