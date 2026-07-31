import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import styles from './QuickActionsPanel.module.css'

/**
 * "빠른 작업" 서브섹션(2차 데모, 수정 1) — 구매대응순위 · 마커뉴스 · 데이터 업데이트 상태
 * 3개 서브섹션의 틀(제목+영역 구분)만 우선 구현한다 — 콘텐츠 로직은 다음 단계 범위.
 * CLAUDE.md placeholder 원칙("실제 계산 로직이나 데이터가 부족한 부분은 무리하게 채우지
 * 말고 준비 중 상태로 대체")에 따라 각 서브섹션은 안내 문구만 표시한다.
 *
 * 독립된 최상위 형제 컴포넌트가 아니라 `AlertsPanel`(제목 "주요 알림 및 빠른 작업" —
 * 원래부터 "빠른 작업"을 포괄하는 이름이었음)의 자식으로 렌더링된다. 자체 sticky/폭
 * 배치는 갖지 않는다 — `AlertsPanel.wrapper`(280px, sticky)에 이미 그 역할이 있어
 * 여기서 중복 정의하지 않는다(수정 1, 별도 박스로 두지 않는 것이 목적).
 *
 * 사용 예:
 *   <QuickActionsPanel />
 */
export function QuickActionsPanel() {
  return (
    <ScrollCard headingId="quick-actions-heading" title="빠른 작업">
      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>구매대응순위</h4>
        <p className={styles.placeholder}>준비 중입니다.</p>
      </div>
      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>마커뉴스</h4>
        <p className={styles.placeholder}>준비 중입니다.</p>
      </div>
      <div className={styles.subsection}>
        <h4 className={styles.subsectionTitle}>데이터 업데이트 상태</h4>
        <p className={styles.placeholder}>준비 중입니다.</p>
      </div>
    </ScrollCard>
  )
}
