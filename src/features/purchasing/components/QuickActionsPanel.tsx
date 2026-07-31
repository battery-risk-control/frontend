import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { SelectedDetail } from '../../../components/widgets/GlobalRiskBoard'
import styles from './QuickActionsPanel.module.css'

interface QuickActionsPanelProps {
  /** GlobalRiskBoard의 `onSelect` 콜백에서 올라온 선택 결과. null이면 안내 문구만 표시. */
  markerNews: SelectedDetail | null
  onCloseMarkerNews: () => void
}

/**
 * "빠른 작업" 서브섹션(2차 데모, 수정 1) — 구매대응순위 · 마커뉴스 · 데이터 업데이트 상태
 * 3개 서브섹션. 구매대응순위/데이터 업데이트 상태는 아직 틀(제목+영역 구분)만 우선
 * 구현한다 — 콘텐츠 로직은 다음 단계 범위(CLAUDE.md placeholder 원칙).
 *
 * "마커뉴스"는 2차 데모 수정 2-3에서 실제로 연결됐다 — 기존 `GlobalRiskBoard`가 자체
 * 렌더링하던 "마커 클릭 시 정보 표시" 패널을 여기로 이양했다(`GlobalRiskBoard`의 `onSelect`
 * prop, 구매팀 대시보드만 해당 — 공개 대시보드는 여전히 자체 표시). 마커/국가 클릭 시
 * `PurchasingDashboardPage`가 `markerNews` state를 갱신해 이 컴포넌트로 내려주고, surin
 * 참고 패턴대로 제목 아래 "주요 뉴스/이벤트 · {국가/자재}" 부제가 동적으로 붙는다.
 *
 * 독립된 최상위 형제 컴포넌트가 아니라 `AlertsPanel`(제목 "주요 알림 및 빠른 작업" —
 * 원래부터 "빠른 작업"을 포괄하는 이름이었음)의 자식으로 렌더링된다. 자체 sticky/폭
 * 배치는 갖지 않는다 — `AlertsPanel.wrapper`(280px, sticky)에 이미 그 역할이 있어
 * 여기서 중복 정의하지 않는다(수정 1, 별도 박스로 두지 않는 것이 목적).
 *
 * 사용 예:
 *   <QuickActionsPanel markerNews={markerNews} onCloseMarkerNews={handleClose} />
 */
export function QuickActionsPanel({ markerNews, onCloseMarkerNews }: QuickActionsPanelProps) {
  return (
    <ScrollCard headingId="quick-actions-heading" title="빠른 작업">
      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>구매대응순위</h4>
        <p className={styles.placeholder}>준비 중입니다.</p>
      </div>
      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>마커뉴스</h4>
        {markerNews ? (
          <>
            <div className={styles.markerNewsHeader}>
              <span className={styles.markerNewsSubtitle}>주요 뉴스/이벤트 · {markerNews.label}</span>
              <button type="button" className={styles.markerNewsCloseButton} onClick={onCloseMarkerNews}>
                닫기
              </button>
            </div>
            <ul className={styles.markerNewsList}>
              {markerNews.events.map((item) => (
                <li key={item.risk_event_id} className={styles.markerNewsItem}>
                  <div className={styles.markerNewsItemHeader}>
                    <span className={styles.markerNewsMaterial}>{item.material}</span>
                    <RiskGradeBadge grade={item.grade} />
                    <ConfidenceBadge label={item.confidence_label} />
                  </div>
                  <p className={styles.markerNewsSummary}>{item.event_summary}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.placeholder}>지도에서 마커를 클릭하면 관련 리스크 정보가 여기에 표시됩니다.</p>
        )}
      </div>
      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>데이터 업데이트 상태</h4>
        <p className={styles.placeholder}>준비 중입니다.</p>
      </div>
    </ScrollCard>
  )
}
