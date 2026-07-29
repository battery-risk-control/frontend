import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import type { NewsFeedItem } from '../../../api/types'
import styles from './SupplyNewsFeed.module.css'

interface SupplyNewsFeedProps {
  items: NewsFeedItem[]
}

/**
 * 실시간 뉴스 속보. 수집된 뉴스를 최신순으로 나열한다.
 *
 * 신뢰도 라벨은 전 화면 필수(Seq 20)라 항상 표시하고, 등급 배지는 분석(F3)이 붙은 뉴스에만 붙인다
 * — 수집만 된 기사에는 판정 결과가 없어서 "정상"으로 보이게 하면 사실과 달라진다.
 *
 * 사용 예:
 *   <SupplyNewsFeed items={items} />
 */
export function SupplyNewsFeed({ items }: SupplyNewsFeedProps) {
  return (
    <ScrollCard headingId="supply-news-feed-heading" title="실시간 뉴스 속보">
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.date}>{item.date}</span>
              <span className={styles.material}>{item.material}</span>
              {item.grade && <RiskGradeBadge grade={item.grade} />}
              <ConfidenceBadge label={item.confidence_label} />
            </div>
            <p className={styles.headline}>{item.headline}</p>
            <p className={styles.source}>출처: {item.source}</p>
          </li>
        ))}
      </ul>
    </ScrollCard>
  )
}
