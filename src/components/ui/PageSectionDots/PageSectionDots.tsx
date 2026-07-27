import { useEffect, useState } from 'react'
import { useHoverDisclosure } from '../../../lib/useHoverDisclosure'
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
 *
 * IntersectionObserver는 `rootMargin`을 `-{header-height}px 0px -60% 0px`로 줘
 * sticky Header에 가려지는 상단 구간을 관찰 대상에서 빼고, 하단도 좁혀 "뷰포트 상단
 * 40% 지점"만 기준선으로 삼는다(통상적 스크롤스파이 기법 — 큰 섹션 통과 중 도트가 하나도
 * 안 켜지는 사각지대, 작은 섹션들 사이에서 여러 도트가 동시에 켜지는 문제를 완화). heading
 * 쪽에는 `ScrollCard.module.css`의 `.title`에 `scroll-margin-top: var(--header-height)`를
 * 줘 `scrollIntoView`도 같은 헤더 높이만큼 자연스럽게 보정된다(별도 오프셋 계산 없이 CSS만으로).
 *
 * `variant="withAside"`는 main-aside 사이 레일에 sticky로, `variant="standalone"`은
 * 뷰포트 우측 끝에 sticky로 배치되는 걸 전제로 한 스타일을 적용한다.
 * 하단 리모컨의 "목록" 버튼은 자리만 확보한 placeholder — 클릭 핸들러 없음(후속 기능).
 *
 * 마지막 섹션은 rootMargin 기반 IntersectionObserver만으로는 영영 active가 안 될 수 있다
 * (C7) — heading이 "뷰포트 상단 40%"에 들어오려면 그만큼 아래로 더 스크롤할 여유가
 * 문서에 남아있어야 하는데, 마지막 섹션은 그 아래에 남은 콘텐츠가 없어 이 조건을 만족할
 * 스크롤 위치 자체가 존재하지 않을 수 있기 때문이다(실측: 1400px 뷰포트 기준 약 113px
 * 부족). 문서 하단에 도달했는지(`scrollY + innerHeight`가 `scrollHeight`에 근접)를 별도로
 * 감지해 근접 시 마지막 섹션 id를 강제로 active에 포함시킨다 — rootMargin 계산과 무관하게
 * "사용자가 더 스크롤할 수 없는 지점"이라는 절대적 조건이라 콘텐츠/뷰포트 크기가 달라져도
 * 구조적으로 성립한다.
 *
 * 도트에 마우스를 올리면 2단계 hover 툴팁이 뜬다(`useHoverDisclosure` 공용 훅) — 1단계는
 * 해당 도트와 같은 높이에 섹션 제목 알약 1개만, 그 알약 위로 마우스를 옮기면 2단계로
 * 8개 섹션 전체가 세로 평면 리스트(계층 들여쓰기 없음)로 확장된다. 트리거(각 `<li>`)와
 * 팝오버를 같은 `<ul>` 안에 두고 `<ul>`에만 `onMouseLeave`를 걸어(개별 트리거는
 * `onMouseEnter`만) DOM 포함 관계상 트리거→팝오버 이동 중엔 안 닫히게 한다(WCAG 1.4.13
 * hoverable). 팝오버는 `right: 100%` + `padding-right`로 트리거에 맞닿게 배치해(마진이
 * 아니라 패딩으로 여백을 줌) 트리거-팝오버 사이에 아무 요소도 없는 빈 공간이 생기지 않게
 * 했다 — 빈 공간이 있으면 그 위를 지나는 순간 컨테이너 밖으로 취급돼 깜빡이며 닫힐 수
 * 있다. `Escape`로도 닫힌다(dismissible). 2단계 리스트에서는 현재 활성 도트와 같은 섹션의
 * 알약을 강조 표시한다.
 *
 * 사용 예:
 *   <PageSectionDots
 *     variant="withAside"
 *     sections={[{ id: '상단 KPI 요약', headingId: 'kpi-summary-heading' }]}
 *   />
 */
// 문서 하단 도달 판정 여유값 — 정수 픽셀 반올림 오차만 흡수하면 되므로 작게 둔다(구조적
// 판정이지, 특정 콘텐츠의 부족분(위 실측 113px)을 메우기 위한 값이 아니다).
const BOTTOM_THRESHOLD_PX = 2

export function PageSectionDots({ sections, variant }: PageSectionDotsProps) {
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set())
  const [nearBottom, setNearBottom] = useState(false)
  const hover = useHoverDisclosure<string>()

  useEffect(() => {
    const entries = sections
      .map((section) => ({ section, el: document.getElementById(section.headingId) }))
      .filter((entry): entry is { section: PageSectionDotsSection; el: HTMLElement } => entry.el !== null)

    if (entries.length === 0) return

    // sticky Header가 상단을 가리는 만큼(rootMargin 상단 음수) 관찰 영역에서 제외하고,
    // 하단도 -60%로 좁혀 "뷰포트 상단 40% 지점"을 기준선으로 삼는다(통상적 스크롤스파이
    // 기법) — 여러 섹션이 동시에 활성되거나, 큰 섹션 통과 중 아무 도트도 안 켜지는
    // 사각지대를 완화한다. 값은 --header-height 토큰에서 읽어와(하드코딩 방지) 헤더
    // 높이가 바뀌어도 이 컴포넌트를 따로 고칠 필요가 없게 한다.
    const headerHeightPx =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0

    const observer = new IntersectionObserver(
      (observedEntries) => {
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
      },
      { rootMargin: `-${headerHeightPx}px 0px -60% 0px` },
    )

    entries.forEach((entry) => observer.observe(entry.el))
    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    function checkNearBottom() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setNearBottom(window.scrollY >= maxScroll - BOTTOM_THRESHOLD_PX)
    }

    checkNearBottom()
    window.addEventListener('scroll', checkNearBottom, { passive: true })
    window.addEventListener('resize', checkNearBottom)
    return () => {
      window.removeEventListener('scroll', checkNearBottom)
      window.removeEventListener('resize', checkNearBottom)
    }
  }, [])

  const lastSectionId = sections[sections.length - 1]?.id
  const displayActiveIds = new Set(activeIds)
  if (nearBottom && lastSectionId) {
    displayActiveIds.add(lastSectionId)
  }

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

  function renderHoverPanel(section: PageSectionDotsSection) {
    const isHovered = hover.hovered === section.id
    const panelClassName = [
      styles.hoverPanel,
      isHovered && styles.hoverPanelVisible,
      isHovered && hover.expanded && styles.hoverPanelExpanded,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={panelClassName} onMouseEnter={hover.expandHover} aria-hidden={!isHovered}>
        {isHovered && !hover.expanded && <span className={styles.hoverPill}>{section.id}</span>}
        {isHovered && hover.expanded && (
          <ul className={styles.hoverList}>
            {sections.map((s) => (
              <li
                key={s.id}
                className={displayActiveIds.has(s.id) ? `${styles.hoverPill} ${styles.hoverPillCurrent}` : styles.hoverPill}
              >
                {s.id}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <nav className={railClassName} aria-label="페이지 섹션 이동">
      <ul className={styles.dots} onMouseLeave={hover.closeHover}>
        {sections.map((section) => (
          <li key={section.id} className={styles.dotItem} onMouseEnter={() => hover.openHover(section.id)}>
            <button
              type="button"
              className={displayActiveIds.has(section.id) ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              onClick={() => scrollToSection(section.headingId)}
              aria-label={`${section.id}로 이동`}
              aria-current={displayActiveIds.has(section.id)}
            />
            {renderHoverPanel(section)}
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
