import styles from './AlertsBellButton.module.css'

interface AlertsBellButtonProps {
  count: number
  expanded: boolean
  onToggle: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * Header의 `accountExtra` 슬롯(계정 정보-로그아웃 사이)에 들어가는 알림 벨 아이콘.
 * AlertsPanel(구매팀 대시보드 "주요 알림 및 빠른 작업")과 짝을 이루는 트리거 — 클릭하면
 * `AlertsPanelContext`의 펼침/접힘을 토글하고, 접힌 상태에서 마우스를 올리면
 * `PurchasingDashboardPage`가 관리하는 로컬 `isPreviewing` 상태를 통해 AlertsPanel 쪽에
 * 상위 N개 미리보기가 뜬다(트리거와 미리보기가 화면상 떨어져 있어 `onMouseEnter`/
 * `onMouseLeave`를 그대로 상위로 올려보내고, 디바운스 판단은 호출부에서 한다).
 * 배지 숫자(`count`)는 펼침/접힘 상태와 무관하게 항상 표시한다.
 *
 * 사용 예:
 *   <AlertsBellButton count={alerts.length} expanded={expanded} onToggle={toggle}
 *     onMouseEnter={handlePreviewEnter} onMouseLeave={handlePreviewLeave} />
 */
export function AlertsBellButton({ count, expanded, onToggle, onMouseEnter, onMouseLeave }: AlertsBellButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={expanded ? '주요 알림 패널 접기' : '주요 알림 패널 펼치기'}
      aria-expanded={expanded}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span className={styles.badge}>{count}</span>
    </button>
  )
}
