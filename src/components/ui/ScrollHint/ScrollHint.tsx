import { useEffect, useState } from 'react'
import styles from './ScrollHint.module.css'

interface ScrollHintProps {
  targetId: string
}

/**
 * 실험적(Phase 후속 전체 반응형 작업 전까지의 임시 기능) — 좁은 화면에서 그리드가
 * 1열로 쌓일 때 아래에 더 볼 카드가 있음을 알리는 하단 그라데이션+화살표 힌트.
 * `targetId`로 지정한 요소(보통 그리드 마지막 카드의 heading)가 IntersectionObserver로
 * 뷰포트에 보이는 게 감지되면 자동으로 사라진다(unmount).
 *
 * 사용 예:
 *   <ScrollHint targetId="supply-news-feed-heading" />
 */
export function ScrollHint({ targetId }: ScrollHintProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [targetId])

  if (!visible) return null

  return (
    <div className={styles.hint} aria-hidden="true">
      <span className={styles.arrowBadge}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </div>
  )
}
