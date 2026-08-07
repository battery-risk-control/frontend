import { DonutChart } from '../../../components/ui/DonutChart'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import type { ImportDependencyBreakdownItem, ImportDependencyData } from '../../../api/types'
import styles from './ImportDependencyPanel.module.css'

interface ImportDependencyPanelProps {
  data: ImportDependencyData
  /**
   * 비로그인 화면에서 숫자를 흐리게 가린다.
   *
   * **보안 장치가 아니다.** 응답에는 숫자가 그대로 담겨 있어 개발자도구로 읽을 수 있다.
   * "로그인하면 볼 수 있다"는 시각적 유인일 뿐이며, 실제로 가려야 한다면 백엔드가
   * 비인증 요청에 값을 보내지 않아야 한다.
   */
  blurred?: boolean
}

/** 도넛 배색. 마지막 회색은 "기타" 몫이라 조각 색과 겹치지 않게 따로 둔다. */
const SLICE_COLORS = ['#2f5adb', '#22c55e', '#a855f7', '#f59e0b', '#38bdf8']
const OTHERS_COLOR = '#cbd5e1'

/** 도넛에 개별 조각으로 남길 상위 국가 수. 나머지는 "기타"로 접는다. */
const TOP_SLICES = SLICE_COLORS.length

/**
 * 조각에 색을 입히고 상위 N개만 남긴다.
 *
 * 실 API는 조달국을 **전부**(14개국) 내려주는데 0.3%짜리 조각까지 그리면 도넛도 범례도
 * 읽히지 않는다. 배색은 백엔드가 정하지 않으므로 여기서 채운다 — mock에 이미 있던
 * "상위 5개 + 기타" 구성과 같은 모양이다.
 */
function toSlices(breakdown: ImportDependencyBreakdownItem[]): ImportDependencyBreakdownItem[] {
  const top = breakdown.slice(0, TOP_SLICES).map((item, index) => ({
    ...item,
    color: item.color ?? SLICE_COLORS[index % SLICE_COLORS.length],
  }))
  const rest = breakdown.slice(TOP_SLICES)
  if (rest.length === 0) {
    return top
  }
  const othersValue = Math.round(rest.reduce((sum, item) => sum + item.value, 0) * 10) / 10
  return [...top, { label: `기타 ${rest.length}개국`, value: othersValue, color: OTHERS_COLOR }]
}

/**
 * 수입 의존도 도넛차트(데모 화면ID UX-01-DB, surin importDependency 이식). DonutChart는
 * 고정 180x180px 컨테이너라 ScrollCard 기본 scrollable(true) 그대로 둬도 되먹임 리사이즈가
 * 재현되지 않는다(사전 실측 확인 완료).
 *
 * **모수가 둘이다** — 조각(`breakdown`)은 수입분 안에서의 구성비라 합이 100%이고,
 * 가운데(`total`)는 전체 발주 중 수입 비중이다. 조각 합과 가운데 숫자가 다른 게 정상이다.
 *
 * 사용 예:
 *   <ImportDependencyPanel data={data} blurred />
 */
export function ImportDependencyPanel({ data, blurred = false }: ImportDependencyPanelProps) {
  const slices = toSlices(data.breakdown)

  return (
    <ScrollCard
      headingId="import-dependency-heading"
      title={data.year ? `수입 의존도 (${data.year})` : '수입 의존도'}
      fillHeight
      /* 본문 overflow를 visible로 둔다(2026-08-07) — 기본 auto면 도넛 hover 툴팁이 카드 밖으로
         나갈 때 잘려 사라진다. 도넛+범례는 항상 카드 안에 들어와 스크롤이 필요 없다. */
      scrollable={false}
    >
      <div className={blurred ? `${styles.body} ${styles.blurred}` : styles.body}>
        <DonutChart
          data={slices.map((item) => ({ ...item, color: item.color ?? OTHERS_COLOR }))}
          centerValue={`${data.total}%`}
          centerLabel="전체 수입 의존도"
          size={280}
        />
        <ul className={styles.legend}>
          {slices.map((item) => (
            <li key={item.label} className={styles.legendItem}>
              <span className={styles.legendLabel}>
                <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className={styles.legendValue}>{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
      {/* 환산 기준을 밝힌다 — 통화가 섞인 발주를 원화로 환산한 값이라, 무엇 기준인지 감추면
          "실제 지출 금액"으로 오독된다. */}
      {data.base_date && !blurred && (
        <p className={styles.footnote}>{data.base_date} 고시환율로 원화 환산</p>
      )}
    </ScrollCard>
  )
}
