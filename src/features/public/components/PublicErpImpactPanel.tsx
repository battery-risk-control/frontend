import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { MaterialRiskItem } from '../../../api/types'
import { dataQualityLabel, dataQualityTone } from '../../../lib/dataQuality'
import styles from './PublicErpImpactPanel.module.css'

interface PublicErpImpactPanelProps {
  materials: MaterialRiskItem[]
}

/**
 * 데이터 품질 색 등급 → 이 패널의 CSS 클래스. 코드→라벨·색 등급은 원자재 위험 화면과
 * 공유한다({@link dataQualityLabel}) — 같은 코드를 두 화면이 다르게 부르지 않게 하려는 것이다.
 *
 * 예전 이 자리에 있던 "품질 검증 통과/미통과"(mock `quality_check`)와는 **다른 것**이다.
 * 그쪽은 공급사의 IATF16949·PPAP 인증 여부였고, 이건 계산에 쓴 ERP 데이터가 쓸 만한지다.
 * 실 API에 공급사 인증 필드가 없어 같은 자리를 데이터 품질이 대신한다 — 라벨도 그에 맞게 바꿨다.
 */
const TONE_CLASS: Record<ReturnType<typeof dataQualityTone>, string> = {
  normal: styles.pass,
  warning: styles.stale,
  critical: styles.fail,
  neutral: styles.stale,
}

function qualityClassName(status: string): string {
  return `${styles.qcStatus} ${TONE_CLASS[dataQualityTone(status)]}`
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
                    데이터 품질 {dataQualityLabel(material.data_quality_status)}
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
