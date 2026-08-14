import type {
  DashboardAlert,
  MaterialPriceSeries,
  MaterialPriceSummary,
  RiskMonitoringEvent,
} from '../api/types'
import { formatCollectedAt } from './formatCollectedAt'

/**
 * 알림을 클릭했을 때 열 화면. 같은 알림 목록을 **로그인 구매팀 대시보드와 비로그인
 * 대시보드가 함께 쓰는데** 각자 갈 곳이 다르다 — 비로그인 화면에서 `/purchasing/*`으로
 * 보내면 로그인 게이트에 막혀 클릭이 죽는다.
 *
 * 두 경로를 각각 받는 이유는 모양이 서로 안 맞아서다. 리스크 모니터링은 양쪽 다 하위
 * 경로(`/purchasing/risk-monitoring`·`/public/risk-monitoring`)지만, 가격 추이는 구매팀은
 * 하위 경로(`/purchasing#...`)이고 비로그인은 루트(`/#...`)라 접두사 하나로 조립할 수 없다.
 */
export interface DashboardAlertTargets {
  /** 뉴스 알림이 여는 리스크 모니터링 화면 */
  riskMonitoringPath: string
  /** 가격 알림이 여는 대시보드 안 가격 추이 섹션(앵커 포함) */
  priceDetailPath: string
}

/** 로그인 구매팀 대시보드(`/purchasing`)용 링크 묶음. */
export const PURCHASING_ALERT_TARGETS: DashboardAlertTargets = {
  riskMonitoringPath: '/purchasing/risk-monitoring',
  priceDetailPath: '/purchasing#material-price-detail-heading',
}

/** 비로그인 대시보드(`/`)용 링크 묶음. */
export const PUBLIC_ALERT_TARGETS: DashboardAlertTargets = {
  riskMonitoringPath: '/public/risk-monitoring',
  priceDetailPath: '/#material-price-detail-heading',
}

/**
 * 대시보드 우측 "주요 알림" 목록을 만든다. 구매팀(로그인)과 비로그인 대시보드가 같은 규칙을
 * 쓰고 링크 목적지만 `targets`로 갈린다 — 판정 기준이 화면마다 갈리면 같은 사건이 한쪽에서만
 * 심각으로 뜬다.
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
 *   const alerts = buildDashboardAlerts(events, priceSeries, priceSummaries, PURCHASING_ALERT_TARGETS)
 */
export function buildDashboardAlerts(
  events: RiskMonitoringEvent[],
  priceSeries: MaterialPriceSeries[],
  priceSummaries: MaterialPriceSummary[],
  targets: DashboardAlertTargets,
): DashboardAlert[] {
  return [...toNewsAlerts(events, targets), ...toPriceAlerts(priceSeries, priceSummaries, targets)]
}

/**
 * 판정이 끝난 뉴스를 수집 시각 최신순으로 올린다.
 *
 * **등급이 아니라 "판정이 끝났는가"로 거른다.** 예전에는 심각·주의만 올렸는데, 멀티에이전트와
 * 브리핑까지 다 돌고 결과가 정상으로 나온 뉴스가 통째로 사라졌다 — 담당자 입장에서 그건
 * "확인해보니 괜찮았다"는 결과이고, 알림에 안 뜨면 확인이 끝났는지 아닌지를 알 수 없다.
 * 정상은 `정보`로 내려 등급 셋을 그대로 구분해 보여준다.
 *
 * 판정 완료의 기준은 다른 화면과 같다 — 확정 + 브리핑 존재. `confidence_label`만 보지 않고
 * `briefing_id`까지 확인하는 이유는 둘이 어긋나면 그게 버그이고, 알림에서만 조용히
 * 통과시키면 그 버그가 안 보이기 때문이다.
 */
