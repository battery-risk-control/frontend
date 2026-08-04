import { Link } from 'react-router-dom'
import styles from './Breadcrumb.module.css'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

/**
 * 브레드크럼 (탐색 위치 안내). 마지막 항목은 현재 페이지로 간주해 링크를 걸지 않는다.
 *
 * 사용 예:
 *   <Breadcrumb
 *     items={[{ label: '홈', href: '/' }, { label: '구매팀 대시보드' }]}
 *   />
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={styles.breadcrumb}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.label} className={styles.item}>
              {item.href && !isLast ? (
                <Link to={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
