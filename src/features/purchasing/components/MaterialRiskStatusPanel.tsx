import { Link } from 'react-router-dom'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { RiskEvent } from '../../../api/types'
import styles from './MaterialRiskStatusPanel.module.css'

interface MaterialRiskStatusPanelProps {
  events: RiskEvent[]
}

/**
 * 원자재 공급사 리스크 현황. risk_event 목록을 나열하고 각 항목에
 * RiskGradeBadge/ConfidenceBadge로 등급·신뢰도를 함께 표시한다.
 *
 * 사용 예:
 *   <MaterialRiskStatusPanel events={events} />
 */
export function MaterialRiskStatusPanel({ events }: MaterialRiskStatusPanelProps) {
  return (
    <ScrollCard
      headingId="material-risk-heading"
      title="원자재 공급사 리스크 현황"
      // mock 임시값 — 리스트 항목 4개 초과 시 스크롤 트리거용 실측 높이(design-tokens.md
      // "카드 레이아웃·스크롤 규칙" d). 현재 mock 6건 기준 실측(4개+gap3=433.2px)에 여유를
      // 둔 값 — 항목 내용이 크게 바뀌면 재측정 필요.
      maxBodyHeight={440}
    >
      <ul className={styles.list}>
        {events.map((event) => (
          <li key={event.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.material}>{event.market_context.material}</span>
              <span className={styles.materialCode}>{event.erp_view.affected_material_code}</span>
              <RiskGradeBadge grade={event.grade} />
              <ConfidenceBadge label={event.confidence_label} />
            </div>
            <p className={styles.summary}>{event.market_context.event_summary}</p>
            <Link to={`/purchasing/briefing/${event.risk_event_id}`} className={styles.briefingLink}>
              브리핑 보기
            </Link>
          </li>
        ))}
      </ul>
    </ScrollCard>
  )
}
