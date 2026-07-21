import type { AlertLevel, RiskLevel } from "../types";

export const RISK_LEVELS: RiskLevel[] = ["정상", "주의", "경고", "심각"];

export const RISK_STYLES: Record<RiskLevel, { text: string; bg: string; dot: string }> = {
  정상: { text: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  주의: { text: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500" },
  경고: { text: "text-orange-700", bg: "bg-orange-100", dot: "bg-orange-500" },
  심각: { text: "text-red-700", bg: "bg-red-100", dot: "bg-red-500" },
};

export const ALERT_STYLES: Record<AlertLevel, { text: string; bg: string }> = {
  심각: { text: "text-red-600", bg: "bg-red-50" },
  경고: { text: "text-orange-600", bg: "bg-orange-50" },
  주의: { text: "text-amber-600", bg: "bg-amber-50" },
  정보: { text: "text-blue-600", bg: "bg-blue-50" },
};

export function riskLevelIndex(level: RiskLevel): number {
  return RISK_LEVELS.indexOf(level);
}

export function scoreToColor(score: number): string {
  if (score >= 75) return "#dc2626";
  if (score >= 60) return "#ea580c";
  if (score >= 40) return "#d97706";
  return "#16a34a";
}
