import { useAlertsPanelState } from '../../lib/useAlertsPanelState'
import styles from './SidePanelToggleButton.module.css'

/**
 * 우측 패널(뉴스 상세 · 주요 알림 · 브리핑) 접기/펼치기 토글.
 *
 * 패널이 접히면 폭이 0이 되어(`DashboardSidePanel.module.css`의 `.collapsed`) 내부 요소를
 * 누를 수 없으므로, 이 버튼은 패널 바깥(각 페이지의 `.body`, `<DashboardSidePanel>` 바로 앞)에
 * 따로 둔다. 좌측 {@link SideNavToggleButton}과 같은 이유다.
 *
 * 다만 <b>배치는 그쪽과 다르다.</b> 좌측 토글은 flex 흐름 안에 자리를 차지하는데, 오른쪽에서
 * 그러면 페이지 섹션 점과 패널 사이가 버튼 폭만큼 벌어진다. 이쪽은 흐름에서 빼고 패널 위에
 * 얹어(`position: fixed`) 둘이 예전처럼 맞붙게 한다 — 자세한 것은 CSS 주석 참고.
 *
 * <b>이 버튼을 만들기 전에는 헤더의 알림 벨이 패널 토글을 겸했다.</b> 벨을 누르면 뉴스 상세 탭이
 * 열려서 트리거와 결과가 어긋났고, 패널을 닫을 방법도 벨뿐이라 "알림을 보려다 패널을 닫는" 일이
 * 생겼다. 이제 벨은 알림으로 데려가기만 하고, 열고 닫기는 이 버튼이 맡는다.
 *
 * 화살표 방향은 <b>누르면 패널이 갈 쪽</b>을 가리킨다 — 펼쳐져 있으면 오른쪽(밀어서 닫기),
 * 접혀 있으면 왼쪽(당겨서 열기). 좌측 내비 토글과 같은 규칙이라 좌우가 대칭으로 읽힌다.
 *
 * 사용 예:
 *   <SidePanelToggleButton />
 *   <DashboardSidePanel ... />
 */
export function SidePanelToggleButton() {
  const { expanded, toggle } = useAlertsPanelState()

  return (
    <button
      type="button"
      className={expanded ? `${styles.toggleButton} ${styles.panelOpen}` : styles.toggleButton}
      onClick={toggle}
      aria-label={expanded ? '우측 패널 접기' : '우측 패널 펼치기'}
      aria-expanded={expanded}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        /* 원본 경로가 왼쪽 꺾쇠(‹)라, 펼침 상태에서만 뒤집어 오른쪽(›)으로 만든다. */
        style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
