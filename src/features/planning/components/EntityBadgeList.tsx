import { Link } from 'react-router-dom'
import type { EntityBadgeItem } from '../../../api/types'
import styles from './EntityBadgeList.module.css'

interface EntityBadgeListProps {
  title: string
  items: EntityBadgeItem[]
  /** 제공 시 각 항목이 이 경로로 이동하는 링크가 된다(예: 계약 현황 드릴다운). 미제공 시 기존처럼 링크 없이 표시. */
  linkTo?: (item: EntityBadgeItem) => string
}

const BADGE_TONE_CLASS: Record<NonNullable<EntityBadgeItem['badge']>['tone'], string> = {
  success: styles.badgeSuccess,
  warning: styles.badgeWarning,
  neutral: styles.badgeNeutral,
}

/**
 * "이름 + 보조 텍스트 + 상태 뱃지" 리스트 — `VendorRiskHistory`의 뱃지+리스트 구조를 일반화해
 * 2계층 7탭(적격 공급사 추천/만료 임박 계약/최근 브리핑)이 공유한다.
 *
 * 사용 예:
 *   <EntityBadgeList title="적격 공급사 추천" items={recommended} />
 *   <EntityBadgeList title="만료 임박 계약" items={expiring} linkTo={(item) => `/planning/contract/${item.id}`} />
 */
export function EntityBadgeList({ title, items, linkTo }: EntityBadgeListProps) {
  return (
    <section className={styles.panel} aria-labelledby={`${title}-heading`}>
      <h2 id={`${title}-heading`} className={styles.title}>
        {title}
      </h2>
      <ul className={styles.list}>
        {items.map((item) => {
          const content = (
            <>
              <div className={styles.itemHeader}>
                <span className={styles.primary}>{item.primary}</span>
                {item.badge && (
                  <span className={`${styles.badge} ${BADGE_TONE_CLASS[item.badge.tone]}`}>{item.badge.label}</span>
                )}
              </div>
              {item.secondary && <p className={styles.secondary}>{item.secondary}</p>}
            </>
          )
          return (
            <li key={item.id} className={styles.item}>
              {linkTo ? (
                <Link to={linkTo(item)} className={styles.itemLink}>
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
