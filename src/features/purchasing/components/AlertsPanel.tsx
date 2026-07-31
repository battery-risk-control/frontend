import { useRef } from 'react'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import { QuickActionsPanel } from './QuickActionsPanel'
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
 * 2차 데모 수정 1(2026-07-29): "빠른 작업"(`QuickActionsPanel`)을 별도 최상위 형제
 * 컴포넌트로 두지 않고 이 패널의 두 번째 서브섹션으로 통합했다 — 패널 제목 자체가 이미
 * "주요 알림 및 빠른 작업"이라 두 개념을 포괄하고 있었다. 첫 번째 서브섹션("주요 알림")은
 * 기존 리스트 그대로, 두 번째는 `QuickActionsPanel`을 그대로 렌더링(자체 sticky/폭 없이
 * 이 패널의 `.panel` 스크롤 영역 안에 자연스럽게 흐름). 접힌 상태 hover 미리보기는 기존과
 * 동일하게 알림 상위 4개만 보여준다(빠른 작업은 미리보기에 포함하지 않음 — 미리보기는
 * 빠르게 훑는 용도라 프레임뿐인 placeholder까지 넣으면 정보 가치 없이 공간만 차지한다).
 *
 * - 펼침(`expanded`): 기존과 동일하게 `position:sticky; height:100vh` 전체 영역을 자체
 *   스크롤(`useScrollOverflowHint`)로 보여준다 — "앱 뼈대" 성격이라 `ScrollCard`를 쓰지
 *   않는다(design-tokens.md 스크롤 원칙, SideNav와 동급). 내부 "빠른 작업" 서브섹션만
 *   예외적으로 `QuickActionsPanel`이 자체 `ScrollCard`를 쓴다(카드형 UI 원칙 적용 대상).
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
            <section className={styles.subsection} aria-labelledby="alerts-subsection-heading">
              <h3 id="alerts-subsection-heading" className={styles.subsectionTitle}>
                주요 알림
              </h3>
              {alerts.length === 0 ? (
                <p className={styles.empty}>표시할 알림이 없습니다.</p>
              ) : (
                <ul className={styles.list}>
                  {alerts.map((event) => (
                    <AlertItem key={event.risk_event_id} event={event} />
                  ))}
                </ul>
              )}
            </section>
            <div className={styles.quickActionsSection}>
              <QuickActionsPanel />
            </div>
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
