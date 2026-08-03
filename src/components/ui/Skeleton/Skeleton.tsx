import styles from './Skeleton.module.css'

type SkeletonVariant = 'line' | 'title' | 'block' | 'circle'

interface SkeletonProps {
  /** 어떤 모양의 자리인지. 기본은 한 줄짜리 텍스트(`line`). */
  variant?: SkeletonVariant
  /** CSS 길이. 문단 끝줄을 짧게 하는 것처럼 자연스러운 리듬을 만들 때 쓴다. */
  width?: string
  /** `block`은 높이가 내용마다 다르므로 직접 준다. */
  height?: string
  className?: string
}

/**
 * 로딩 자리표시자 한 조각.
 *
 * **"데이터 없음"과 "아직 안 옴"은 다르다.** 조회가 끝나기 전에 빈 목록을 보여주면 사용자는
 * 없는 것으로 읽고 떠난다. 들어올 내용의 모양을 미리 그려서 "오는 중"임을 전달한다.
 *
 * 접근성: 개별 조각에 role을 달지 않는다. 스크린리더에는 자리표시자 10개가 아니라 영역 하나가
 * "불러오는 중"이라고 한 번만 들려야 하므로, {@link SkeletonText}와 각 패널이 감싸는 컨테이너에
 * `aria-busy`와 안내 문구를 둔다.
 *
 * 사용 예:
 *   <Skeleton width="60%" />
 *   <Skeleton variant="block" height="180px" />
 */
export function Skeleton({ variant = 'line', width, height, className }: SkeletonProps) {
  const classes = [styles.base, styles[variant], className].filter(Boolean).join(' ')
  return <span className={classes} style={{ width, height }} aria-hidden="true" />
}

interface SkeletonTextProps {
  /** 몇 줄을 그릴지. 실제로 들어올 문단 길이에 가깝게 준다. */
  lines?: number
  /** 마지막 줄 너비. 문단처럼 보이도록 기본은 짧게 끊는다. */
  lastLineWidth?: string
  className?: string
}

/**
 * 여러 줄짜리 텍스트 자리. 마지막 줄을 짧게 끊어 실제 문단의 리듬을 흉내낸다 —
 * 같은 길이 막대가 반복되면 표처럼 보여서 오히려 눈에 걸린다.
 *
 * 사용 예:
 *   <SkeletonText lines={3} />
 */
export function SkeletonText({ lines = 3, lastLineWidth = '55%', className }: SkeletonTextProps) {
  const classes = [styles.stack, className].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </div>
  )
}
