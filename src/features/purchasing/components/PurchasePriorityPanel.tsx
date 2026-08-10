import { Link } from 'react-router-dom'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { toPurchasePriority } from '../../../api/purchasingDashboard.api'
import type { MaterialRiskItem } from '../../../api/types'
import styles from './PurchasePriorityPanel.module.css'

interface PurchasePriorityPanelProps {
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
 * 정렬 규칙은 `toPurchasePriority`에 있다 — 화면에 두면 같은 "우선순위"를 다른 곳에서 다시
 * 계산할 때 규칙이 갈라진다. 평가하지 못한 자재를 주의보다 **앞에** 세우는 이유도 그 주석에 있다
 * (등급이 없는 건 안전해서가 아니라 확인하지 못해서다).
 *
 * mock 시절의 "권장 대체 공급사" 줄은 뺐다. 목록 API에 대체 공급사 필드가 없고
 * (자재 상세에만 `alternative_supplier_status`가 있다), 없는 이름을 지어내면 그 공급사로
 * 발주를 검토하게 되는 줄이라 특히 위험하다.
 *
 * 사용 예:
 *   <PurchasePriorityPanel materials={overview.materials} />
 */
export function PurchasePriorityPanel({
  materials,
  isLoading = false,
}: PurchasePriorityPanelProps) {
  const { ranked, unavailable } = toPurchasePriority(materials)

  return (
    <ScrollCard
      headingId="purchase-priority-heading"
      title="구매 대응 우선순위"
      actions={
        <Link to="/purchasing/materials" className={styles.detailLink}>
          전체 자재 보기 →
        </Link>
      }
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
                  <Link
                    to={`/purchasing/materials?material=${encodeURIComponent(material.erp_material_id)}`}
                    className={styles.detailLink}
                  >
                    상세 보기 →
                  </Link>
                </div>
              </li>
            ))}
          </ol>

          {/* 평가하지 못한 자재. 위 순위 목록과 같은 번호 카드로 보여주되, 번호를 회색으로
              눌러 "얼마나 급한가"의 순위가 아니라 "확인 못 한 목록의 나열"임을 시각적으로
              구분한다. 별도 영역·라벨과 사유를 함께 적어 무엇을 채워야 하는지 바로 알게 한다. */}
          {unavailable.length > 0 && (
            <section className={styles.unavailableSection} aria-label="평가 불가 자재">
              <h3 className={styles.unavailableHeading}>
                평가 불가 <span className={styles.unavailableCount}>{unavailable.length}</span>
              </h3>
              <ol className={styles.list}>
                {unavailable.map((material, index) => (
                  <li key={material.erp_material_id} className={styles.item}>
                    <span className={`${styles.rank} ${styles.rankMuted}`}>{index + 1}</span>
                    <div className={styles.body}>
                      <span className={styles.material}>
                        {material.material_name}
                        <span className={styles.unavailable}>평가 불가</span>
                      </span>
                      {material.unavailable_reason && (
                        <span className={styles.stockDays}>{material.unavailable_reason}</span>
                      )}
                      <Link
                        to={`/purchasing/materials?material=${encodeURIComponent(material.erp_material_id)}`}
                        className={styles.detailLink}
                      >
                        누락 데이터 확인 →
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </ScrollCard>
  )
}
