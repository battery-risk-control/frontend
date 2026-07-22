import { useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip } from 'react-leaflet'
import type { PathOptions } from 'leaflet'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import countriesTopology from 'world-atlas/countries-110m.json'
import 'leaflet/dist/leaflet.css'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import type { GlobalRiskBoardItem, RiskGrade } from '../../../api/types'
import styles from './GlobalRiskBoard.module.css'

interface GlobalRiskBoardProps {
  items: GlobalRiskBoardItem[]
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

interface SelectedDetail {
  label: string
  events: GlobalRiskBoardItem[]
}

const GRADE_SEVERITY: Record<RiskGrade, number> = {
  심각: 3,
  주의: 2,
  정상: 1,
}

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
 * 국가/이벤트를 관리하고, 하단 패널에 관련 risk_event 리스트를 보여준다.
 *
 * 사용 예:
 *   <GlobalRiskBoard items={items} />
 */
export function GlobalRiskBoard({ items }: GlobalRiskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('event')
  const [selected, setSelected] = useState<SelectedDetail | null>(null)

  const locatedItems = items.filter(isLocated)
  const countryGroups = groupByCountry(locatedItems)

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode)
    setSelected(null)
  }

  function handleSelectEvent(item: LocatedItem) {
    setSelected({ label: item.material, events: [item] })
  }

  function handleSelectCountry(group: CountryGroup) {
    setSelected({ label: group.countryName, events: group.events })
  }

  return (
    <section className={styles.panel} aria-labelledby="global-risk-board-heading">
      <div className={styles.headerRow}>
        <h2 id="global-risk-board-heading" className={styles.title}>
          글로벌 리스크 관제 맵
        </h2>
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
      </div>

      <div className={styles.mapWrapper}>
        <MapContainer
          center={[20, 10]}
          zoom={1.4}
          minZoom={1}
          maxZoom={6}
          scrollWheelZoom={false}
          worldCopyJump
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON data={countries} style={BASE_STYLE} interactive={false} />

          {viewMode === 'event'
            ? locatedItems.map((item) => (
                <CircleMarker
                  key={item.risk_event_id}
                  center={[item.coordinates.lat, item.coordinates.lng]}
                  radius={9}
                  pathOptions={{
                    color: '#FFFFFF',
                    weight: 2,
                    fillColor: GRADE_COLOR[item.grade],
                    fillOpacity: 0.9,
                  }}
                  eventHandlers={{ click: () => handleSelectEvent(item) }}
                >
                  <Tooltip direction="top" opacity={1}>
                    {item.material} · {item.grade}
                  </Tooltip>
                </CircleMarker>
              ))
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
                  eventHandlers={{ click: () => handleSelectCountry(group) }}
                >
                  <Tooltip direction="top" opacity={1}>
                    {group.countryName} · {group.representative.grade}
                  </Tooltip>
                  {group.events.length > 1 && (
                    <Tooltip permanent direction="right" offset={[8, 0]} className={styles.countBadge}>
                      ×{group.events.length}
                    </Tooltip>
                  )}
                </CircleMarker>
              ))}
        </MapContainer>
      </div>

      <div className={styles.detailPanel}>
        {selected ? (
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
        ) : (
          <p className={styles.placeholder}>지도에서 마커를 클릭하면 관련 리스크 정보가 여기에 표시됩니다.</p>
        )}
      </div>
    </section>
  )
}
