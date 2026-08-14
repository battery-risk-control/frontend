import styles from './AlertsBellButton.module.css'

interface AlertsBellButtonProps {
  count: number
  /** 우측 패널을 열고 "주요 알림" 탭으로 옮긴다. 이미 그 상태면 아무 일도 하지 않는다. */
  onOpenAlerts: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

/**
 * Header의 `accountExtra` 슬롯(계정 정보-로그아웃 사이)에 들어가는 알림 벨 아이콘.
 * 우측 패널(`DashboardSidePanel`)의 "주요 알림" 탭과 짝을 이루는 트리거다 — 클릭하면 패널을
 * 열고 그 탭으로 옮기고, 마우스를 올리면 `PurchasingDashboardPage`가 관리하는 로컬
 * `isPreviewing` 상태를 통해 상위 N개 미리보기가 뜬다(트리거와 미리보기가 화면상 떨어져 있어
 * `onMouseEnter`/`onMouseLeave`를 그대로 상위로 올려보내고, 디바운스 판단은 호출부에서 한다).
 * 배지 숫자(`count`)는 펼침/접힘 상태와 무관하게 항상 표시한다.
 *
 * <b>패널을 토글하지 않는다.</b> 예전에는 이 버튼이 패널 열고 닫기를 겸했는데, 벨을 눌렀는데
 * 뉴스 상세 탭이 열려 트리거와 결과가 어긋났고, 브리핑 탭을 보다가 알림을 보려고 누르면 대신
 * 패널이 닫혔다. 열고 닫기는 패널 가장자리의 `SidePanelToggleButton`이 맡는다.
 *
 * 호버만으로 미리보기를 주고 클릭을 비워 두지 않는 이유: 터치 기기에는 호버가 없고 키보드
 * 포커스로도 `onMouseEnter`가 발화하지 않아, 그렇게 두면 알림에 닿을 방법이 사라진다.
 *
 * 사용 예:
 *   <AlertsBellButton count={alerts.length} onOpenAlerts={handleOpenAlerts}
 *     onMouseEnter={handlePreviewEnter} onMouseLeave={handlePreviewLeave} />
 */
export function AlertsBellButton({ count, onOpenAlerts, onMouseEnter, onMouseLeave }: AlertsBellButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onOpenAlerts}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      /* aria-expanded를 붙이지 않는다 — 이 버튼은 열기만 하고 닫지 않으므로, 펼침 상태를
         표시하면 스크린리더가 "눌러서 접는다"로 안내하게 된다. 그 역할은 화살표 토글에 있다. */
      aria-label={`주요 알림 ${count}건 보기`}
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
      {count > 0 && <span className={styles.badge}>{count}</span>}
    </button>
  )
}
