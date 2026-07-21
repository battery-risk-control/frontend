import { useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type { Feature, Geometry } from "geojson";
import type { Layer, LeafletMouseEvent, Path, PathOptions } from "leaflet";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countriesTopology from "world-atlas/countries-110m.json";
import "leaflet/dist/leaflet.css";
import { Card } from "./Card";
import { hotspots, type HotspotItem } from "../../data/mock";

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

// world-atlas country name -> our hotspot label
const COUNTRY_TO_HOTSPOT: Record<string, string> = {
  China: "중국",
  Ukraine: "우크라이나",
  Australia: "호주",
  Chile: "칠레",
  "Dem. Rep. Congo": "DRC",
  Germany: "유럽 (EU)",
};

const countries = feature(
  countriesTopology as unknown as Topology,
  (countriesTopology as unknown as Topology).objects.countries as GeometryCollection,
);

export function GlobalRiskMap({ height = 300 }: { height?: number }) {
  const [mapView, setMapView] = useState<"material" | "country">("material");

  const hotspotByLabel = useMemo(() => {
    const map = new Map<string, HotspotItem>();
    hotspots.forEach((h) => map.set(h.name, h));
    return map;
  }, []);

  const resolveHotspot = (f?: Feature<Geometry>) => {
    const name = (f?.properties as { name?: string } | null)?.name;
    const label = name ? COUNTRY_TO_HOTSPOT[name] : undefined;
    return label ? hotspotByLabel.get(label) : undefined;
  };

  const style = (f?: Feature<Geometry>): PathOptions => {
    const hotspot = resolveHotspot(f);
    if (!hotspot) {
      return { fillColor: "#e2e8f0", fillOpacity: 1, color: "#f8fafc", weight: 0.6 };
    }
    const color = mapView === "material" ? MATERIAL_COLOR[hotspot.material] : HOTSPOT_COLOR[hotspot.level];
    return { fillColor: color, fillOpacity: 0.75, color: "#ffffff", weight: 1 };
  };

  const onEachFeature = (f: Feature<Geometry>, layer: Layer) => {
    const hotspot = resolveHotspot(f);
    if (!hotspot) return;
    const color = mapView === "material" ? MATERIAL_COLOR[hotspot.material] : HOTSPOT_COLOR[hotspot.level];
    layer.bindTooltip(
      `<div style="min-width:180px">
         <div style="font-weight:700;font-size:12px;color:#1e293b">${hotspot.name}</div>
         <div style="font-size:10.5px;font-weight:600;margin:3px 0;color:${color}">${hotspot.levelDot} 리스크 · ${hotspot.material}</div>
         <div style="font-size:11px;line-height:1.45;color:#475569">${hotspot.newsSummary}</div>
       </div>`,
      { sticky: true, direction: "top", opacity: 1, className: "risk-tooltip" },
    );
    layer.on({
      mouseover: (e: LeafletMouseEvent) => (e.target as Path).setStyle({ weight: 2, fillOpacity: 0.92 }),
      mouseout: (e: LeafletMouseEvent) => (e.target as Path).setStyle({ weight: 1, fillOpacity: 0.75 }),
    });
  };

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
          <GeoJSON key={mapView} data={countries} style={style} onEachFeature={onEachFeature} />
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
