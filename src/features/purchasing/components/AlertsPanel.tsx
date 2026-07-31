import { useRef } from 'react'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import { QuickActionsPanel } from './QuickActionsPanel'
import type { SelectedDetail } from '../../../components/widgets/GlobalRiskBoard'
import styles from './AlertsPanel.module.css'

interface AlertsPanelProps {
  expanded: boolean
  isPreviewing: boolean
  onPreviewMouseEnter: () => void
  onPreviewMouseLeave: () => void
  /** "빠른 작업 > 마커뉴스"로 그대로 전달(2차 데모 수정 2-3) — GlobalRiskBoard의 `onSelect`
   * 콜백이 `PurchasingDashboardPage`에서 여기까지 내려온다. */
  markerNews: SelectedDetail | null
  onCloseMarkerNews: () => void
}

/**
 * 주요 알림 및 빠른 작업. `AlertsPanelContext`(`expanded`)로 펼침/접힘 상태를 페이지 이동
 * 간에도 유지한다(트리거인 `AlertsBellButton`은 Header 쪽에 있어 상태를 공유해야 함).
 *
 * 2차 데모 수정 1(2026-07-29): "빠른 작업"(`QuickActionsPanel`)을 별도 최상위 형제
 * 컴포넌트로 두지 않고 이 패널의 서브섹션으로 통합했다 — 패널 제목 자체가 이미
 * "주요 알림 및 빠른 작업"이라 두 개념을 포괄하고 있었다.
 *
 * 2차 데모 수정 2-1(2026-07-29): 펼침 상태의 "주요 알림" 서브섹션(제목+리스트) 표시
 * 코드를 제거했다 — `GlobalRiskBoard`의 "마커 클릭 시 정보 표시" 기능이 "빠른 작업 >
 * 마커뉴스"로 이양되며 같은 원본 데이터(`fetchRiskEvents`)를 다루는 두 UI가 한 패널
 * 안에 공존하는 게 중복이라는 판단(제거 대상은 표시 코드뿐 — `fetchRiskEvents`/
 * `selectAlertEvents` 등 원본 데이터/타입은 변경하지 않았다).
 *
 * 2차 데모 수정 2-1 후속(2026-07-29): 접힌 상태 hover 미리보기가 "주요 알림 상위 4건"을
 * 별도로 하드코딩해 보여주던 로직(`AlertItem`/`PREVIEW_COUNT`/`alerts` prop)을 제거하고,
 * 펼침 패널과 완전히 같은 컴포넌트(`QuickActionsPanel`)를 그대로 재사용한다 — 두 상태가
 * "같은 소스"를 보여주도록 통일(펼침에 없는 콘텐츠가 미리보기에만 남는 비대칭 해소).
 *
 * - 펼침(`expanded`): 기존과 동일하게 `position:sticky; height:100vh` 전체 영역을 자체
 *   스크롤(`useScrollOverflowHint`)로 보여준다 — "앱 뼈대" 성격이라 `ScrollCard`를 쓰지
 *   않는다(design-tokens.md 스크롤 원칙, SideNav와 동급). 내부 "빠른 작업" 서브섹션만
 *   예외적으로 `QuickActionsPanel`이 자체 `ScrollCard`를 쓴다(카드형 UI 원칙 적용 대상).
 * - 접힘(`!expanded`): 이 컴포넌트가 차지하던 우측 자리 자체가 폭 0으로 사라진다
 *   (SideNav 접기와 동일한 width 트랜지션 패턴). 이 상태에서 헤더의 `AlertsBellButton`을
 *   호버하면(`isPreviewing`) 같은 자리에 `QuickActionsPanel`이 `position:absolute`로 떠서
 *   나타난다 — 별도 래퍼 `ScrollCard`로 다시 감싸지 않는다(`QuickActionsPanel`이 이미 자체
 *   `ScrollCard`를 갖고 있어, 감싸면 타이틀 바가 이중으로 보인다).
 *   미리보기 자체에서 마우스가 벗어나도 안 닫히도록(hoverable) `onPreviewMouseEnter`/
 *   `onPreviewMouseLeave`를 그대로 연결한다 — 실제 닫힘 판정(디바운스)은 트리거·미리보기
 *   양쪽 이벤트를 종합해야 해서 `PurchasingDashboardPage`가 맡는다.
 *
 * 사용 예:
 *   <AlertsPanel expanded={expanded} isPreviewing={isPreviewing}
 *     onPreviewMouseEnter={handlePreviewEnter} onPreviewMouseLeave={handlePreviewLeave}
 *     markerNews={markerNews} onCloseMarkerNews={handleCloseMarkerNews} />
 */
export function AlertsPanel({
  expanded,
  isPreviewing,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
  markerNews,
  onCloseMarkerNews,
}: AlertsPanelProps) {
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
            <div className={styles.quickActionsSection}>
              <QuickActionsPanel markerNews={markerNews} onCloseMarkerNews={onCloseMarkerNews} />
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
          <QuickActionsPanel markerNews={markerNews} onCloseMarkerNews={onCloseMarkerNews} />
        </div>
      )}
    </aside>
  )
}
