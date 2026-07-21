import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { NewsFeedItem } from '../../../api/types'
import styles from './SupplyNewsFeed.module.css'

interface SupplyNewsFeedProps {
  items: NewsFeedItem[]
}

/**
 * 실시간 뉴스 속보. risk_event의 market_context를 최신순으로 나열한다.
 *
 * 사용 예:
 *   <SupplyNewsFeed items={items} />
 */
export function SupplyNewsFeed({ items }: SupplyNewsFeedProps) {
  return (
    <section className={styles.panel} aria-labelledby="supply-news-feed-heading">
      <h2 id="supply-news-feed-heading" className={styles.title}>
        실시간 뉴스 속보
      </h2>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.risk_event_id} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={styles.date}>{item.date}</span>
              <span className={styles.material}>{item.material}</span>
              <ConfidenceBadge label={item.confidence_label} />
            </div>
            <p className={styles.headline}>{item.headline}</p>
            <p className={styles.source}>출처: {item.source}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
