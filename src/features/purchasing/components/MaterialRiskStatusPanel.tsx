import { Link } from 'react-router-dom'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskItem } from '../../../api/types'
import styles from './MaterialRiskStatusPanel.module.css'

interface MaterialRiskStatusPanelProps {
  materials: MaterialRiskItem[]
}

/** 0.42 → "42%". 백엔드가 0~1 비율로 주므로 화면에서 환산한다. */
function toPercent(ratio: number | null): string | null {
  if (ratio === null) return null
  return `${Math.round(ratio * 100)}%`
}

/** 평가된 자재의 요약 한 줄. 값이 없는 항목은 빼고 있는 것만 이어 붙인다. */
function summarize(material: MaterialRiskItem): string {
  const parts = [
    material.score !== null ? `노출도 ${Math.round(material.score)}점` : null,
    material.inventory_days !== null ? `재고 ${Math.round(material.inventory_days)}일` : null,
    toPercent(material.supplier_dependency_ratio)
      ? `주 공급사 의존 ${toPercent(material.supplier_dependency_ratio)}`
      : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '세부 지표가 아직 없습니다.'
}

/**
 * 원자재 공급사 리스크 현황. `GET /api/v1/material-risk/overview`의 자재별 위험 목록을 나열한다.
 *
 * 원래 mock `risk_event`를 그리던 패널이다. 이 카드가 보여주는 재고일수·의존도는 ERP 실값이라
 * 지어낸 값을 띄우면 "우리 재고가 이렇다"는 잘못된 인상을 준다 — 공개 API(`/public/**`)는 이
 * 값들을 의도적으로 빼고 내려주므로 인증 API를 쓴다.
 *
 * **평가하지 못한 자재도 목록에 남긴다.** `grade`가 null인 자재는 배지 대신 "평가 불가"와
 * 사유(`unavailable_reason`)를 보여준다 — 목록에서 빼면 담당자 입장에서 그 자재가 안전한 것인지
 * 확인이 안 된 것인지 알 방법이 없어진다.
 *
 * 링크는 원자재 위험 화면으로만 보낸다. 그 화면이 아직 특정 자재를 여는 쿼리 파라미터를
 * 받지 않아서(`MaterialRiskPage`에 `useSearchParams` 없음) `?material=`을 붙여도 무시되기 때문이다.
 *
 * 사용 예:
 *   <MaterialRiskStatusPanel materials={overview.materials} />
 */
export function MaterialRiskStatusPanel({ materials }: MaterialRiskStatusPanelProps) {
  return (
    <ScrollCard
      headingId="material-risk-heading"
      title="원자재 공급사 리스크 현황"
      // 리스트 항목 4개 초과 시 스크롤 트리거용 높이(design-tokens.md "카드 레이아웃·스크롤 규칙" d).
      maxBodyHeight={440}
    >
      {materials.length === 0 ? (
        <p className={styles.empty}>표시할 자재가 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {materials.map((material) => (
            <li key={material.erp_material_id} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.material}>{material.material_name}</span>
                <span className={styles.materialCode}>{material.erp_material_id}</span>
                {material.grade ? (
                  <RiskGradeBadge grade={material.grade} />
                ) : (
                  <span className={styles.unavailable}>평가 불가</span>
                )}
              </div>
              <p className={styles.summary}>
                {material.grade
                  ? summarize(material)
                  : (material.unavailable_reason ?? '평가에 필요한 데이터가 없습니다.')}
              </p>
              <Link
                to={`/purchasing/materials?material=${encodeURIComponent(material.erp_material_id)}`}
                className={styles.briefingLink}
              >
                자재 상세 보기
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ScrollCard>
  )
}
