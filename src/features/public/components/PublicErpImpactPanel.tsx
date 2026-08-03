import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskItem } from '../../../api/types'
import styles from './PublicErpImpactPanel.module.css'

interface PublicErpImpactPanelProps {
  materials: MaterialRiskItem[]
}

/**
 * 데이터 품질 코드 → 화면 표기. 백엔드가 `VALID < STALE < INCOMPLETE < INVALID` 순으로 매긴다.
 */
const QUALITY_LABEL: Record<string, string> = {
  VALID: '정상',
  STALE: '오래된 스냅샷',
  INCOMPLETE: '일부 누락',
  INVALID: '사용 불가',
}

/** VALID만 정상 색, 나머지는 주의를 끌어야 하므로 경고 색. INVALID는 심각 색. */
function qualityClassName(status: string): string {
  if (status === 'VALID') return `${styles.qcStatus} ${styles.pass}`
  if (status === 'INVALID') return `${styles.qcStatus} ${styles.fail}`
  return `${styles.qcStatus} ${styles.stale}`
}

/**
 * 재고 여유(재고일수 − 안전재고일수) 한 줄. 둘 중 하나라도 없으면 계산하지 않는다 —
 * 없는 값을 0으로 두면 "안전재고를 0일 잡았다"가 되어 여유가 실제보다 커 보인다.
 */
function toBufferText(material: MaterialRiskItem): string | null {
  if (material.inventory_days === null || material.safety_stock_days === null) return null
  const buffer = Math.round(material.inventory_days - material.safety_stock_days)
  return buffer < 0 ? `안전재고 대비 ${Math.abs(buffer)}일 부족` : `안전재고 대비 ${buffer}일 여유`
}

/**
 * ERP 영향 자재 재고 계약 분석. `GET /api/v1/material-risk/overview`의 재고·안전재고·데이터
 * 품질을 자재별로 보여준다.
 *
 * tier1 `ErpImpactPanel`(`features/purchasing/components/`, `materials` 배열 prop 기반)을
 * 이식한 것 — 같은 이름의 기존 컴포넌트(Phase 4 MVP, `events` 배열 prop)와 prop 계약이 달라
 * `Public` 접두로 분리했다(사용자 결정, 2026-08-03).
 *
 * 사용 예:
 *   <PublicErpImpactPanel materials={overview.materials} />
 */
export function PublicErpImpactPanel({ materials }: PublicErpImpactPanelProps) {
  return (
    <ScrollCard
      headingId="erp-impact-heading"
      title="ERP 영향 자재 재고 계약 분석"
      // 리스트 항목 4개 초과 시 스크롤 트리거용 높이(design-tokens.md "카드 레이아웃·스크롤 규칙" d).
      maxBodyHeight={360}
    >
      {materials.length === 0 ? (
        <p className={styles.empty}>표시할 자재가 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {materials.map((material) => {
            const buffer = toBufferText(material)
            return (
              <li key={material.erp_material_id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.materialCode}>{material.erp_material_id}</span>
                  <span className={styles.stockDays}>
                    {material.inventory_days !== null
                      ? `재고 소진까지 ${Math.round(material.inventory_days)}일`
                      : '재고 데이터 없음'}
                  </span>
                  <span className={qualityClassName(material.data_quality_status)}>
                    데이터 품질 {QUALITY_LABEL[material.data_quality_status] ?? material.data_quality_status}
                  </span>
                </div>
                <p className={styles.reason}>
                  {material.material_name}
                  {material.safety_stock_days !== null &&
                    ` · 안전재고 ${Math.round(material.safety_stock_days)}일`}
                </p>
                {buffer && <p className={styles.candidates}>{buffer}</p>}
                {material.unavailable_reason && (
                  <p className={styles.candidates}>{material.unavailable_reason}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </ScrollCard>
  )
}
