import { useRef } from 'react'
import { RiskGauge } from '../../../components/ui/RiskGauge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { HorizontalScrollHint } from '../../../components/ui/HorizontalScrollHint'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import { useHorizontalDragScroll } from '../../../lib/useHorizontalDragScroll'
import type { MaterialRiskGaugeItem } from '../../../api/types'
import styles from './MaterialRiskOverviewRow.module.css'

interface MaterialRiskOverviewRowProps {
  gauges: MaterialRiskGaugeItem[]
}

/**
 * 지식허브(데이터_활용_및_모델_학습_기획정의서) 원자재 목록 중 아직 실제 게이지 데이터가 없는
 * 자재를 제목만 있는 placeholder 카드로 보여준다(CLAUDE.md "부분 placeholder UI" 원칙 — 데이터
 * 없이 무리하게 채우지 않고 "준비 중" 상태로 대체). 알루미늄은 원본 목록에 명시적으로 없으나
 * 배터리 원자재로 흔히 언급돼 후보에 포함했다.
 */
const PLACEHOLDER_MATERIALS = ['코발트', '망간', '구리', '알루미늄', '철광석', '희토류']

/**
 * 원자재 리스크 개요 상세 그리드(데모 화면ID UX-01-DB, surin 이식) — 실제 게이지 데이터가 있는
 * 자재 카드(gauges)에 이어, 아직 데이터가 없는 자재의 placeholder 카드("준비 중")를 함께
 * 보여준다. 점수 카드(외부 리스크 종합/ERP 영향)는 "원자재" 카드와 형제 관계인 별도 컴포넌트
 * (ScoreCardPanel)로 분리돼 더 이상 이 그리드에 포함되지 않는다.
 *
 * 카드가 9장(3+6)으로 늘어나며 세로 줄바꿈 대신 한 줄 가로 나열 + 가로 스크롤로 전환했다
 * (design-tokens.md "스크롤 UI 노출 원칙" — 형제 카드 캐러셀형). 폭은 섹션이 준 실제 폭에
 * 그대로 맞추고(고정 카드 수 계산 없음), 넘치는 만큼만 스크롤 대상이 된다. 네이티브
 * 스크롤바를 그대로 노출하고, 가로 휠 지원이 기기마다 약한 점을 보완하기 위해 마우스
 * 드래그(grab-to-scroll)로도 이동할 수 있다. `useScrollOverflowHint`를 `axis: 'horizontal'`로
 * 적용하고, 좌우 그라데이션+화살표 힌트는 공용 컴포넌트 `HorizontalScrollHint`로 표시한다.
 *
 * 사용 예:
 *   <MaterialRiskOverviewRow gauges={gauges} />
 */
export function MaterialRiskOverviewRow({ gauges }: MaterialRiskOverviewRowProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const { hasOverflowTop: hasOverflowLeft, hasOverflowBottom: hasOverflowRight } = useScrollOverflowHint(
    gridRef,
    true,
    'horizontal',
  )
  const drag = useHorizontalDragScroll(gridRef)

  return (
    <div className={styles.wrapper}>
      <div
        ref={gridRef}
        className={drag.isDragging ? `${styles.grid} ${styles.dragging}` : styles.grid}
        onMouseDown={drag.onMouseDown}
        onMouseMove={drag.onMouseMove}
        onMouseUp={drag.onMouseUp}
        onMouseLeave={drag.onMouseLeave}
      >
        {gauges.map((gauge) => (
          <ScrollCard
            key={gauge.name}
            headingId={`material-risk-gauge-${gauge.name}-heading`}
            title={gauge.name}
            caption={gauge.basis}
          >
            <div className={styles.gaugeBody}>
              <RiskGradeBadge grade={gauge.grade} />
              <RiskGauge grade={gauge.grade} />
              {gauge.changeLabel && <span className={styles.changeLabel}>{gauge.changeLabel}</span>}
            </div>
          </ScrollCard>
        ))}
        {PLACEHOLDER_MATERIALS.map((name) => (
          <ScrollCard key={name} headingId={`material-risk-gauge-${name}-heading`} title={name}>
            <p className={styles.placeholder}>준비 중</p>
          </ScrollCard>
        ))}
      </div>
      <HorizontalScrollHint showLeft={hasOverflowLeft} showRight={hasOverflowRight} />
    </div>
  )
}
