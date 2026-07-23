import type { ReactNode } from 'react'
import styles from './ScrollCard.module.css'

interface ScrollCardProps {
  headingId: string
  title: ReactNode
  actions?: ReactNode
  caption?: ReactNode
  pinnedTop?: ReactNode
  fillHeight?: boolean
  footer?: ReactNode
  children: ReactNode
}

/**
 * 카드형 UI 공통 컨테이너. 본문(`.body`)에 항상 `min-height:0` + `overflow-y:auto`를 걸어,
 * 부모 레이아웃(예: 비로그인 공개 대시보드 2x2 그리드)이 카드 높이를 제약하는 경우에만
 * 내부 스크롤이 실제로 발동하고, 제약이 없는 화면에서는 카드가 그냥 자유롭게 늘어난다 —
 * 컴포넌트마다 "스크롤 필요 여부"를 개별 판단하지 않아도 된다.
 * `pinnedTop`은 지도처럼 스크롤 영역 밖에 항상 고정돼야 하는 콘텐츠용,
 * `actions`는 제목 옆 헤더 컨트롤(뷰토글 등)용, `footer`는 스크롤 밖 하단 고정 안내용이다.
 *
 * 사용 예:
 *   <ScrollCard headingId="foo-heading" title="제목">
 *     <ul>...</ul>
 *   </ScrollCard>
 */
export function ScrollCard({
  headingId,
  title,
  actions,
  caption,
  pinnedTop,
  fillHeight = false,
  footer,
  children,
}: ScrollCardProps) {
  return (
    <section
      className={fillHeight ? `${styles.panel} ${styles.fillHeight}` : styles.panel}
      aria-labelledby={headingId}
    >
      <div className={styles.headerRow}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {actions}
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
      {pinnedTop}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  )
}