function toNewsAlerts(
  events: RiskMonitoringEvent[],
  targets: DashboardAlertTargets,
): DashboardAlert[] {
  return events
    .filter(
      (event) =>
        event.confidence_label === '확정' &&
        event.multi_agent_completed &&
        event.briefing_id != null,
    )
    .sort((a, b) => b.collected_at.localeCompare(a.collected_at))
    .map((event) => ({
      id: `news-${event.event_id}`,
      level: event.grade === '심각' ? '심각' : event.grade === '주의' ? '주의' : '정보',
      timeLabel: toTimeLabel(event.collected_at),
      title: event.headline,
      // 목록 API에는 기사 요약이 없다(상세 조회에만 있다). 자재·국가만으로도 "무엇이 왜 떴는지"는
      // 전달되고, 자재 수만큼 상세를 부르면 대시보드 진입이 그만큼 느려진다.
      detail: [event.material, event.country_name ?? event.country_code].filter(Boolean).join(' · '),
      href: `${targets.riskMonitoringPath}?eventId=${event.event_id}`,
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
  targets: DashboardAlertTargets,
): DashboardAlert[] {
  return summaries
    .filter((summary) => summary.grade === '심각' || summary.grade === '주의')
    .sort((a, b) => b.risk_score - a.risk_score)
    .map((summary) => {
      const matched = series.find((item) => item.material === summary.material)
      const latest = matched?.points.at(-1)
      // 두 값은 **다른 것**이라 따로 보여준다.
      //   거래일  — 이 가격이 형성된 날. 일봉이라 날짜까지만 있다.
      //   갱신    — 그 행을 마지막으로 적재한 시각.
      // 주말·휴장이면 둘이 며칠 벌어진다(실측: 거래일 07-31, 갱신 08-03). 하나로 합치면
      // "3일 전 가격인데 방금 갱신됨"이라는 사실이 사라진다. 거래일에 00:00을 붙여 시각을
      // 지어내지도 않는다 — 그 시각에 무슨 일이 있었던 것처럼 읽힌다.
      const tradingDay = latest ? latest.date.slice(5) : null
      const refreshedAt = latest?.updated_at ? toTimeLabel(latest.updated_at) : null
      return {
        id: `price-${summary.material}`,
        level: '정보' as const,
        // 좁은 사이드패널의 머리줄에는 "언제 들어온 값인가"만 둔다. 거래일은 아래 보조 줄로
        // 내린다 — 둘을 머리줄에 같이 넣으면 등급 배지와 한 줄에서 밀린다.
        timeLabel: refreshedAt ? `갱신 ${refreshedAt}` : tradingDay ?? '—',
        title: `${summary.material} 가격 변동성 주의`,
        detail: [
          tradingDay ? `거래일 ${tradingDay}` : null,
          `구간 등락 ${summary.change_label}`,
          `연율화 변동성 ${summary.risk_score}%`,
        ]
          .filter(Boolean)
          .join(' · '),
        // 가격 추이 섹션 앵커(#...) 앞에 `?material=자재`를 끼워 넣어, 클릭하면 그 자재만
        // 단일 선으로 좁혀 보이게 한다. priceDetailPath는 이미 해시를 품고 있어 분리해 재조립한다.
        href: withMaterialQuery(targets.priceDetailPath, summary.material),
      }
    })
}

/**
 * `priceDetailPath`(해시 앵커 포함)에 `?material=자재` 쿼리를 끼워 넣는다. 페이지가 이 쿼리를 읽어
 * 가격 추이 그래프를 그 자재 단일 선으로 좁힌다. 해시는 스크롤 대상 앵커라 쿼리 뒤에 그대로 붙인다.
 *   `/#material-price-detail-heading` → `/?material=흑연#material-price-detail-heading`
 */
function withMaterialQuery(priceDetailPath: string, material: string): string {
  const [path, hash] = priceDetailPath.split('#')
  const query = `?material=${encodeURIComponent(material)}`
  return `${path}${query}${hash ? `#${hash}` : ''}`
}

/**
 * 수집 시각을 `08-03 00:51`(현지, 24시간)로 만든다.
 *
 * 구현은 `lib/formatCollectedAt`에 있다 — 뉴스 상세 패널도 같은 표기를 써야 하는데 거기에
 * 따로 만든 `toLocaleString` 버전이 12시간제로 나오고 있었다(2026-08-03).
 */
const toTimeLabel = formatCollectedAt
