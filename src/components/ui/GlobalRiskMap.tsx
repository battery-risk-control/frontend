import { Fragment, useState } from "react";
import { CircleMarker, GeoJSON, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import { divIcon } from "leaflet";
import type { PathOptions } from "leaflet";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countriesTopology from "world-atlas/countries-110m.json";
import "leaflet/dist/leaflet.css";
import { Card } from "./Card";
import { hotspots } from "../../data/mock";

export const HOTSPOT_COLOR: Record<string, string> = {
  정상: "#16a34a",
  주의: "#f59e0b",
  경고: "#ea580c",
  심각: "#dc2626",
};

export const MATERIAL_COLOR: Record<string, string> = {
  리튬: "#2563eb",
  니켈: "#16a34a",
  흑연: "#78716c",
  코발트: "#7c3aed",
};

const BASE_STYLE: PathOptions = { fillColor: "#e2e8f0", fillOpacity: 1, color: "#f8fafc", weight: 0.6 };

const countries = feature(
  countriesTopology as unknown as Topology,
  (countriesTopology as unknown as Topology).objects.countries as GeometryCollection,
);

function labelIcon(text: string, color: string) {
  return divIcon({
    className: "",
    html: `<span style="position:relative;left:14px;top:-9px;display:inline-block;white-space:nowrap;background:#ffffff;border:1px solid ${color}55;color:#1e293b;font-weight:700;font-size:11px;line-height:1;padding:3px 7px;border-radius:6px;box-shadow:0 1px 3px rgba(15,23,42,0.15);">${text}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export function GlobalRiskMap({
  height = 300,
  selectedCountry = null,
  onSelectCountry,
}: {
  height?: number;
  selectedCountry?: string | null;
  onSelectCountry?: (name: string) => void;
}) {
  const [mapView, setMapView] = useState<"material" | "country">("material");

  return (
    <Card
      title="글로벌 리스크 지도"
      icon={<span className="text-slate-300">ⓘ</span>}
      action={
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
          {([
            ["material", "원자재 뷰"],
            ["country", "국가 뷰"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMapView(key)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
                mapView === key ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      <div className="relative overflow-hidden rounded-lg" style={{ height }}>
        <MapContainer
          center={[20, 10]}
          zoom={1.4}
          minZoom={1}
          maxZoom={6}
          scrollWheelZoom={false}
          worldCopyJump
          style={{ height: "100%", width: "100%", background: "#f8fafc" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <GeoJSON data={countries} style={BASE_STYLE} interactive={false} />

          {hotspots.map((h) => {
            const color = mapView === "material" ? MATERIAL_COLOR[h.material] : HOTSPOT_COLOR[h.level];
            const isSelected = h.name === selectedCountry;
            return (
              <Fragment key={h.name}>
                <CircleMarker
                  center={[h.lat, h.lon]}
                  radius={isSelected ? 21 : 17}
                  pathOptions={{ stroke: false, fillColor: color, fillOpacity: isSelected ? 0.32 : 0.22 }}
                  interactive={false}
                />
                <CircleMarker
                  center={[h.lat, h.lon]}
                  radius={isSelected ? 10.5 : 9}
                  pathOptions={{
                    color: isSelected ? "#0f1b3d" : "#ffffff",
                    weight: isSelected ? 3 : 2.5,
                    fillColor: color,
                    fillOpacity: 0.95,
                  }}
                  eventHandlers={{ click: () => onSelectCountry?.(h.name) }}
                >
                  <Tooltip sticky direction="top" opacity={1} className="risk-tooltip">
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#1e293b" }}>{h.name}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 600, margin: "3px 0", color }}>
                        {h.levelDot} 리스크 · {h.material}
                      </div>
                      <div style={{ fontSize: 11, lineHeight: 1.45, color: "#475569" }}>{h.newsSummary}</div>
                      <div style={{ fontSize: 10, marginTop: 4, color: "#94a3b8" }}>클릭하면 관련 뉴스를 볼 수 있어요</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
                <Marker
                  position={[h.lat, h.lon]}
                  icon={labelIcon(h.name, color)}
                  interactive={true}
                  eventHandlers={{ click: () => onSelectCountry?.(h.name) }}
                />
              </Fragment>
            );
          })}
        </MapContainer>

        <div className="absolute bottom-2 left-2 z-[1000] flex items-center gap-3 rounded-md bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
          {mapView === "material" ? (
            <>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: MATERIAL_COLOR.리튬 }} />리튬</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: MATERIAL_COLOR.니켈 }} />니켈</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: MATERIAL_COLOR.흑연 }} />흑연</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: MATERIAL_COLOR.코발트 }} />코발트</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" />매우 높음</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />높음</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />보통</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" />낮음</span>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
