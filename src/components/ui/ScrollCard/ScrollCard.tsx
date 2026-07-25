import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from './ScrollCard.module.css'

interface ScrollCardProps {
  headingId: string
  title: ReactNode
  actions?: ReactNode
  caption?: ReactNode
  pinnedTop?: ReactNode
  fillHeight?: boolean
  scrollable?: boolean
  maxBodyHeight?: number | string
  footer?: ReactNode
  children: ReactNode
}

/**
 * 카드형 UI 공통 컨테이너. 본문(`.body`)에 기본적으로 `min-height:0` + `overflow-y:auto`를 걸어,
 * 부모 레이아웃(예: 비로그인 공개 대시보드 2x2 그리드)이 카드 높이를 제약하는 경우에만
 * 내부 스크롤이 실제로 발동하고, 제약이 없는 화면에서는 카드가 그냥 자유롭게 늘어난다 —
 * 컴포넌트마다 "스크롤 필요 여부"를 개별 판단하지 않아도 된다.
 * `pinnedTop`은 지도처럼 스크롤 영역 밖에 항상 고정돼야 하는 콘텐츠용,
 * `actions`는 제목 옆 헤더 컨트롤(뷰토글 등)용, `footer`는 스크롤 밖 하단 고정 안내용이다.
 * `scrollable`(기본 `true`)을 `false`로 주면 본문 스크롤을 배제한다(`overflow: visible`) —
 * Recharts `ResponsiveContainer`처럼 스크롤 컨테이너 안에서 폭 재측정 이슈가 생기는
 * 콘텐츠용. `flex:1`/`min-height:0` 등 레이아웃 속성은 그대로 유지된다.
 *
 * `scrollable`이 `true`일 때, 본문이 실제로 오버플로하고 아직 끝까지 스크롤하지 않은
 * 상태면 하단에 그라데이션+화살표 힌트를 자동으로 표시한다(scroll/resize 이벤트 +
 * `ResizeObserver`로 감지) — 그리드 페이지 다음 카드를 안내하는 `ScrollHint`와는 별개로,
 * "이 카드 안에 아직 안 보이는 콘텐츠가 있다"는 것만 알린다. 화면별로 별도 작업 없이
 * `ScrollCard`를 쓰는 모든 카드에 자동 적용된다.
 * `maxBodyHeight`(선택)를 주면 본문에 해당 높이로 `max-height`가 걸린다 — 형제 리스트
 * 항목이 4개를 넘는 카드에서 "4개 높이로 고정 + 5번째부터 스크롤" 규칙(design-tokens.md
 * "카드 레이아웃·스크롤 규칙" d)을 적용할 때 쓴다. 값을 안 주면 기존과 동일하게 자유
 * 높이(부모가 제약할 때만 스크롤 발동)로 동작한다.
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
  scrollable = true,
  maxBodyHeight,
  footer,
  children,
}: ScrollCardProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [showOverflowHint, setShowOverflowHint] = useState(false)

  useEffect(() => {
    if (!scrollable) return
    const body = bodyRef.current
    if (!body) return

    function updateHint() {
      const el = bodyRef.current
      if (!el) return
      const hasOverflow = el.scrollHeight - el.clientHeight > 1
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1
      setShowOverflowHint(hasOverflow && !atBottom)
    }

    updateHint()
    body.addEventListener('scroll', updateHint)
    const resizeObserver = new ResizeObserver(updateHint)
    resizeObserver.observe(body)

    return () => {
      body.removeEventListener('scroll', updateHint)
      resizeObserver.disconnect()
    }
  }, [scrollable, children])

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
      <div className={styles.bodyWrapper}>
        <div
          ref={bodyRef}
          className={scrollable ? styles.body : `${styles.body} ${styles.noScroll}`}
          style={maxBodyHeight !== undefined ? { maxHeight: typeof maxBodyHeight === 'number' ? `${maxBodyHeight}px` : maxBodyHeight } : undefined}
        >
          {children}
        </div>
        {scrollable && showOverflowHint && (
          <div className={styles.overflowHint} aria-hidden="true">
            <span className={styles.overflowArrow}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        )}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  )
}
