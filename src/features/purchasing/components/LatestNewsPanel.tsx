import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import type { NewsFeedItem } from '../../../api/types'
import styles from './LatestNewsPanel.module.css'

interface LatestNewsPanelProps {
  items: NewsFeedItem[]
  /** 우측 "뉴스 상세" 탭에 떠 있는 기사. 목록에서 선택 상태를 표시한다. */
  selectedId?: string | null
  onSelect: (item: NewsFeedItem) => void
}

/**
 * 최신 뉴스 — 목업 중앙의 번호 매긴 목록. 제목을 누르면 우측 패널의 "뉴스 상세" 탭이 그 기사로
 * 바뀌고, 오른쪽 "원문 ↗"은 기사 원문으로 나간다.
 *
 * 제목 자체를 원문 링크로 걸지 않는 이유는 목업의 두 동작이 서로 다르기 때문이다 — 제목은
 * 화면 안에서 상세를 여는 것이고, 원문은 바깥으로 나가는 것이다. 하나로 합치면 상세 패널을
 * 열 방법이 없어진다.
 *
 * `url`이 null인 항목은 "원문" 링크를 아예 렌더하지 않는다. 백엔드가 절대 http(s)가 아닌 값을
 * null로 바꿔 보내므로, 여기서 다시 검사하지 않고 존재 여부만 본다.
 *
 * 공개 대시보드의 `SupplyNewsFeed`와 같은 데이터를 쓰지만 별도 컴포넌트다 — 그쪽은 카드 하나에
 * 전부 담는 속보 목록이고, 이쪽은 상세 패널과 짝을 이루는 선택 가능한 목록이다.
 *
 * 사용 예:
 *   <LatestNewsPanel items={news} selectedId={selected?.risk_event_id} onSelect={setSelected} />
 */
export function LatestNewsPanel({ items, selectedId, onSelect }: LatestNewsPanelProps) {
  return (
    <ScrollCard
      headingId="latest-news-heading"
      title="최신 뉴스"
      // 목업이 5건 노출이라 그만큼만 보이고 6번째부터 스크롤한다
      // (design-tokens.md "카드 레이아웃·스크롤 규칙" d와 같은 취지).
      maxBodyHeight={320}
    >
      {items.length === 0 ? (
        <p className={styles.empty}>수집된 뉴스가 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {items.map((item, index) => (
            <li key={item.risk_event_id} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <button
                type="button"
                className={
                  item.risk_event_id === selectedId
                    ? `${styles.headlineButton} ${styles.headlineSelected}`
                    : styles.headlineButton
                }
                onClick={() => onSelect(item)}
                aria-pressed={item.risk_event_id === selectedId}
              >
                {item.headline}
              </button>
              <span className={styles.badges}>
                {item.grade && <RiskGradeBadge grade={item.grade} />}
                <ConfidenceBadge label={item.confidence_label} />
              </span>
              {item.url && (
                <a
                  className={styles.sourceLink}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  원문 ↗
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </ScrollCard>
  )
}
