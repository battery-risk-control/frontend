import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import landTopology from "world-atlas/land-110m.json";

const WIDTH = 1000;
const HEIGHT = 500;

const land = feature(
  landTopology as unknown as Topology,
  (landTopology as unknown as Topology).objects.land as GeometryCollection,
);

const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], land);
const landPath = geoPath(projection)(land) ?? "";

export function WorldMapBackground() {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <path d={landPath} fill="#e2e8f0" />
    </svg>
  );
}

export function projectToPercent(lat: number, lon: number): { top: string; left: string } {
  const point = projection([lon, lat]);
  if (!point) return { top: "50%", left: "50%" };
  const [x, y] = point;
  return { top: `${(y / HEIGHT) * 100}%`, left: `${(x / WIDTH) * 100}%` };
}
