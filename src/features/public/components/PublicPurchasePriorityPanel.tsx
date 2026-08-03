import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { toPurchasePriority } from '../../../api/publicPurchasingDashboard.api'
import type { MaterialRiskItem } from '../../../api/types'
import styles from './PublicPurchasePriorityPanel.module.css'

interface PublicPurchasePriorityPanelProps {
  materials: MaterialRiskItem[]
}

/**
 * 구매 대응 우선순위. 별도 우선순위 스키마가 없으므로 자재별 위험 목록
 * (`GET /api/v1/material-risk/overview`)을 등급 → 재고일수 순으로 정렬해 파생한다.
 *
 * tier1 `PurchasePriorityPanel`(`features/purchasing/components/`, `materials` 배열 prop
 * 기반)을 이식한 것 — 같은 이름의 기존 컴포넌트(Phase 4 MVP, `events` 배열 prop)와 prop
 * 계약이 달라 `Public` 접두로 분리했다(사용자 결정, 2026-08-03).
 *
 * 정렬 규칙은 `toPurchasePriority`(`publicPurchasingDashboard.api.ts`)에 있다. 평가하지
 * 못한 자재를 주의보다 앞에 세우는 이유도 그 주석에 있다(등급이 없는 건 안전해서가 아니라
 * 확인하지 못해서다).
 *
 * 사용 예:
 *   <PublicPurchasePriorityPanel materials={overview.materials} />
 */
export function PublicPurchasePriorityPanel({ materials }: PublicPurchasePriorityPanelProps) {
  const ranked = toPurchasePriority(materials)

  return (
    <ScrollCard
      headingId="purchase-priority-heading"
      title="구매 대응 우선순위"
      // 리스트 항목 4개 초과 시 스크롤 트리거용 높이(design-tokens.md "카드 레이아웃·스크롤 규칙" d).
      maxBodyHeight={368}
    >
      {ranked.length === 0 ? (
        <p className={styles.empty}>표시할 자재가 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {ranked.map((material, index) => (
            <li key={material.erp_material_id} className={styles.item}>
              <span className={styles.rank}>{index + 1}</span>
              <div className={styles.body}>
                <span className={styles.material}>
                  {material.material_name}
                  {material.grade ? (
                    <RiskGradeBadge grade={material.grade} />
                  ) : (
                    <span className={styles.unavailable}>평가 불가</span>
                  )}
                </span>
                <span className={styles.stockDays}>
                  {material.inventory_days !== null
                    ? `재고 소진까지 ${Math.round(material.inventory_days)}일`
                    : '재고 데이터 없음'}
                </span>
                {material.grade === null && material.unavailable_reason && (
                  <span className={styles.recommendation}>{material.unavailable_reason}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </ScrollCard>
  )
}
