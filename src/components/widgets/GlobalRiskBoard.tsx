import { useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import type { PathOptions } from 'leaflet'
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
  /** 지도 높이(px). 생략 시 CSS 기본값(220px) 유지 — 공개 대시보드(2x2 그리드)는 이 prop을
   * 안 주고, 구매팀 대시보드(2차 데모)만 1.5배(330px)로 확대해 쓴다. 두 화면이 이 컴포넌트를
   * 공유하므로 CSS 기본값을 직접 바꾸지 않고 prop으로 화면별 override한다. */
  mapHeight?: number
  /** 마커/국가 클릭 시 알림(2차 데모, 수정 A). 전달되면 이 컴포넌트가 내부에 렌더링하던
   * "마커 클릭 시 정보 표시" 패널(.panelHeader/.panelBody)을 완전히 생략하고, 대신 클릭
   * 결과를 이 콜백으로만 전달한다 — 구매팀 대시보드는 AlertsPanel의 "마커뉴스"
   * 서브섹션에서 표시한다. 생략하면(공개 대시보드) 기존과 동일하게 이 컴포넌트가 직접
   * 표시한다 — mapHeight와 동일한 원칙(공유 컴포넌트라 CSS/구조 기본값을 직접 바꾸지
   * 않고 prop으로 화면별 override). 닫기 클릭 시 `null`로 호출된다. */
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
 * `onSelect` prop이 전달되면(2차 데모, 구매팀 대시보드) 이 children 상세 리스트 자체를
 * 렌더링하지 않고 클릭 결과를 콜백으로만 전달한다 — 표시는 호출부(AlertsPanel "마커뉴스")
 * 몫이다. prop 미전달(공개 대시보드)이면 기존과 동일하게 이 컴포넌트가 직접 표시한다.
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
export function GlobalRiskBoard({ items, mapHeight, onSelect }: GlobalRiskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('event')
  const [selected, setSelected] = useState<SelectedDetail | null>(null)
  const [panelExpanded, setPanelExpanded] = useState(false)
  // hover 시 confidence_label 노출용. Leaflet은 레이어 하나당 Tooltip을 하나만 바인딩할 수
  // 있어(위 국가뷰 라벨+건수 병합 주석 참고, bindTooltip이 마지막 호출만 유지) 기존 상시
  // 라벨용 Tooltip과 별개로 두 번째 Tooltip을 마커에 추가할 수 없다. 대신 기존 permanent
  // Tooltip 하나를 그대로 유지하면서, 그 안에 hover 중인 마커일 때만 ConfidenceBadge를 추가로
  // 렌더링하는 방식으로 우회한다 — 그래서 hover 감지 자체는 CircleMarker의
  // eventHandlers(mouseover/mouseout)로 이 state를 갱신하는 최소한의 커스텀 로직이 필요하다
  // (완전히 Leaflet 자동 처리에만 맡기는 방식은 이 제약 때문에 불가능).
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

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
    setPanelExpanded(true)
    onSelect?.(detail)
  }

  function handleSelectCountry(group: CountryGroup) {
    const detail: SelectedDetail = { label: group.countryName, events: group.events }
    setSelected(detail)
    setPanelExpanded(true)
    onSelect?.(detail)
  }

  function handleCloseSelected() {
    setSelected(null)
    onSelect?.(null)
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

            {viewMode === 'event'
              ? locatedItems.map((item) => {
                  const position = eventMarkerPositions.get(item.risk_event_id)!
                  return (
                    <CircleMarker
                      key={item.risk_event_id}
                      center={[position.lat, position.lng]}
                      radius={9}
                      pathOptions={{
                        color: '#FFFFFF',
                        weight: 2,
                        fillColor: GRADE_COLOR[item.grade],
                        fillOpacity: 0.9,
                      }}
                      eventHandlers={{
                        click: () => handleSelectEvent(item),
                        mouseover: () => setHoveredKey(item.risk_event_id),
                        mouseout: () => setHoveredKey(null),
                      }}
                    >
                      <Tooltip
                        permanent
                        direction={position.labelDirection}
                        offset={[0, position.labelDirection === 'top' ? -6 : 6]}
                        opacity={0.95}
                        className={styles.markerLabel}
                      >
                        {item.country_name ?? item.country_code} · {item.material}
                        {hoveredKey === item.risk_event_id && (
                          <span className={styles.markerLabelConfidence}>
                            <ConfidenceBadge label={item.confidence_label} />
                          </span>
                        )}
                      </Tooltip>
                    </CircleMarker>
                  )
                })
              : countryGroups.map((group) => (
                  <CircleMarker
                    key={group.countryCode}
                    center={[group.coordinates.lat, group.coordinates.lng]}
                    radius={10}
                    pathOptions={{
                      color: '#FFFFFF',
                      weight: 2,
                      fillColor: GRADE_COLOR[group.representative.grade],
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => handleSelectCountry(group),
                      mouseover: () => setHoveredKey(group.countryCode),
                      mouseout: () => setHoveredKey(null),
                    }}
                  >
                    {/* react-leaflet은 레이어 하나에 <Tooltip>을 여러 개 붙이면 bindTooltip이
                        마지막 호출만 유지해 이전 것을 덮어쓴다 — 라벨과 건수를 반드시 하나의
                        Tooltip으로 합쳐야 한다(둘로 나누면 이벤트 2건 이상 국가에서 라벨이 사라짐).
                        hover 시 confidence_label을 추가로 보여줄 때도 같은 이유로 두 번째
                        Tooltip을 새로 붙이지 않고 이 Tooltip 안에 조건부로 끼워넣는다. 여러
                        risk_event를 대표하는 국가뷰 마커라 confidence_label도 이미 색상/등급
                        텍스트에 쓰는 것과 같은 대표값(representative)을 그대로 쓴다 — 새로운
                        집계 규칙을 만들지 않는다. */}
                    <Tooltip permanent direction="top" offset={[0, -6]} opacity={0.95} className={styles.markerLabel}>
                      {group.countryName} · {group.representative.grade}
                      {group.events.length > 1 && ` ×${group.events.length}`}
                      {hoveredKey === group.countryCode && (
                        <span className={styles.markerLabelConfidence}>
                          <ConfidenceBadge label={group.representative.confidence_label} />
                        </span>
                      )}
                    </Tooltip>
                  </CircleMarker>
                ))}
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
                    <button type="button" className={styles.closeButton} onClick={handleCloseSelected}>
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
