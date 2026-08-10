import type {
  AiBriefingDetail,
  CountryDependencyItem,
  MaterialRiskRankItem,
} from '../../../api/types'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import styles from './ExecutivePriorityAlert.module.css'

interface ExecutivePriorityAlertProps {
  risk?: MaterialRiskRankItem
  briefing?: AiBriefingDetail
  topCountry?: CountryDependencyItem
  alternativeSupplierCount: number
  reviewRequiredCount: number
  onOpenBriefing?: () => void
  onOpenAlternatives?: () => void
  onOpenReview?: () => void
  onOpenDecision?: () => void
}

export function ExecutivePriorityAlert({
  risk,
  briefing,
  topCountry,
  alternativeSupplierCount,
  reviewRequiredCount,
  onOpenBriefing,
  onOpenAlternatives,
  onOpenReview,
  onOpenDecision,
}: ExecutivePriorityAlertProps) {
  if (!risk && !briefing) {
    return (
      <section className={`${styles.alert} ${styles.empty}`} aria-label="핵심 위험 알림">
        <span className={styles.badge}>현황</span>
        <div>
          <strong>현재 경영진에게 보고할 핵심 위험이 없습니다.</strong>
          <p>새로운 위험 평가가 저장되면 가장 중요한 사건과 대응 판단을 여기에 표시합니다.</p>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.alert} aria-label="핵심 위험 알림">
      <span className={styles.badge}>우선 확인</span>
      <div className={styles.content}>
        <button type="button" className={styles.titleButton} onClick={onOpenBriefing}>
          {briefingTitle(briefing) ?? `${risk?.material ?? '원자재'} 공급망 위험`}
        </button>
        <p>
          {briefing
            ? <>{levelLabel(briefing.procurement_risk_level)} {briefing.procurement_risk_score.toFixed(0)}점 · {briefing.material_name ?? briefing.material_category ?? '원자재'}</>
            : risk && <>최고 위험 {risk.score.toFixed(1)}점 · {risk.material}</>}
          {topCountry && <><span aria-hidden="true"> · </span>{topCountry.country} 의존도 {topCountry.share_ratio.toFixed(1)}%</>}
        </p>
      </div>
      <div className={styles.decisionSummary} aria-label="경영 판단 요약">
        <button type="button" onClick={onOpenAlternatives}><small>대체 공급사</small><strong>{alternativeSupplierCount}곳</strong></button>
        <button type="button" onClick={onOpenReview}><small>검토 필요</small><strong>{reviewRequiredCount}건</strong></button>
        <button type="button" className={styles.decision} onClick={onOpenDecision}><small>판단</small><strong>{decisionLabel(briefing?.procurement_risk_level, reviewRequiredCount)}</strong></button>
      </div>
    </section>
  )
}

function briefingTitle(briefing?: AiBriefingDetail) {
  return briefing?.subject_title ?? briefing?.source_headline ?? null
}

function levelLabel(level: string) {
  if (level === 'CRITICAL') return '심각'
  if (level === 'WARNING') return '주의'
  return '정상'
}

function decisionLabel(level: string | undefined, reviewRequiredCount: number) {
  if (reviewRequiredCount > 0) return '근거 검토'
  if (level === 'CRITICAL') return '즉시 대응'
  if (level === 'WARNING') return '대응 확인'
  return '모니터링'
}

/** 로딩 자리표시자. 배지(둥근 pill) + 제목/부제 2줄로 실제 알림 바 모양을 흉내낸다. */
export function ExecutivePriorityAlertSkeleton() {
  return (
    <section
      className={styles.skeleton}
      aria-busy="true"
      aria-label="핵심 위험 알림 불러오는 중"
    >
      <Skeleton variant="circle" width="48px" height="22px" />
      <div className={styles.skeletonBody}>
        <Skeleton variant="title" width="42%" />
        <Skeleton width="68%" />
      </div>
    </section>
  )
}
