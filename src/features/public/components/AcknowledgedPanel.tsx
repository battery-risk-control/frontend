import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import type { AcknowledgedItem } from '../../../api/types'
import styles from './AcknowledgedPanel.module.css'

interface AcknowledgedPanelProps {
  items: AcknowledgedItem[]
  isLoading?: boolean
  /** 되돌리는 중인 assessment_id. 버튼 단위로 잠가 같은 평가를 두 번 보내지 않는다. */
  pendingAssessmentId?: string | null
  onUndo?: (item: AcknowledgedItem) => void
  /**
   * 읽기 전용(비로그인 대시보드, 2026-08-07). true면 "되돌리기" 버튼을 그리지 않고, 완료 처리
   * 결과만 보여준다 — 완료/되돌리기 관리는 1계층(구매팀) 대시보드에서만 한다.
   */
  readOnly?: boolean
}

/** `2026. 08. 03. 오후 01:18` 형태. 되돌릴 대상을 고를 때 "언제 눌렀는지"가 단서가 된다. */
function formatAcknowledgedAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
}

/**
 * 완료 처리 항목 — "원자재별 리스크 점수" 옆에 서는 되돌리기 목록.
 *
 * **이 패널이 없으면 되돌릴 방법이 없다.** "대응 완료"를 누르면 그 평가가 KPI·주요 이슈
 * 집계에서 빠지는데, 빠지는 순간 표에서도 사라져 버튼을 놓을 자리가 함께 사라진다. 왼쪽 표에서
 * 내려간 항목이 여기로 올라온다고 보면 된다.
 *
 * 원본 `procurement_risk_assessments`는 처음부터 건드리지 않으므로, 되돌리면 상태가 완전히
 * 원래대로 돌아온다 — 지운 걸 복구하는 게 아니라 로그 한 줄을 빼는 것이다.
 *
 * 사용 예:
 *   <AcknowledgedPanel items={acknowledged} pendingAssessmentId={pending} onUndo={handleUndo} />
 */
export function AcknowledgedPanel({
  items,
  isLoading = false,
  pendingAssessmentId,
  onUndo,
  readOnly = false,
}: AcknowledgedPanelProps) {
  return (
    <ScrollCard headingId="acknowledged-heading" title="확인 완료 항목" maxBodyHeight={280}>
      {isLoading ? (
        <div aria-busy="true" aria-label="확인 완료 항목 불러오는 중">
          <SkeletonText lines={4} lastLineWidth="50%" />
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          {readOnly
            ? '확인 완료한 항목이 없습니다. 확인 처리는 구매팀 대시보드에서 가능합니다.'
            : '확인 완료한 항목이 없습니다. 위 표에서 "확인 완료"를 누르면 여기로 옮겨지고, 여기서 다시 미확인 상태로 되돌릴 수 있습니다.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.assessment_id} className={styles.item}>
              <div className={styles.head}>
                <span className={styles.material}>{item.material_name}</span>
                <span className={styles.score}>
                  {item.procurement_risk_level} · {Math.round(item.procurement_risk_score)}점
                </span>
              </div>
              {/* 자재명만으로는 어느 건인지 구분되지 않는다 — 같은 자재에 뉴스가 여러 건 들어온다. */}
              {item.subject_title && <p className={styles.subject}>{item.subject_title}</p>}
              <div className={styles.meta}>
                <span className={styles.who}>
                  {[item.acknowledged_by_name, formatAcknowledgedAt(item.acknowledged_at)]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {/* 되돌리기(관리)는 1계층에서만 — readOnly면 버튼을 그리지 않는다. */}
                {!readOnly && (
                  <button
                    type="button"
                    className={styles.undoButton}
                    disabled={pendingAssessmentId === item.assessment_id}
                    onClick={() => onUndo?.(item)}
                  >
                    {pendingAssessmentId === item.assessment_id ? '되돌리는 중…' : '미확인으로 되돌리기'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ScrollCard>
  )
}
