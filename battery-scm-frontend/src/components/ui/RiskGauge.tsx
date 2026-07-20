import type { RiskLevel } from "../../types";
import { RISK_LEVELS, riskLevelIndex } from "../../lib/risk";

const DOT_COLORS = ["#94a3b8", "#f59e0b", "#f97316", "#dc2626"];

export function RiskStepGauge({ level }: { level: RiskLevel }) {
  const activeIdx = riskLevelIndex(level);
  return (
    <div className="mt-3">
      <div className="text-[11px] text-slate-400 mb-1.5">4단계 리스크</div>
      <div className="flex items-center">
        {RISK_LEVELS.map((_, idx) => (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <span
              className="h-2.5 w-2.5 rounded-full border-2 shrink-0"
              style={{
                borderColor: idx <= activeIdx ? DOT_COLORS[activeIdx] : "#e2e8f0",
                backgroundColor: idx === activeIdx ? DOT_COLORS[activeIdx] : "#fff",
              }}
            />
            {idx < RISK_LEVELS.length - 1 && (
              <div
                className="h-0.5 flex-1"
                style={{ backgroundColor: idx < activeIdx ? DOT_COLORS[activeIdx] : "#e2e8f0" }}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
        {RISK_LEVELS.map((lvl) => (
          <span key={lvl} className={lvl === level ? "font-semibold text-slate-700" : ""}>
            {lvl}
          </span>
        ))}
      </div>
    </div>
  );
}
