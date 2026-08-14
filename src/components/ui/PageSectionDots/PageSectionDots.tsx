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
 * 섹션의 도트만 활성 표시한다(여러 개 동시 활성 가능). 도트 클릭 시 해당 heading을
 * 감싸는 ScrollCard의 `<section>` 컨테이너로 `scrollIntoView`.
 *
 * IntersectionObserver는 `rootMargin`을 `-{header-height}px 0px -60% 0px`로 줘
 * sticky Header에 가려지는 상단 구간을 관찰 대상에서 빼고, 하단도 좁혀 "뷰포트 상단
 * 40% 지점"만 기준선으로 삼는다(통상적 스크롤스파이 기법 — 큰 섹션 통과 중 도트가 하나도
 * 안 켜지는 사각지대, 작은 섹션들 사이에서 여러 도트가 동시에 켜지는 문제를 완화). 이 관찰
 * 대상은 heading 그대로 두되(활성 판정과는 무관), 클릭 시 스크롤 대상은 heading이 아니라
 * `ScrollCard.module.css`의 `.panel`(section 컨테이너)로 삼는다 — `.panel`에
 * `scroll-margin-top: var(--header-height)`를 줘 `scrollIntoView`도 같은 헤더 높이만큼
 * 보정되는데, heading에 걸면 heading 자체는 헤더 아래로 정확히 오지만 그 위 `.panel`의
 * padding만큼 카드 테두리가 헤더 뒤로 말려들어간다(실측 확인 — 소급 수정).
 *
 * `variant="withAside"`는 main-aside 사이 레일에 sticky로, `variant="standalone"`은
 * 뷰포트 우측 끝에 sticky로 배치되는 걸 전제로 한 스타일을 적용한다.
 * 하단 리모컨은 "맨 위로"·"맨 아래로" 두 버튼이다(기능 없던 "목록" 버튼은 제거).
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
 * 8개 섹션 전체가 각자 자기 도트 위치에 개별 고정된 평면 배지(계층 들여쓰기 없음)로 동시에
 * 나타난다. `onMouseEnter`(=`openHover`, hover 대상 갱신+1단계로 리셋)는 `<li>`가 아니라
 * 실제 도트(`<button>`)에만 건다 — `<li>`에 걸면 2단계로 확장된 뒤 배지 영역(li의 다른
 * 부분)을 마우스로 훑기만 해도 다시 `openHover`가 불려 1단계로 리셋돼버린다. 도트(button)
 * 에만 걸면 "다른 도트로 실제로 이동"할 때만 리셋되고, 이미 열린 배지 목록을 죽 훑어보는
 * 동안엔 안 닫힌다. `<ul>`에만 `onMouseLeave`를 걸어 DOM 포함 관계상 트리거→팝오버 이동
 * 중엔 안 닫히게 한다(WCAG 1.4.13 hoverable). 팝오버는 `right: 100%` + `padding-right`로
 * 트리거에 맞닿게 배치해(마진이 아니라 패딩으로 여백을 줌) 트리거-팝오버 사이에 아무
 * 요소도 없는 빈 공간이 생기지 않게 했다 — 빈 공간이 있으면 그 위를 지나는 순간 컨테이너
 * 밖으로 취급돼 깜빡이며 닫힐 수 있다. `Escape`로도 닫힌다(dismissible). 배지 중 현재
 * 활성 섹션(스크롤 위치 기준)과 같은 것만 강조 표시한다.
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
    const heading = document.getElementById(headingId)
    // heading(<h2>) 자체가 아니라 그걸 감싸는 ScrollCard의 <section>(카드 컨테이너)을
    // 스크롤 대상으로 삼는다 — scroll-margin-top이 이제 heading이 아니라 .panel(section)에
    // 걸려 있으므로(ScrollCard.module.css), 그 CSS가 실제로 적용되려면 scrollIntoView의
    // 대상도 같은 요소여야 한다. heading에 <section> 조상이 없는 예외적인 경우를 대비해
    // heading 자체로 폴백한다.
    const container = heading?.closest('section') ?? heading
    container?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    // 8개 배지를 "현재 호버 중인 도트 하나"에 앵커링된 단일 리스트로 몰아 렌더링하지 않는다
    // — 그러면 배지 간격이 도트 실제 간격과 어긋나고, 항상 그 순간 호버 중인 도트 근처에
    // 뭉쳐 보인다(실측 확인). 대신 각 li가 자기 자신의 배지 1개만 렌더링하고, 그 li 자체가
    // 이미 실제 도트와 정확히 같은 위치(같은 <ul> 안, 같은 gap)에 있으므로 별도 간격 계산
    // 없이 도트 간격을 그대로 물려받는다. 1단계는 호버 중인 도트의 배지만 보이고, 2단계
    // (expanded)로 넘어가면 모든 배지가 동시에 나타난다 — "확장"이 한 배지가 커지는 게
    // 아니라 여러 배지가 동시에 opacity로 나타나는 방식으로 바뀌었으므로, 개별 배지 높이가
    // 고정이라 더 이상 max-height 트랜지션이 필요 없다(opacity+transform만으로 충분).
    const isHovered = hover.hovered === section.id
    const showPill = isHovered || hover.expanded
    const isCurrent = displayActiveIds.has(section.id)
    const panelClassName = [styles.hoverPanel, showPill && styles.hoverPanelVisible].filter(Boolean).join(' ')

    return (
      <div className={panelClassName} onMouseEnter={hover.expandHover} aria-hidden={!showPill}>
        {showPill && (
          <span className={isCurrent ? `${styles.hoverPill} ${styles.hoverPillCurrent}` : styles.hoverPill}>
            {section.id}
          </span>
        )}
      </div>
    )
  }

  return (
    <nav className={railClassName} aria-label="페이지 섹션 이동">
      <ul className={styles.dots} onMouseLeave={hover.closeHover}>
        {sections.map((section) => (
          <li key={section.id} className={styles.dotItem}>
            <button
              type="button"
              className={displayActiveIds.has(section.id) ? `${styles.dot} ${styles.dotActive}` : styles.dot}
              onClick={() => scrollToSection(section.headingId)}
              onMouseEnter={() => hover.openHover(section.id)}
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
      </div>
    </nav>
  )
}
