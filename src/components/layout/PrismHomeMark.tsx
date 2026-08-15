import { lazy, Suspense } from 'react'
import styles from './PrismHomeMark.module.css'

// three.js(약 570KB) 실물 렌더러는 별도 청크로 뗀다 — 헤더 로고 하나 때문에 모든 페이지가
// three를 동기 다운로드하던 것을 막는다. 첫 페인트 이후 비동기로 로드된다.
const PrismHomeMarkCanvas = lazy(() => import('./PrismHomeMarkCanvas'))

/**
 * 헤더 로고. 실제 WebGL 크리스털은 {@link PrismHomeMarkCanvas}가 그리며 lazy 로드된다.
 * three가 도착하기 전에는 아래 fallback(같은 크기의 frame — CSS `.frame::after` 글로우만
 * 보이는 정적 자리)이 뜬다. 로고가 뒤늦게 채워져도 시각적 문제가 없다.
 */
export function PrismHomeMark() {
  return (
    <Suspense fallback={<span className={styles.frame} aria-hidden="true" />}>
      <PrismHomeMarkCanvas />
    </Suspense>
  )
}

// [ROLLBACK] three 지연 로드 이전에는 PrismHomeMark 자체가 three를 동기 import 해 헤더에서
// 바로 렌더했다(현재 PrismHomeMarkCanvas.tsx의 본문 = 그 구현). 되돌리려면 이 파일을 지우고
// PrismHomeMarkCanvas.tsx를 PrismHomeMark.tsx로 되돌린 뒤 export를 `export function PrismHomeMark`
// 로 바꾸면 된다.
