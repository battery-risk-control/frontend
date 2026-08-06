import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { Skeleton, SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import type { SupplierOverview } from '../../../api/types'
import { SUPPLIER_STATUS_LABEL } from '../lib/supplierStatus'
import styles from './SupplierOverviewPanel.module.css'

interface SupplierOverviewPanelProps {
  overview: SupplierOverview | null
  /** 아직 조회가 끝나지 않았는지. "발주 데이터가 없어…"와 구분해야 한다. */
  isLoading?: boolean
}

/** 상태별 색. 승인 계열은 초록, 검토는 주황, 나머지는 회색. 라벨은 SUPPLIER_STATUS_LABEL 공유. */
const STATUS_CLASS: Record<string, string> = {
  ACTIVE: styles.statusOk,
  APPROVED: styles.statusOk,
  REVIEW: styles.statusReview,
  UNDER_REVIEW: styles.statusReview,
  SUSPENDED: styles.statusBlocked,
  BLOCKED: styles.statusBlocked,
}

function StatusChip({ status }: { status: string | null }) {
  if (!status) return <span className={styles.muted}>상태 미상</span>
  return (
    <span className={`${styles.status} ${STATUS_CLASS[status] ?? styles.statusUnknown}`}>
      {SUPPLIER_STATUS_LABEL[status] ?? status}
    </span>
  )
}

/**
 * 공급사 현황 및 대체 공급사 추천 — 목업 하단 왼쪽/오른쪽 두 칸.
 *
 * **좌우의 원천이 다르다.** 왼쪽은 ERP 발주 실적(수입 의존도 도넛과 같은 집계를 공급사 단위로
 * 내린 것)이고, 오른쪽은 분석이 돌 때 `analysis_supplier_recommendations`에 저장된 추천이다.
 * 둘이 서로 다른 시점을 가리킬 수 있어 같은 카드 안에서도 구분해 둔다.
 *
 * **추천 사유를 반드시 함께 보여준다.** 목업에는 없지만, "왜 이 공급사인가"가 없으면 구매팀이
 * 화면만 보고는 판단할 수 없다 — 순위와 승인 상태만으로는 리드타임이 짧아서인지 단가가 싸서인지
 * 알 수 없다. 백엔드가 이미 문장으로 저장해 두므로 표시만 하면 된다.
 *
 * 추천이 비어 있는 건 정상 상태일 수 있다. 추천 저장은 분석이 CRITICAL/WARNING이고 자재가
 * 특정된 경우에만 일어나므로, 그런 분석이 아직 없으면 저장된 추천도 없다.
 *
 * 사용 예:
 *   <SupplierOverviewPanel overview={supplierOverview} />
 */
export function SupplierOverviewPanel({
  overview,
  isLoading = false,
}: SupplierOverviewPanelProps) {
  const current = overview?.current ?? null
  const alternatives = overview?.alternatives ?? []

  return (
    <ScrollCard
      headingId="supplier-overview-heading"
      title="공급사 현황 및 대체 공급사 추천"
      maxBodyHeight={420}
    >
      <div className={styles.columns}>
        <section className={styles.currentColumn} aria-label="현재 공급사">
          <h3 className={styles.columnTitle}>현재 공급사</h3>
          {isLoading ? (
            <div className={styles.currentCard} aria-busy="true">
              <Skeleton width="6em" />
              <Skeleton variant="title" width="10em" />
              <SkeletonText lines={2} lastLineWidth="70%" />
            </div>
          ) : current === null ? (
            <p className={styles.empty}>발주 데이터가 없어 주 공급사를 정할 수 없습니다.</p>
          ) : (
            <div className={styles.currentCard}>
              <span className={styles.supplierCode}>{current.supplier_code}</span>
              <span className={styles.supplierName}>{current.supplier_name}</span>
              <div className={styles.currentMeta}>
                <StatusChip status={current.supplier_status} />
                <span className={styles.dependency}>
                  의존도 <strong>{current.dependency_ratio.toFixed(1)}%</strong>
                </span>
              </div>
              {/* 이 비중이 어떻게 나온 값인지 밝힌다 — 통화가 섞인 발주를 환산한 결과라
                  "무엇 대비 21.8%인가"가 화면에 없으면 해석이 갈린다. */}
              <p className={styles.currentBasis}>
                전체 발주 금액 대비 (고시 매매기준율 원화 환산 기준)
              </p>
            </div>
          )}
        </section>

        <section className={styles.altColumn} aria-label="추천 대체 공급사">
          <h3 className={styles.columnTitle}>추천 대체 공급사</h3>
          {isLoading ? (
            <div aria-busy="true">
              <SkeletonText lines={4} lastLineWidth="45%" />
            </div>
          ) : alternatives.length === 0 ? (
            <p className={styles.empty}>
              저장된 추천이 없습니다. 대체 공급사 추천은 분석 등급이 심각·주의이고 자재가
              특정됐을 때 저장됩니다.
            </p>
          ) : (
            <ul className={styles.altList}>
              {alternatives.map((item) => (
                <li key={item.supplier_code} className={styles.altItem}>
                  <div className={styles.altHead}>
                    <span className={styles.rank}>{item.rank_position}</span>
                    <span className={styles.supplierName}>{item.supplier_name}</span>
                    <span className={styles.altCode}>{item.supplier_code}</span>
                    <StatusChip status={item.supplier_status} />
                  </div>
                  {item.recommendation_reason && (
                    <p className={styles.reason}>{item.recommendation_reason}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ScrollCard>
  )
}
