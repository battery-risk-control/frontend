import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { GlobalRiskBoardItem } from '../../../api/types'
import styles from './GlobalRiskBoard.module.css'

interface GlobalRiskBoardProps {
  items: GlobalRiskBoardItem[]
}

/**
 * 글로벌 리스크 관제 맵. 지도 시각화 대신(맵 라이브러리 미도입) 자재별 리스크 현황을
 * 등급·신뢰도 라벨과 함께 요약 리스트로 보여준다.
 *
 * 사용 예:
 *   <GlobalRiskBoard items={items} />
 */
export function GlobalRiskBoard({ items }: GlobalRiskBoardProps) {
  return (
    <section className={styles.panel} aria-labelledby="global-risk-board-heading">
      <h2 id="global-risk-board-heading" className={styles.title}>
        글로벌 리스크 관제 맵
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.material}>{item.material}</span>
              <RiskGradeBadge grade={item.grade} />
              <ConfidenceBadge label={item.confidence_label} />
            </div>
            <p className={styles.summary}>{item.event_summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
