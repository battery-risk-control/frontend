import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskItem } from '../../../api/types'
import styles from './ErpImpactPanel.module.css'

interface ErpImpactPanelProps {
  materials: MaterialRiskItem[]
}

/**
 * 데이터 품질 코드 → 화면 표기. 백엔드가 `VALID < STALE < INCOMPLETE < INVALID` 순으로 매긴다.
 *
 * 예전 이 자리에 있던 "품질 검증 통과/미통과"(mock `quality_check`)와는 **다른 것**이다.
 * 그쪽은 공급사의 IATF16949·PPAP 인증 여부였고, 이건 계산에 쓴 ERP 데이터가 쓸 만한지다.
 * 실 API에 공급사 인증 필드가 없어 같은 자리를 데이터 품질이 대신한다 — 라벨도 그에 맞게 바꿨다.
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
 * 원래 mock `erp_view`(재고 소진 일수, 대체 공급사 후보)와 `quality_check`(인증 충족 여부)를
 * 그리던 패널이다. 실 API에는 대체 공급사 후보 목록과 인증 필드가 없어 그 두 줄이 빠지고,
 * 대신 실제로 있는 값(안전재고 대비 여유, 데이터 품질)으로 바뀌었다 — 없는 값을 채워 넣기보다
 * 있는 값을 정확히 보여준다.
 *
 * 대체 공급사는 자재 상세(`GET /api/v1/material-risk/materials/{id}`)의
 * `primary_supplier.alternative_supplier_status`에 있다. 목록 API에는 없어서 여기서는 다루지
 * 않는다 — 자재 수만큼 상세를 부르면 대시보드 진입이 그만큼 느려진다.
 *
 * 사용 예:
 *   <ErpImpactPanel materials={overview.materials} />
 */
export function ErpImpactPanel({ materials }: ErpImpactPanelProps) {
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
