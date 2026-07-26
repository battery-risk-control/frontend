import { useEffect, useState } from 'react'
import styles from './PageSectionDots.module.css'

export interface PageSectionDotsSection {
  id: string
  headingId: string
}

interface PageSectionDotsProps {
  sections: PageSectionDotsSection[]
  variant: 'withAside' | 'standalone'
}

/**
 * 페이지 섹션 이동용 도트 인디케이터 + 상하단 이동 리모컨. `sections`로 지정한
 * heading 요소들을 IntersectionObserver로 다중 관찰해, 현재 뷰포트에 보이는
 * 섹션의 도트만 활성 표시한다(여러 개 동시 활성 가능). 도트 클릭 시 해당
 * heading으로 `scrollIntoView`.
 * `variant="withAside"`는 main-aside 사이 레일에 sticky로, `variant="standalone"`은
 * 뷰포트 우측 끝에 sticky로 배치되는 걸 전제로 한 스타일을 적용한다.
 * 하단 리모컨의 "목록" 버튼은 자리만 확보한 placeholder — 클릭 핸들러 없음(후속 기능).
 *
 * 사용 예:
 *   <PageSectionDots
 *     variant="withAside"
 *     sections={[{ id: '상단 KPI 요약', headingId: 'kpi-summary-heading' }]}
 *   />
 */
export function PageSectionDots({ sections, variant }: PageSectionDotsProps) {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const entries = sections
      .map((section) => ({ section, el: document.getElementById(section.headingId) }))
      .filter((entry): entry is { section: PageSectionDotsSection; el: HTMLElement } => entry.el !== null)

    if (entries.length === 0) return

    const observer = new IntersectionObserver((observedEntries) => {
      setActiveIds((prev) => {
        const next = new Set(prev)
        observedEntries.forEach((observedEntry) => {
          const matched = entries.find((entry) => entry.el === observedEntry.target)
          if (!matched) return
          if (observedEntry.isIntersecting) {
            next.add(matched.section.id)
          } else {
            next.delete(matched.section.id)
          }
        })
        return next
      })
    })

    entries.forEach((entry) => observer.observe(entry.el))
    return () => observer.disconnect()
  }, [sections])

  function scrollToSection(headingId: string) {
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function scrollToBottom() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  }

  const railClassName =
    variant === 'withAside' ? `${styles.rail} ${styles.railWithAside}` : `${styles.rail} ${styles.railStandalone}`

  return (
    <nav className={railClassName} aria-label="페이지 섹션 이동">
      <ul className={styles.dots}>
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={activeIds.has(section.id) ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              onClick={() => scrollToSection(section.headingId)}
              aria-label={`${section.id}로 이동`}
              aria-current={activeIds.has(section.id)}
            />
          </li>
        ))}
      </ul>
      <div className={styles.remote}>
        <button type="button" className={styles.remoteButton} onClick={scrollToTop} aria-label="맨 위로 이동">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        <button type="button" className={styles.remoteButton} onClick={scrollToBottom} aria-label="맨 아래로 이동">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button type="button" className={styles.remoteButton} disabled aria-label="목록 (준비 중)">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
