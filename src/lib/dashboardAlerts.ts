import type {
  DashboardAlert,
  MaterialPriceSeries,
  MaterialPriceSummary,
  RiskMonitoringEvent,
} from '../api/types'
import { formatCollectedAt } from './formatCollectedAt'

/**
 * 구매팀 대시보드 우측 "주요 알림" 목록을 만든다.
 *
 * `selectAlertEvents`(등급 심각 또는 신뢰도 경고)를 대체한다. 바뀐 점은 두 가지다.
 *
 * 1. **멀티에이전트가 끝난 건만 올린다.** 예전 규칙은 신뢰도가 '경고'이기만 하면 올렸는데,
 *    그건 외부신호 점수만 높고 ERP·계약 검증은 아직 안 거친 상태다. 그 건을 "심각"으로
 *    띄우면 판정이 끝난 것처럼 보인다. 이제 `multi_agent_completed`가 true이고 종합 등급이
 *    심각·주의인 건만 올린다.
 * 2. **가격 변동성을 `정보`로 함께 올린다.** 뉴스가 조용해도 시세가 흔들리면 구매 담당자가
 *    알아야 하는데, 그건 뉴스 파이프라인에 안 잡힌다.
 *
 * 정렬은 **뉴스 최신순 → 그다음 정보**다. 시각으로 한 줄 세우지 않는 이유는 정밀도가 달라서다 —
 * 뉴스는 수집 시각(분 단위)이고 가격은 거래일(일 단위)이라, 섞어 정렬하면 "07-31 00:00"으로
 * 취급된 가격 정보가 그날 뉴스보다 무조건 앞서거나 뒤서게 된다. 없는 정밀도를 지어내느니
 * 두 묶음으로 나눠 세운다(목업의 배치와도 같은 결과다 — 정보가 맨 아래).
 *
 * 사용 예:
 *   const alerts = buildDashboardAlerts(events, priceSeries, priceSummaries)
 */
export function buildDashboardAlerts(
  events: RiskMonitoringEvent[],
  priceSeries: MaterialPriceSeries[],
  priceSummaries: MaterialPriceSummary[],
): DashboardAlert[] {
  return [...toNewsAlerts(events), ...toPriceAlerts(priceSeries, priceSummaries)]
}

/** 멀티에이전트 종합 등급이 심각·주의인 뉴스만, 수집 시각 최신순으로. */
function toNewsAlerts(events: RiskMonitoringEvent[]): DashboardAlert[] {
  return events
    .filter((event) => event.multi_agent_completed && (event.grade === '심각' || event.grade === '주의'))
    .sort((a, b) => b.collected_at.localeCompare(a.collected_at))
    .map((event) => ({
      id: `news-${event.event_id}`,
      level: event.grade as '심각' | '주의',
      timeLabel: toTimeLabel(event.collected_at),
      title: event.headline,
      // 목록 API에는 기사 요약이 없다(상세 조회에만 있다). 자재·국가만으로도 "무엇이 왜 떴는지"는
      // 전달되고, 자재 수만큼 상세를 부르면 대시보드 진입이 그만큼 느려진다.
      detail: [event.material, event.country_name ?? event.country_code].filter(Boolean).join(' · '),
      href: `/purchasing/risk-monitoring?eventId=${event.event_id}`,
    }))
}

/**
 * 변동성이 높다고 백엔드가 판정한 자재를 `정보`로 올린다.
 *
 * 임계값을 화면에서 새로 만들지 않고 `summary.grade`를 그대로 쓴다 — `risk_score`(연율화 변동성 %)를
 * 등급으로 나누는 기준은 백엔드 `MarketPriceService`에 있고(주의 40 / 심각 70), 화면에서 다시
 * 정하면 같은 숫자를 두 곳이 다르게 판정하게 된다.
 *
 * 제목을 "변동성 확대"라고 쓰지 않는다. 확대인지 알려면 직전 구간 변동성과 비교해야 하는데
 * 지금 응답에는 한 구간 값만 있다 — 비교하지 않은 것을 "확대"라고 하면 없는 근거를 만든다.
 */
function toPriceAlerts(
  series: MaterialPriceSeries[],
  summaries: MaterialPriceSummary[],
): DashboardAlert[] {
  return summaries
    .filter((summary) => summary.grade === '심각' || summary.grade === '주의')
    .sort((a, b) => b.risk_score - a.risk_score)
    .map((summary) => {
      const matched = series.find((item) => item.material === summary.material)
      const lastDate = matched?.points.at(-1)?.date
      return {
        id: `price-${summary.material}`,
        level: '정보' as const,
        // 뉴스와 달리 **시각이 없다.** 원천이 일봉이라 거래일까지만 있고, 없는 정밀도를
        // "00:00"으로 채우면 그 시각에 무슨 일이 있었던 것처럼 읽힌다.
        timeLabel: lastDate ? lastDate.slice(5) : '—',
        title: `${summary.material} 가격 변동성 주의`,
        detail: `구간 등락 ${summary.change_label} · 연율화 변동성 ${summary.risk_score}%`,
        href: '/purchasing#material-price-detail-heading',
      }
    })
}

/**
 * 수집 시각을 `08-03 00:51`(현지, 24시간)로 만든다.
 *
 * 구현은 `lib/formatCollectedAt`에 있다 — 뉴스 상세 패널도 같은 표기를 써야 하는데 거기에
 * 따로 만든 `toLocaleString` 버전이 12시간제로 나오고 있었다(2026-08-03).
 */
const toTimeLabel = formatCollectedAt
