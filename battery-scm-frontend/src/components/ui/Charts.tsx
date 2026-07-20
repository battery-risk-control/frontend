import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative h-[180px] w-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={1}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v}%`} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{centerValue}</span>
          {centerLabel && <span className="text-[11px] text-slate-400">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

const LINE_COLORS: Record<string, string> = {
  리튬: "#2f5adb",
  니켈: "#16a34a",
  흑연: "#a855f7",
};

export function MultiLineChart({
  data,
  lines,
  height = 260,
}: {
  data: Record<string, string | number>[];
  lines: string[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        {lines.map((line) => (
          <Line
            key={line}
            type="monotone"
            dataKey={line}
            stroke={LINE_COLORS[line] ?? "#2f5adb"}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AreaSparkline({ color = "#2f5adb" }: { color?: string }) {
  const points = [4, 6, 5, 8, 7, 9, 8, 10, 9, 11];
  const data = points.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
