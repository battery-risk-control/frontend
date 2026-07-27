import { useRef } from 'react'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import type { RiskEvent } from '../../../api/types'
import styles from './AlertsPanel.module.css'

/** 접힌 상태에서 호버 미리보기에 보여줄 상위 개수 — design-tokens.md d항목("리스트 항목 4개
 * 초과 시 overflow")과 일관되게 4로 둔다. */
const PREVIEW_COUNT = 4

interface AlertsPanelProps {
  /** 이미 `selectAlertEvents`로 필터링된 목록 — 이 컴포넌트는 필터링하지 않는다. */
  alerts: RiskEvent[]
  expanded: boolean
  isPreviewing: boolean
  onPreviewMouseEnter: () => void
  onPreviewMouseLeave: () => void
}

function AlertItem({ event }: { event: RiskEvent }) {
  return (
    <li className={styles.item}>
      <div className={styles.badges}>
        <RiskGradeBadge grade={event.grade} />
        <ConfidenceBadge label={event.confidence_label} />
      </div>
      <p className={styles.summary}>{event.market_context.event_summary}</p>
    </li>
  )
}

/**
 * 주요 알림 및 빠른 작업. `AlertsPanelContext`(`expanded`)로 펼침/접힘 상태를 페이지 이동
 * 간에도 유지한다(트리거인 `AlertsBellButton`은 Header 쪽에 있어 상태를 공유해야 함).
 *
 * - 펼침(`expanded`): 기존과 동일하게 `position:sticky; height:100vh` 전체 목록을 자체
 *   스크롤(`useScrollOverflowHint`)로 보여준다 — "앱 뼈대" 성격이라 `ScrollCard`를 쓰지
 *   않는다(design-tokens.md 스크롤 원칙, SideNav와 동급).
 * - 접힘(`!expanded`): 이 컴포넌트가 차지하던 우측 자리 자체가 폭 0으로 사라진다
 *   (SideNav 접기와 동일한 width 트랜지션 패턴). 이 상태에서 헤더의 `AlertsBellButton`을
 *   호버하면(`isPreviewing`) 같은 자리에 상위 `PREVIEW_COUNT`개 + `ScrollCard`로 감싼
 *   미리보기가 `position:absolute`로 떠서 나타난다 — 이때만 `ScrollCard`를 쓴다(이 순간의
 *   미리보기는 고정 배치된 "앱 뼈대"가 아니라 일시적으로 뜨는 카드형 UI라는 판단).
 *   미리보기 자체에서 마우스가 벗어나도 안 닫히도록(hoverable) `onPreviewMouseEnter`/
 *   `onPreviewMouseLeave`를 그대로 연결한다 — 실제 닫힘 판정(디바운스)은 트리거·미리보기
 *   양쪽 이벤트를 종합해야 해서 `PurchasingDashboardPage`가 맡는다.
 *
 * 사용 예:
 *   <AlertsPanel alerts={alerts} expanded={expanded} isPreviewing={isPreviewing}
 *     onPreviewMouseEnter={handlePreviewEnter} onPreviewMouseLeave={handlePreviewLeave} />
 */
export function AlertsPanel({ alerts, expanded, isPreviewing, onPreviewMouseEnter, onPreviewMouseLeave }: AlertsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(scrollRef, expanded)

  const wrapperClassName = [styles.wrapper, !expanded && styles.collapsed, isPreviewing && styles.previewing]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={wrapperClassName} aria-labelledby={expanded ? 'alerts-heading' : undefined}>
      {expanded && (
        <>
          <div ref={scrollRef} className={styles.panel}>
            <h2 id="alerts-heading" className={styles.title}>
              주요 알림 및 빠른 작업
            </h2>
            {alerts.length === 0 ? (
              <p className={styles.empty}>표시할 알림이 없습니다.</p>
            ) : (
              <ul className={styles.list}>
                {alerts.map((event) => (
                  <AlertItem key={event.risk_event_id} event={event} />
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
        </>
      )}
      {!expanded && (
        <div
          className={isPreviewing ? `${styles.previewOverlay} ${styles.previewVisible}` : styles.previewOverlay}
          onMouseEnter={onPreviewMouseEnter}
          onMouseLeave={onPreviewMouseLeave}
          aria-hidden={!isPreviewing}
        >
          <ScrollCard headingId="alerts-preview-heading" title="주요 알림 및 빠른 작업">
            {alerts.length === 0 ? (
              <p className={styles.empty}>표시할 알림이 없습니다.</p>
            ) : (
              <ul className={styles.list}>
                {alerts.slice(0, PREVIEW_COUNT).map((event) => (
                  <AlertItem key={event.risk_event_id} event={event} />
                ))}
              </ul>
            )}
          </ScrollCard>
        </div>
      )}
    </aside>
  )
}
