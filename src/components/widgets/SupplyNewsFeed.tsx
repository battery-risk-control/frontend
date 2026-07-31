import { ScrollCard } from '../ui/ScrollCard/ScrollCard'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import type { NewsFeedItem } from '../../api/types'
import styles from './SupplyNewsFeed.module.css'

interface SupplyNewsFeedProps {
  items: NewsFeedItem[]
}

/**
 * 실시간 뉴스 속보. risk_event의 market_context를 최신순으로 나열한다.
 *
 * 카드 형식(2차 데모 수정 3, 2026-07-29): 상단 publisher(보도 언론사 도메인) 뱃지+date,
 * 중간 headline(굵게, 최대 2줄), 하단 material 태그+ConfidenceBadge. `source`(데이터 출처
 * 계층, 'data_ingestion_layer')는 `publisher`와 다른 개념이라 화면에는 쓰지 않는다 — 최초
 * 구현 시 `source`를 언론사명인 것처럼 잘못 노출했던 매핑 오류를 발견해 `publisher` 필드를
 * 신설하며 정정(`api/types.ts`의 `NewsFeedItem` 주석 참고). 썸네일 이미지는 넣지 않는다 —
 * `NewsFeedItem` 스키마에 이미지 URL 필드가 없고, 스키마 확장은 이번 범위 밖이다.
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
            <div className={styles.itemTop}>
              <span className={styles.publisherBadge}>{item.publisher}</span>
              <span className={styles.date}>{item.date}</span>
            </div>
            <p className={styles.headline}>{item.headline}</p>
            <div className={styles.itemFooter}>
              <span className={styles.materialTag}>{item.material}</span>
              <ConfidenceBadge label={item.confidence_label} />
            </div>
          </li>
        ))}
      </ul>
    </ScrollCard>
  )
}
