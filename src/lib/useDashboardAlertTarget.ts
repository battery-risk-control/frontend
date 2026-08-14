import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

/** sticky 헤더(--header-height 56px) 아래로 앵커가 가려지지 않게 두는 여유 오프셋. */
const HEADER_OFFSET = 72

/**
 * 주요 알림(가격 변동성 주의)에서 넘어온 대시보드 내 이동을 처리한다. 구매팀·비로그인 대시보드가
 * 같은 알림 규칙을 쓰므로 두 페이지가 공유한다.
 *
 *  - URL 쿼리 `?material=자재` → 그 자재명을 돌려준다. 페이지는 이를 `ImportDependencyRow`의
 *    `selectedMaterial`로 넘겨 원자재 가격 추이 그래프를 그 자재 단일 선으로 좁힌다.
 *  - URL 해시 `#앵커` → 해당 섹션(원자재 가격 추이 + 수입 의존도)으로 스크롤한다. 같은 페이지
 *    앵커라 라우터가 자동으로 스크롤해주지 않으므로 직접 처리한다. 로딩 중에도 섹션 제목(앵커
 *    요소)은 렌더되므로 즉시 스크롤할 수 있다.
 *
 * 사용 예:
 *   const alertMaterial = useDashboardAlertTarget()
 *   <ImportDependencyRow ... selectedMaterial={alertMaterial} />
 */
export function useDashboardAlertTarget(): string | undefined {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const material = searchParams.get('material') ?? undefined

  useEffect(() => {
    if (!location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    const element = document.getElementById(id)
    if (!element) return
    const top = element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: 'smooth' })
  }, [location.hash, location.search])

  return material
}
