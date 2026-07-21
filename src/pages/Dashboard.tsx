import { AlertTriangle, Info } from "lucide-react";
import { Card } from "../components/ui/Card";
import { RiskBadge, AlertLevelBadge, Tag } from "../components/ui/Badge";
import { RiskStepGauge } from "../components/ui/RiskGauge";
import { DonutChart, MultiLineChart } from "../components/ui/Charts";
import { GlobalRiskMap } from "../components/ui/GlobalRiskMap";
import {
  dashboardAlerts,
  dataStatus,
  importDependency,
  materialRiskCards,
  priceTrend,
  summaryScores,
  supplierRisks,
} from "../data/mock";

export function Dashboard() {
  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div className="space-y-5">
        <div className="grid grid-cols-5 gap-4">
          {materialRiskCards.map((m) => (
            <Card key={m.name} className="!p-0">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    {m.name} <span className="text-[11px] font-normal text-slate-400">{m.basis}</span>
                  </span>
                  <Tag>{m.tag}</Tag>
                </div>
                <div className="mt-3 flex justify-center">
                  <RiskBadge level={m.level} />
                </div>
                <RiskStepGauge level={m.level} />
              </div>
            </Card>
          ))}
          <ScoreCard
            label={summaryScores.external.label}
            value={summaryScores.external.value}
            level={summaryScores.external.level}
            delta={summaryScores.external.deltaLabel}
          />
          <ScoreCard
            label={summaryScores.erp.label}
            value={summaryScores.erp.value}
            level={summaryScores.erp.level}
            delta={summaryScores.erp.deltaLabel}
          />
        </div>

        <GlobalRiskMap height={460} />

        <div className="grid grid-cols-[340px_1fr] gap-5">
          <Card title="수입 의존도 (2024년 기준)" action={<LinkBtn>상세 보기</LinkBtn>}>
            <div className="flex items-center gap-4">
              <DonutChart
                data={importDependency.breakdown.map((b) => ({ label: b.label, value: b.value, color: b.color }))}
                centerValue={`${importDependency.total}%`}
                centerLabel="전체 수입 의존도"
              />
              <ul className="flex-1 space-y-1.5 text-[12.5px]">
                {importDependency.breakdown.map((b) => (
                  <li key={b.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.label}
                    </span>
                    <span className="font-medium text-slate-700">{b.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card
            title="원자재 가격 추이"
            action={
              <div className="flex gap-1">
                {["3M", "6M", "1Y", "2Y"].map((t) => (
                  <button
                    key={t}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                      t === "1Y" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            }
          >
            <div className="mb-2 flex items-center gap-2">
              {(["리튬(탄산리튬)", "니켈(황산니켈)", "흑연(구형흑연)"] as const).map((label, i) => (
                <button
                  key={label}
                  className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
                    i === 0 ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-slate-800">{priceTrend.current.toLocaleString()}</span>
                <span className="ml-1 text-xs text-slate-400">USD/MT</span>
                <div className="text-[11px] text-red-500">전일 대비 {priceTrend.changeLabel}</div>
              </div>
              <LinkBtn filled>상세 분석</LinkBtn>
            </div>
            <MultiLineChart data={priceTrend.series} lines={["리튬"]} height={200} />
          </Card>
        </div>

        <Card title="주요 공급업체 리스크 현황" action={<LinkBtn>전체 보기</LinkBtn>} padded={false}>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 text-[12px] text-slate-400">
                <th className="px-5 py-2.5 font-medium">공급업체</th>
                <th className="px-3 py-2.5 font-medium">국가</th>
                <th className="px-3 py-2.5 font-medium">원자재</th>
                <th className="px-3 py-2.5 font-medium">공급 비중(%)</th>
                <th className="px-3 py-2.5 font-medium">리스크 등급</th>
                <th className="px-3 py-2.5 font-medium">리스크 점수</th>
                <th className="px-3 py-2.5 font-medium">주요 리스크 요인</th>
              </tr>
            </thead>
            <tbody>
              {supplierRisks.map((s) => (
                <tr key={s.name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-700">{s.name}</td>
                  <td className="px-3 py-3 text-slate-500">
                    {s.flag} {s.country}
                  </td>
                  <td className="px-3 py-3 text-slate-500">{s.material}</td>
                  <td className="px-3 py-3 text-slate-500">{s.supplyRatio}</td>
                  <td className="px-3 py-3">
                    <RiskBadge level={s.level} size="sm" />
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-700">{s.score}</td>
                  <td className="px-3 py-3 text-slate-500">{s.factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="주요 알림" action={<LinkBtn>전체 보기</LinkBtn>}>
          <ul className="space-y-3.5">
            {dashboardAlerts.map((a, i) => (
              <li key={i} className="flex gap-2.5">
                <AlertTriangle
                  size={15}
                  className={`mt-0.5 shrink-0 ${
                    a.level === "심각" ? "text-red-500" : a.level === "경고" ? "text-orange-500" : a.level === "주의" ? "text-amber-500" : "text-blue-400"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertLevelBadge level={a.level} />
                    <span className="text-[11px] text-slate-400">{a.time}</span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium leading-snug text-slate-700">{a.title}</p>
                  <p className="text-[12px] text-slate-400">{a.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="데이터 업데이트 상태" action={<LinkBtn>전체 보기</LinkBtn>}>
          <ul className="space-y-2.5">
            {dataStatus.map((d) => (
              <li key={d.label} className="flex items-center justify-between text-[13px]">
                <span className="text-slate-600">{d.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{d.time}</span>
                  <span className={`h-2 w-2 rounded-full ${d.ok ? "bg-emerald-500" : "bg-amber-500"}`} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, level, delta }: { label: string; value: number; level: string; delta: string }) {
  const color = value >= 70 ? "text-orange-500" : value >= 50 ? "text-amber-500" : "text-emerald-500";
  return (
    <Card className="!p-0">
      <div className="p-4">
        <div className="flex items-center gap-1 text-[12.5px] text-slate-500">
          {label}
          <Info size={12} className="text-slate-300" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className={`text-3xl font-extrabold ${color}`}>{value}</span>
          <span className="text-sm text-slate-400">/100</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <RiskBadge level={level === "높음" ? "경고" : "주의"} size="sm" />
          <span className="text-[11px] font-medium text-red-500">{delta}</span>
        </div>
      </div>
    </Card>
  );
}

function LinkBtn({ children, filled = false }: { children: string; filled?: boolean }) {
  return (
    <button
      type="button"
      className={
        filled
          ? "rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700"
          : "text-[12px] font-medium text-blue-600 hover:text-blue-700"
      }
    >
      {children}
    </button>
  );
}
