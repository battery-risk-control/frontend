import type { AlertLevel, RiskLevel } from "../../types";
import { ALERT_STYLES, RISK_STYLES } from "../../lib/risk";

export function RiskBadge({ level, size = "md" }: { level: RiskLevel; size?: "sm" | "md" }) {
  const s = RISK_STYLES[level];
  const sizeCls = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center rounded-md font-semibold ${s.bg} ${s.text} ${sizeCls}`}>
      {level}
    </span>
  );
}

export function AlertLevelBadge({ level }: { level: AlertLevel }) {
  const s = ALERT_STYLES[level];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {level}
    </span>
  );
}

export function Tag({ children, tone = "slate" }: { children: string; tone?: "slate" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function LevelPill({ label }: { label: "낮음" | "보통" | "높음" | "매우 높음" }) {
  const map: Record<string, string> = {
    낮음: "bg-sky-400",
    보통: "bg-amber-400",
    높음: "bg-orange-500",
    "매우 높음": "bg-red-600",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className={`h-2 w-2 rounded-full ${map[label]}`} />
      {label}
    </span>
  );
}
