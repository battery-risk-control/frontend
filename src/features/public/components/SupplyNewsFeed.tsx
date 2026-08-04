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
 * 신뢰도 라벨은 전 화면 필수(Seq 20)라 항상 표시하고, 등급 배지는 멀티에이전트까지 통과해
 * 종합 위험도가 나온 뉴스에만 붙인다 — 판정이 끝나지 않은 기사를 "정상"으로 보이게 하면 사실과 달라진다.
 *
 * 헤드라인은 기사 원문으로 나가는 링크다. url이 없는 항목(placeholder)은 링크 없이 텍스트로만 둔다
 * — 빈 href를 걸면 클릭했을 때 같은 페이지가 새로 뜬다.
 *
 * 수집 소스(GDELT 등)는 표기하지 않는다. 공급망 뉴스 패널에서 의미 있는 출처는 기사 매체인데
 * 그 값은 지금 응답에 없고, GDELT는 수집 경로일 뿐이라 독자에게 주는 정보가 없다.
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
            {item.url ? (
              <a
                className={styles.headlineLink}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.headline}
              </a>
            ) : (
              <p className={styles.headline}>{item.headline}</p>
            )}
          </li>
        ))}
      </ul>
    </ScrollCard>
  )
}
