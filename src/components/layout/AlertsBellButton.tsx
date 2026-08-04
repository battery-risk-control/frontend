import styles from './AlertsBellButton.module.css'

interface AlertsBellButtonProps {
  count: number
  /**
   * 신규 모드(우측 `DashboardSidePanel`과 짝, `/public`) — 있으면 클릭 시 패널을 열고
   * "주요 알림" 탭으로 옮긴다. 패널을 토글하지 않는다(열기만) — 벨을 눌렀는데 뉴스 상세
   * 탭이 열리면 트리거와 결과가 어긋나고, 브리핑 탭을 보다가 알림을 보려고 눌렀는데
   * 패널이 닫히면 안 되기 때문이다. 열고 닫기는 패널 가장자리의 `SidePanelToggleButton`이
   * 맡는다.
   *
   * 이 prop이 있으면 `expanded`/`onToggle`은 무시한다 — 두 모드를 동시에 쓰지 않는다.
   */
  onOpenAlerts?: () => void
  /**
   * 기존 모드(`AlertsPanel`과 짝, `/purchasing`, 하위호환 유지) — `onOpenAlerts`가 없을 때만
   * 쓰인다. 클릭 시 펼침/접힘을 토글한다.
   */
  expanded?: boolean
  onToggle?: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * Header의 `accountExtra` 슬롯(계정 정보-로그아웃 사이)에 들어가는 알림 벨 아이콘.
 *
 * 두 화면이 서로 다른 우측 패널 설계를 쓰고 있어 모드가 갈린다 — `/public`(신규
 * `DashboardSidePanel`, 열기 전용 `onOpenAlerts`)과 `/purchasing`(기존 `AlertsPanel`, 토글
 * `expanded`/`onToggle`). 어느 쪽이든 접힌 상태에서 마우스를 올리면 호출부가 관리하는 로컬
 * `isPreviewing` 상태를 통해 상위 N개 미리보기가 뜬다(트리거와 미리보기가 화면상 떨어져
 * 있어 `onMouseEnter`/`onMouseLeave`를 그대로 상위로 올려보내고, 디바운스 판단은 호출부에서
 * 한다). 배지 숫자(`count`)는 펼침/접힘 상태와 무관하게 항상 표시한다.
 *
 * 사용 예:
 *   <AlertsBellButton count={alerts.length} onOpenAlerts={handleOpenAlerts}
 *     onMouseEnter={handlePreviewEnter} onMouseLeave={handlePreviewLeave} />
 *   <AlertsBellButton count={alerts.length} expanded={expanded} onToggle={toggle}
 *     onMouseEnter={handlePreviewEnter} onMouseLeave={handlePreviewLeave} />
 */
export function AlertsBellButton({
  count,
  onOpenAlerts,
  expanded,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}: AlertsBellButtonProps) {
  const isOpenOnlyMode = onOpenAlerts !== undefined

  return (
    <button
      type="button"
      className={styles.button}
      onClick={isOpenOnlyMode ? onOpenAlerts : onToggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      /* 열기 전용 모드는 aria-expanded를 붙이지 않는다 — 이 버튼은 열기만 하고 닫지 않으므로,
         펼침 상태를 표시하면 스크린리더가 "눌러서 접는다"로 안내하게 된다. */
      aria-label={isOpenOnlyMode ? `주요 알림 ${count}건 보기` : expanded ? '주요 알림 패널 접기' : '주요 알림 패널 펼치기'}
      aria-expanded={isOpenOnlyMode ? undefined : expanded}
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
