import { Fragment, useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import { divIcon, type PathOptions } from 'leaflet'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import countriesTopology from 'world-atlas/countries-110m.json'
import 'leaflet/dist/leaflet.css'
import { ScrollCard } from '../ui/ScrollCard/ScrollCard'
import { RiskGradeBadge } from '../ui/RiskGradeBadge'
import { ConfidenceBadge } from '../ui/ConfidenceBadge'
import type { GlobalRiskBoardItem, RiskGrade } from '../../api/types'
import styles from './GlobalRiskBoard.module.css'

interface GlobalRiskBoardProps {
  items: GlobalRiskBoardItem[]
  /**
   * 마커를 클릭했을 때 상위 화면에 알린다(선택). 구매팀 대시보드가 우측 "뉴스 상세" 탭을
   * 그 이벤트로 바꾸는 데 쓴다.
   *
   * **넘기면 카드 안쪽 상세 패널을 자동으로 펼치지 않는다.** 상위가 이미 다른 자리에
   * 상세를 띄우고 있는데 카드 안에서도 같은 내용이 펼쳐지면 같은 정보가 두 군데 뜬다.
   * 안 넘기면(비로그인 공개 대시보드) 기존처럼 카드 안 패널이 펼쳐진다 — 그쪽엔 받아줄
   * 우측 패널이 없다.
   */
  onSelectItem?: (item: GlobalRiskBoardItem) => void
  /** 지도 높이(px). 생략 시 CSS 기본값 유지 — 공유 컴포넌트라 CSS 기본값을 직접 바꾸지 않고
   * 화면별로 prop으로 override한다(3계층 경영진 대시보드가 확대해 쓴다). */
  mapHeight?: number
  /** 마커/국가 클릭 시 선택 묶음(SelectedDetail)째로 알림(3계층 대시보드). 전달되면 카드 안쪽
   * "마커 클릭 시 정보 표시" 패널을 아예 렌더링하지 않고 클릭 결과를 이 콜백으로만 전달한다 —
   * 표시는 호출부 몫이다. onSelectItem(대표 이벤트 1건 전달, 패널은 접힌 채 유지)과는 전달
   * 단위와 패널 처리 방식이 달라 별도 prop으로 둔다. */
  onSelect?: (detail: SelectedDetail | null) => void
}

type ViewMode = 'event' | 'country'

interface LocatedItem extends GlobalRiskBoardItem {
  country_code: string
  coordinates: { lat: number; lng: number }
}

interface CountryGroup {
  countryCode: string
  countryName: string
  coordinates: { lat: number; lng: number }
  events: LocatedItem[]
  representative: LocatedItem
}

export interface SelectedDetail {
  label: string
  events: GlobalRiskBoardItem[]
}

interface EventMarkerPosition {
  lat: number
  lng: number
  labelDirection: 'top' | 'bottom'
}

const GRADE_SEVERITY: Record<RiskGrade, number> = {
  심각: 3,
  주의: 2,
  정상: 1,
}

const GRADE_LEGEND_ORDER: RiskGrade[] = ['정상', '주의', '심각']

// Leaflet의 SVG 렌더러는 path 색상을 style이 아닌 presentation attribute로 설정해
// CSS 커스텀 프로퍼티(var(--color-risk-*))를 해석하지 못한다 — tokens.css의 값과
// 동일한 리터럴 hex를 그대로 미러링한다(디자인 토큰 값이 바뀌면 여기도 함께 갱신).
const GRADE_COLOR: Record<RiskGrade, string> = {
  심각: '#D93A3F',
  주의: '#F0933F',
  정상: '#2AAE8A',
}

const BASE_STYLE: PathOptions = { fillColor: '#E2E4E8', fillOpacity: 1, color: '#FFFFFF', weight: 0.6 }

const countries = feature(
  countriesTopology as unknown as Topology,
  (countriesTopology as unknown as Topology).objects.countries as GeometryCollection,
)

function isLocated(item: GlobalRiskBoardItem): item is LocatedItem {
  return Boolean(item.country_code && item.coordinates)
}

/** `divIcon`은 HTML 문자열을 그대로 삽입하므로, 백엔드에서 온 국가명·자재명을 그대로 넣지 않는다. */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

interface MarkerTooltipProps {
  title: string
  material: string
  grade: RiskGrade
  confidenceLabel: GlobalRiskBoardItem['confidence_label']
  summary: string
  /** 국가뷰에서 대표 이벤트 말고 더 있는 건수. 0이면 표시하지 않는다. */
  extraCount?: number
  /** 클릭 결과가 어디에 뜨는지. 화면마다 달라서 안내 문구를 바꾼다. */
  detailPlacement: 'aside' | 'card'
}

/**
 * 마커에 마우스를 올렸을 때 뜨는 상세 — 국가·자재·등급·신뢰도와 **뉴스 요약**.
 *
 * 요약(`event_summary`)이 핵심이다. 예전에는 hover에서 `confidence_label` 하나만 더 보여줬는데,
 * 마커가 무슨 사건인지는 클릭해야만 알 수 있었다. 번역본이 있으면 백엔드가 이미 한국어로
 * 내려주므로(`raw_events.title_ko` 조인) 화면에서 손대지 않는다.
 */
function MarkerTooltip({
  title,
  material,
  grade,
  confidenceLabel,
  summary,
  extraCount = 0,
  detailPlacement,
}: MarkerTooltipProps) {
  return (
    <div className={styles.tooltipBody}>
      <div className={styles.tooltipTitle}>{title}</div>
      <div className={styles.tooltipBadges}>
        <RiskGradeBadge grade={grade} />
        <ConfidenceBadge label={confidenceLabel} />
        <span className={styles.tooltipMaterial}>{material}</span>
      </div>
      <p className={styles.tooltipSummary}>{summary}</p>
      {extraCount > 0 && <p className={styles.tooltipExtra}>이 국가에 {extraCount}건 더 있습니다</p>}
      <p className={styles.tooltipHint}>
        {detailPlacement === 'aside'
          ? '클릭하면 오른쪽 "뉴스 상세"에서 볼 수 있어요'
          : '클릭하면 아래에서 관련 뉴스를 볼 수 있어요'}
      </p>
    </div>
  )
}

/**
 * 마커 옆에 상시 표시되는 이름표.
 *
 * **`<Tooltip permanent>`가 아니라 별도 `<Marker>` 레이어로 만든다.** Leaflet은 레이어 하나에
 * Tooltip을 하나만 바인딩해서(마지막 호출이 앞의 것을 덮어씀), 상시 라벨을 Tooltip으로 쓰면
 * 그 마커에 hover용 Tooltip을 더 붙일 수 없다. 라벨을 이 레이어로 빼면 CircleMarker의 Tooltip
 * 자리가 비어 hover 상세(뉴스 요약)를 붙일 수 있다 — surin `GlobalRiskMap`이 쓰는 구성이다.
 */
function labelIcon(text: string, color: string) {
  return divIcon({
    className: '',
    html:
      `<span style="position:relative;left:12px;top:-8px;display:inline-block;white-space:nowrap;` +
      `background:#ffffff;border:1px solid ${color}55;color:#1A1A1A;font-weight:700;font-size:11px;` +
      `line-height:1;padding:3px 7px;border-radius:6px;box-shadow:0 1px 3px rgba(15,23,42,0.15);">` +
      `${escapeHtml(text)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  })
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// mock 데이터의 좌표는 국가 단위 근사치라, 같은 나라에 이벤트가 2건 이상이면(예: 콩고민주공화국
// 코발트 2건) 이벤트뷰 마커가 완전히 겹친다. 완전 자동 배치 알고리즘 대신 같은 국가 그룹 안에서만
// 마커를 원형으로 살짝 벌리고, 라벨도 상/하로 번갈아 배치해 최소한의 겹침만 방지한다.
function computeEventMarkerPositions(items: LocatedItem[]): Map<string, EventMarkerPosition> {
  const byCountry = new Map<string, LocatedItem[]>()
  for (const item of items) {
    const group = byCountry.get(item.country_code) ?? []
    group.push(item)
    byCountry.set(item.country_code, group)
  }
  const positions = new Map<string, EventMarkerPosition>()
  for (const group of byCountry.values()) {
    const spread = group.length > 1 ? 1.4 : 0
    group.forEach((item, index) => {
      const angle = (index / group.length) * 2 * Math.PI
      positions.set(item.risk_event_id, {
        lat: item.coordinates.lat + Math.sin(angle) * spread,
        lng: item.coordinates.lng + Math.cos(angle) * spread,
        labelDirection: index % 2 === 0 ? 'top' : 'bottom',
      })
    })
  }
  return positions
}

function groupByCountry(items: LocatedItem[]): CountryGroup[] {
  const byCountry = new Map<string, LocatedItem[]>()
  for (const item of items) {
    const group = byCountry.get(item.country_code) ?? []
    group.push(item)
    byCountry.set(item.country_code, group)
  }
  return Array.from(byCountry.entries()).map(([countryCode, events]) => {
    const representative = [...events].sort(
      (a, b) => GRADE_SEVERITY[b.grade] - GRADE_SEVERITY[a.grade],
    )[0]
    return {
      countryCode,
      countryName: representative.country_name ?? countryCode,
      coordinates: representative.coordinates,
      events,
      representative,
    }
  })
}

/**
 * 글로벌 리스크 관제 맵. react-leaflet + world-atlas(GeoJSON 국경) + topojson-client로
 * 실제 인터랙티브 세계지도를 렌더링한다. "이벤트뷰"는 country_code가 있는 이벤트마다
 * 개별 좌표(coordinates)로 마커 1개, "국가뷰"는 country_code 기준으로 묶어 국가당
 * 마커 1개(대표 이벤트 = grade 최고 심각도, 동률이면 배열상 먼저 나오는 이벤트 —
 * AiPriorityList의 GRADE_SEVERITY와 동일 기준)를 표시한다. country_code가 없는
 * 이벤트는 두 뷰 모두 지도에서 제외한다. 마커 클릭 시 컴포넌트 내부 상태로 선택
 * 국가/이벤트를 관리하고, 하단 패널에 관련 risk_event 리스트를 보여준다. 마커 라벨(국가명,
 * 이벤트뷰는 자재명 병기)은 hover 없이 상시 표시되며(Leaflet `<Tooltip permanent>`), 지도
 * 우측 상단에는 RiskGradeBadge와 동일한 색상의 등급 범례를 고정 표시한다. 지도(+범례)는
 * ScrollCard의 pinnedTop(스크롤 밖 고정)에, 뷰토글은 actions에, 클릭 시 나타나는 상세
 * 리스트만 children(스크롤 영역)에 둔다 — 지도가 항상 보이는 상태를 유지하기 위함이다.
 *
 * 마커 hover 시 클릭 전까지 어디에도 안 보이던 `confidence_label`을 라벨 안에 추가로
 * 표시한다(2026-07-27). 마커 색상(등급)과 상시 라벨(국가명·자재명 등)은 이미 hover 없이도
 * 보이므로 새 정보가 아니라 굳이 반복하지 않는다 — 클릭 패널과의 중복을 피하고 신뢰도
 * 라벨만 추가한 최소 구성(개발자 확정). Leaflet은 레이어 하나에 Tooltip을 하나만 바인딩할
 * 수 있어(위 국가뷰 주석 참고) 별도 hover 전용 Tooltip을 새로 붙이지 못하고, 기존 permanent
 * Tooltip 안에 `hoveredKey` state(CircleMarker의 `eventHandlers.mouseover`/`mouseout`로
 * 갱신)로 조건부 렌더링하는 방식을 쓴다 — `useHoverDisclosure`(PageSectionDots)나 좌표→픽셀
 * 변환 기반 커스텀 오버레이는 필요 없다고 판단했다(이유: 노출 정보가 confidence_label
 * 하나뿐이고 비대화형이라 WCAG 1.4.13 hoverable/dismissible 요구가 상대적으로 약함,
 * `docs/roadmap-candidates.md` 참고).
 *
 * 사용 예:
 *   <GlobalRiskBoard items={items} />
 */
export function GlobalRiskBoard({ items, onSelectItem, mapHeight, onSelect }: GlobalRiskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('event')
  const [selected, setSelected] = useState<SelectedDetail | null>(null)
  const [panelExpanded, setPanelExpanded] = useState(false)
  const locatedItems = items.filter(isLocated)
  const countryGroups = groupByCountry(locatedItems)
  const eventMarkerPositions = computeEventMarkerPositions(locatedItems)

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode)
    setSelected(null)
  }

  function handleSelectEvent(item: LocatedItem) {
    const detail: SelectedDetail = { label: item.material, events: [item] }
    setSelected(detail)
    // 상위가 상세를 받아가면 카드 안쪽까지 펼치지 않는다(같은 내용이 두 군데 뜬다).
    setPanelExpanded(!onSelectItem && !onSelect)
    onSelectItem?.(item)
    onSelect?.(detail)
  }

  function handleSelectCountry(group: CountryGroup) {
    const detail: SelectedDetail = { label: group.countryName, events: group.events }
    setSelected(detail)
    setPanelExpanded(!onSelectItem && !onSelect)
    // 국가뷰 마커는 여러 이벤트를 대표하므로, 색·라벨에 이미 쓰고 있는 대표 이벤트를
    // 그대로 넘긴다 — 여기서 새로운 대표 선정 규칙을 만들지 않는다.
    onSelectItem?.(group.representative)
    onSelect?.(detail)
  }

  return (
    <ScrollCard
      headingId="global-risk-board-heading"
      title="글로벌 리스크 관제 맵"
      actions={
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={viewMode === 'event' ? styles.viewToggleButtonActive : styles.viewToggleButton}
            onClick={() => handleViewModeChange('event')}
          >
            이벤트뷰
          </button>
          <button
            type="button"
            className={viewMode === 'country' ? styles.viewToggleButtonActive : styles.viewToggleButton}
            onClick={() => handleViewModeChange('country')}
          >
            국가뷰
          </button>
        </div>
      }
      pinnedTop={
        <div className={styles.mapWrapper} style={mapHeight !== undefined ? { height: mapHeight } : undefined}>
          <MapContainer
            center={[20, 10]}
            zoom={1.4}
            minZoom={1}
            maxZoom={6}
            scrollWheelZoom={true}
            worldCopyJump
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <GeoJSON data={countries} style={BASE_STYLE} interactive={false} />

            {/* 마커 한 개는 레이어 두 벌로 만든다 — 원(CircleMarker)과 이름표(Marker+divIcon).
                Leaflet이 레이어당 Tooltip을 하나만 바인딩해서, 이름표를 `<Tooltip permanent>`로
                두면 그 마커에 hover 상세를 더 붙일 수 없기 때문이다(bindTooltip이 마지막 호출만
                유지). 이름표를 따로 빼 두면 원의 Tooltip 자리가 비어 hover 상세를 붙일 수 있다.
                이름표에도 같은 click 핸들러를 걸어 어느 쪽을 눌러도 같게 동작하게 한다. */}
            {viewMode === 'event'
              ? locatedItems.map((item) => {
                  const position = eventMarkerPositions.get(item.risk_event_id)!
                  const label = `${item.country_name ?? item.country_code} · ${item.material}`
                  return (
                    <Fragment key={item.risk_event_id}>
                      <CircleMarker
                        center={[position.lat, position.lng]}
                        radius={9}
                        pathOptions={{
                          color: '#FFFFFF',
                          weight: 2,
                          fillColor: GRADE_COLOR[item.grade],
                          fillOpacity: 0.9,
                        }}
                        eventHandlers={{ click: () => handleSelectEvent(item) }}
                      >
                        {/* sticky: 커서를 따라와 마커가 작아도 툴팁이 손에서 벗어나지 않는다. */}
                        <Tooltip sticky direction="top" opacity={1} className={styles.markerTooltip}>
                          <MarkerTooltip
                            title={item.country_name ?? item.country_code}
                            material={item.material}
                            grade={item.grade}
                            confidenceLabel={item.confidence_label}
                            summary={item.event_summary}
                            detailPlacement={onSelectItem ? 'aside' : 'card'}
                          />
                        </Tooltip>
                      </CircleMarker>
                      <Marker
                        position={[position.lat, position.lng]}
                        icon={labelIcon(label, GRADE_COLOR[item.grade])}
                        eventHandlers={{ click: () => handleSelectEvent(item) }}
                      />
                    </Fragment>
                  )
                })
              : countryGroups.map((group) => {
                  const label =
                    group.events.length > 1
                      ? `${group.countryName} ×${group.events.length}`
                      : group.countryName
                  return (
                    <Fragment key={group.countryCode}>
                      <CircleMarker
                        center={[group.coordinates.lat, group.coordinates.lng]}
                        radius={10}
                        pathOptions={{
                          color: '#FFFFFF',
                          weight: 2,
                          fillColor: GRADE_COLOR[group.representative.grade],
                          fillOpacity: 0.9,
                        }}
                        eventHandlers={{ click: () => handleSelectCountry(group) }}
                      >
                        {/* 여러 risk_event를 대표하는 마커라, 색·라벨에 이미 쓰는 대표값
                            (representative)을 툴팁에도 그대로 쓴다 — 새로운 집계 규칙을 만들지 않는다. */}
                        <Tooltip sticky direction="top" opacity={1} className={styles.markerTooltip}>
                          <MarkerTooltip
                            title={group.countryName}
                            material={group.representative.material}
                            grade={group.representative.grade}
                            confidenceLabel={group.representative.confidence_label}
                            summary={group.representative.event_summary}
                            extraCount={group.events.length - 1}
                            detailPlacement={onSelectItem ? 'aside' : 'card'}
                          />
                        </Tooltip>
                      </CircleMarker>
                      <Marker
                        position={[group.coordinates.lat, group.coordinates.lng]}
                        icon={labelIcon(label, GRADE_COLOR[group.representative.grade])}
                        eventHandlers={{ click: () => handleSelectCountry(group) }}
                      />
                    </Fragment>
                  )
                })}
          </MapContainer>

          <div className={styles.legend}>
            <span className={styles.legendTitle}>등급</span>
            {GRADE_LEGEND_ORDER.map((grade) => (
              <RiskGradeBadge key={grade} grade={grade} />
            ))}
          </div>
        </div>
      }
    >
      {/* onSelect가 있으면(3계층) 표시는 호출부 몫이라 카드 안쪽 패널 자체를 렌더링하지 않는다. */}
      {!onSelect && (
        <>
          <div className={styles.panelHeader}>
            <p className={styles.placeholder}>지도에서 마커를 클릭하면 관련 리스크 정보가 여기에 표시됩니다.</p>
            <button
              type="button"
              className={styles.panelToggleButton}
              onClick={() => setPanelExpanded((prev) => !prev)}
              aria-expanded={panelExpanded}
              aria-label={panelExpanded ? '리스크 정보 패널 접기' : '리스크 정보 패널 펼치기'}
            >
              <ChevronIcon expanded={panelExpanded} />
            </button>
          </div>
          <div className={panelExpanded ? `${styles.panelBody} ${styles.panelBodyExpanded}` : styles.panelBody}>
            <div className={styles.panelBodyInner}>
              {selected && (
                <>
                  <div className={styles.detailHeader}>
                    <span className={styles.detailLabel}>{selected.label}</span>
                    <button type="button" className={styles.closeButton} onClick={() => setSelected(null)}>
                      닫기
                    </button>
                  </div>
                  <ul className={styles.list}>
                    {selected.events.map((item) => (
                      <li key={item.risk_event_id} className={styles.item}>
                        <div className={styles.itemHeader}>
                          <span className={styles.material}>{item.material}</span>
                          <RiskGradeBadge grade={item.grade} />
                          <ConfidenceBadge label={item.confidence_label} />
                        </div>
                        <p className={styles.summary}>{item.event_summary}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </ScrollCard>
  )
}
