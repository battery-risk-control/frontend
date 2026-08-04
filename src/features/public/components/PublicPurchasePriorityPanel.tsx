import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { toPurchasePriority } from '../../../api/publicPurchasingDashboard.api'
import type { MaterialRiskItem } from '../../../api/types'
import styles from './PublicPurchasePriorityPanel.module.css'

interface PublicPurchasePriorityPanelProps {
  materials: MaterialRiskItem[]
  /** 아직 조회가 끝나지 않았는지. "표시할 자재가 없습니다"와 구분해야 한다. */
  isLoading?: boolean
}

/** 로딩 중 잡아둘 줄 수. 카드가 4개 넘으면 스크롤되므로 그 언저리로 맞춘다. */
const PRIORITY_SKELETON_ROWS = 4

/**
 * 구매 대응 우선순위. 별도 우선순위 스키마가 없으므로 자재별 위험 목록
 * (`GET /api/v1/material-risk/overview`)을 등급 → 재고일수 순으로 정렬해 파생한다.
 *
 * tier1 `PurchasePriorityPanel`(`features/purchasing/components/`, `materials` 배열 prop
 * 기반)을 이식한 것 — 같은 이름의 기존 컴포넌트(Phase 4 MVP, `events` 배열 prop)와 prop
 * 계약이 달라 `Public` 접두로 분리했다(사용자 결정, 2026-08-03).
 *
 * 정렬 규칙은 `toPurchasePriority`(`publicPurchasingDashboard.api.ts`)에 있다. **평가하지
 * 못한 자재는 순위를 붙이지 않고 목록 아래 별도 영역으로 뺀다** — 순위 목록의 숫자는 "얼마나
 * 급한가"로 읽히는데, 확인이 안 된 것을 그 자리에 끼우면 두 뜻이 섞인다.
 *
 * 사용 예:
 *   <PublicPurchasePriorityPanel materials={overview.materials} />
 */
export function PublicPurchasePriorityPanel({
  materials,
  isLoading = false,
}: PublicPurchasePriorityPanelProps) {
  const { ranked, unavailable } = toPurchasePriority(materials)

  return (
    <ScrollCard
      headingId="purchase-priority-heading"
      title="구매 대응 우선순위"
      // 리스트 항목 4개 초과 시 스크롤 트리거용 높이(design-tokens.md "카드 레이아웃·스크롤 규칙" d).
      maxBodyHeight={368}
    >
      {isLoading ? (
        <ol className={styles.list} aria-busy="true" aria-label="구매 대응 우선순위 불러오는 중">
          {Array.from({ length: PRIORITY_SKELETON_ROWS }, (_, index) => (
            <li key={index} className={styles.item}>
              <span className={styles.rank}>
                <Skeleton width="1.2em" />
              </span>
              <div className={styles.body}>
                <span className={styles.material}>
                  <Skeleton width="8em" />
                </span>
                <span className={styles.stockDays}>
                  <Skeleton width="60%" />
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : ranked.length === 0 && unavailable.length === 0 ? (
        <p className={styles.empty}>표시할 자재가 없습니다.</p>
      ) : (
        <>
          <ol className={styles.list}>
            {ranked.map((material, index) => (
              <li key={material.erp_material_id} className={styles.item}>
                <span className={styles.rank}>{index + 1}</span>
                <div className={styles.body}>
                  <span className={styles.material}>
                    {material.material_name}
                    {material.grade && <RiskGradeBadge grade={material.grade} />}
                  </span>
                  <span className={styles.stockDays}>
                    {material.inventory_days !== null
                      ? `재고 소진까지 ${Math.round(material.inventory_days)}일`
                      : '재고 데이터 없음'}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          {/* 평가하지 못한 자재. 순위를 붙이지 않는다 — 순위 목록에서 숫자는 급한 정도로
              읽히는데, 확인이 안 된 것을 그 자리에 끼우면 두 뜻이 섞인다. 대신 별도 영역과
              라벨로 드러내고 사유를 함께 적어 무엇을 채워야 하는지 바로 알 수 있게 한다. */}
          {unavailable.length > 0 && (
            <section className={styles.unavailableSection} aria-label="평가 불가 자재">
              <h3 className={styles.unavailableHeading}>
                평가 불가 <span className={styles.unavailableCount}>{unavailable.length}</span>
              </h3>
              <ul className={styles.unavailableList}>
                {unavailable.map((material) => (
                  <li key={material.erp_material_id} className={styles.unavailableItem}>
                    <span className={styles.material}>
                      {material.material_name}
                      <span className={styles.unavailable}>평가 불가</span>
                    </span>
                    {material.unavailable_reason && (
                      <span className={styles.recommendation}>{material.unavailable_reason}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </ScrollCard>
  )
}
