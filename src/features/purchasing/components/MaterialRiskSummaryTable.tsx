import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import type { MaterialRiskSummaryItem, RiskGrade } from '../../../api/types'
import styles from './MaterialRiskSummaryTable.module.css'

interface MaterialRiskSummaryTableProps {
  items: MaterialRiskSummaryItem[]
  /**
   * 완료 처리 중인 `latest_assessment_id`. 버튼을 비활성화해 같은 평가를 두 번 보내지 않는다.
   * 전역 로딩이 아니라 id 단위라, 한 줄을 처리하는 동안 다른 줄은 그대로 누를 수 있다.
   */
  pendingAssessmentId: string | null
  onAcknowledge: (item: MaterialRiskSummaryItem) => void
}

/** 백엔드 등급 코드 → 화면 3단계 배지. 표기는 다른 화면과 같은 `RiskGradeBadge`를 쓴다. */
const GRADE_BY_LEVEL: Record<string, RiskGrade> = {
  CRITICAL: '심각',
  WARNING: '주의',
  NORMAL: '정상',
}

/**
 * 전일 대비 표기. `+3.7` → `▲ 3.7`, `-2.0` → `▼ 2.0`, `0` → `—`.
 *
 * **null이면 아무것도 그리지 않는다.** 24시간 전까지 평가가 없던 자재는 비교 대상이 없는
 * 것이지 "변화 없음"이 아니다 — 0으로 채우면 그 둘이 구분되지 않는다.
 */
function toDeltaLabel(delta: number | null): { text: string; className: string } | null {
  if (delta === null) return null
  if (delta === 0) return { text: '—', className: styles.deltaFlat }
  return delta > 0
    ? { text: `▲ ${delta.toFixed(1)}`, className: styles.deltaUp }
    : { text: `▼ ${Math.abs(delta).toFixed(1)}`, className: styles.deltaDown }
}

/**
 * 원자재별 리스크 요약 — 배터리 원자재 7종을 항상 같은 자리에 세우고, 각 자재의 **최종 합성
 * 점수**(외부신호 + ERP노출 + 계약공백)를 리스크 지수로 보여준다.
 *
 * 점수는 그 자재 뉴스 중 **상위 3건의 평균**, 등급은 그 3건 중 **최고**다. 최신 1건만 보면
 * 직전에 들어온 더 심각한 뉴스가 화면에서 사라지고, 평균 등급을 쓰면 그 안에 섞인 심각 1건이
 * 묻히기 때문이다.
 *
 * 도입 전에는 이 자리가 `fetchMaterialRiskGauges()`의 하드코딩 mock(리튬 72 ▲4 / 니켈 58 ▼2 /
 * 흑연 68 ▲6)이었고, 그 뒤 ERP 노출도 단독 점수를 쓰는 게이지로 바뀌었다. 둘 다 RAG(계약공백)와
 * 외부신호를 반영하지 못했다.
 *
 * "대응 완료"를 누르면 그 자재의 **최신** 평가가 KPI 심각/주의 집계에서 빠진다(상위 3건 중
 * 아무거나가 아니라 KPI가 세는 바로 그 행이다). 원본은 지우지 않고 별도 로그에만 남는다.
 *
 * 사용 예:
 *   <MaterialRiskSummaryTable items={summary} pendingAssessmentId={pending} onAcknowledge={ack} />
 */
export function MaterialRiskSummaryTable({
  items,
  pendingAssessmentId,
  onAcknowledge,
}: MaterialRiskSummaryTableProps) {
  return (
    <ScrollCard
      /* `material-risk-summary-heading`은 아래 게이지 행의 MaterialRiskSummaryCard가 이미
         쓰고 있다. 같은 id가 문서에 둘이면 PageSectionDots가 먼저 찾은 쪽으로만 이동한다. */
      headingId="material-risk-composite-heading"
      title="원자재별 리스크 요약"
      maxBodyHeight={420}
    >
      <p className={styles.caption}>
        리스크 지수 0~100 (높을수록 위험) · 외부신호 · ERP 영향 · 계약 공백을 합친 최종 점수
      </p>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">원자재</th>
              <th scope="col" className={styles.numeric}>
                리스크 지수
              </th>
              <th scope="col" className={styles.numeric}>
                24시간 대비
              </th>
              <th scope="col">주요 이슈</th>
              <th scope="col">
                <span className={styles.srOnly}>대응</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const delta = toDeltaLabel(item.score_delta)
              const grade = item.risk_level ? GRADE_BY_LEVEL[item.risk_level] : null
              return (
                <tr key={item.material_category}>
                  <th scope="row" className={styles.material}>
                    <span className={styles.materialName}>{item.material_name}</span>
                    {grade && <RiskGradeBadge grade={grade} />}
                  </th>
                  <td className={styles.numeric}>
                    {/* 평가가 없으면 0이 아니라 "—"다. 0점은 "위험이 없다"로 읽힌다. */}
                    {item.risk_score === null ? (
                      <span className={styles.muted}>—</span>
                    ) : (
                      <span className={styles.score}>{item.risk_score.toFixed(1)}</span>
                    )}
                  </td>
                  <td className={styles.numeric}>
                    {delta ? (
                      <span className={delta.className}>{delta.text}</span>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </td>
                  <td className={styles.issues}>
                    {item.top_news.length === 0 ? (
                      <span className={styles.muted}>아직 분석된 뉴스가 없습니다.</span>
                    ) : (
                      <ul className={styles.issueList}>
                        {item.top_news.map((news) => (
                          <li key={news.assessment_id} className={styles.issue}>
                            {news.title ?? '(제목 없음)'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    {/* 완료 처리할 평가가 없으면 버튼 자체를 그리지 않는다 — 눌러도 아무 일도
                        일어나지 않는 버튼은 "고장난 화면"으로 읽힌다. */}
                    {item.latest_assessment_id && (
                      <button
                        type="button"
                        className={styles.ackButton}
                        disabled={pendingAssessmentId === item.latest_assessment_id}
                        onClick={() => onAcknowledge(item)}
                      >
                        {pendingAssessmentId === item.latest_assessment_id
                          ? '처리 중…'
                          : '대응 완료'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </ScrollCard>
  )
}
