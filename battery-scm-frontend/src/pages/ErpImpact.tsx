import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, Download, FileText, Link2, Package, RotateCcw, Search, Star } from "lucide-react";
import { Card } from "../components/ui/Card";
import { RiskBadge } from "../components/ui/Badge";
import { DonutChart } from "../components/ui/Charts";
import {
  erpFactorSummary,
  erpKpis,
  erpMaterialRows,
  heatmapData,
  heatmapMaterials,
  heatmapProducts,
  impactDistribution,
} from "../data/mock";

const FACTOR_ICONS = { link: Link2, box: Package, file: FileText, clock: Clock };

export function ErpImpact() {
  const [tab, setTab] = useState<"자재" | "제품">("자재");

  return (
    <div className="space-y-5">
      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="분석 기준일" value="2025-07-08" />
          <FilterSelect label="사업부" value="전체" />
          <FilterSelect label="영향 제품군" value="전체" />
          <FilterSelect label="원자재 그룹" value="전체" />
          <FilterSelect label="위험 수준" value="전체" />
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              placeholder="자재코드/자재명 검색"
              className="rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-[12px] text-slate-600 outline-none focus:border-blue-300"
            />
          </div>
          <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] text-slate-500 hover:bg-slate-50">
            <RotateCcw size={13} />
            필터 초기화
          </button>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700">
            <Download size={13} />
            내보내기
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-6 gap-4">
        {erpKpis.map((k) => (
          <Card key={k.label} className="!p-4">
            <div className="text-[12px] text-slate-500">{k.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{k.value}</span>
              <span className="text-sm text-slate-400">{k.total}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <RiskBadge level={k.level === "높음" ? "경고" : "주의"} size="sm" />
              <span className="text-[11px] font-medium text-red-500">전일 대비 ▲ {k.delta}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-5">
        <Card title="자재 영향도 분포">
          <div className="flex flex-col items-center gap-4">
            <DonutChart
              data={impactDistribution.map((d) => ({ label: d.label, value: d.value, color: d.color }))}
              centerValue="67"
              centerLabel="평균 영향도"
            />
            <ul className="w-full space-y-1.5 text-[12px]">
              {impactDistribution.map((d) => (
                <li key={d.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.label}
                  </span>
                  <span className="font-medium text-slate-700">
                    {d.value}건 ({d.pct}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="원자재 - 제품 의존도 히트맵">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-[11.5px]">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-slate-400">원자재</th>
                  {heatmapProducts.map((p) => (
                    <th key={p} className="pb-2 font-medium text-slate-500">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapMaterials.map((mat, ri) => (
                  <tr key={mat}>
                    <td className="py-1.5 pr-3 text-left text-[12px] font-medium text-slate-600">{mat}</td>
                    {heatmapData[ri].map((v, ci) => (
                      <td key={ci} className="p-1">
                        <div
                          className="mx-auto flex h-8 w-full items-center justify-center rounded-md text-[11px] font-semibold text-white"
                          style={{ backgroundColor: `rgba(220,38,38,${v / 100})`, color: v > 40 ? "white" : "#475569" }}
                        >
                          {v}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-slate-400">
            낮음
            <span className="h-2 w-16 rounded-full bg-gradient-to-r from-red-100 to-red-600" />
            높음
          </div>
        </Card>

        <Card title="영향도 주요 요인 요약">
          <ul className="space-y-3">
            {erpFactorSummary.map((f) => {
              const Icon = FACTOR_ICONS[f.icon as keyof typeof FACTOR_ICONS];
              return (
                <li key={f.label} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={15} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[11.5px] text-slate-500">{f.label}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-800">{f.value}</span>
                      <span className="text-[11px] text-slate-400">{f.total ?? f.unit}</span>
                    </div>
                  </div>
                  <RiskBadge level={f.level === "높음" ? "경고" : "주의"} size="sm" />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pt-3">
          <div className="flex gap-5">
            {(["자재", "제품"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-1 pb-3 text-[13px] font-medium ${
                  tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                영향 {t} 상세
              </button>
            ))}
          </div>
          <div className="pb-2 text-[12px] text-slate-400">총 {erpMaterialRows.length}건</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
                <th className="w-8 px-5 py-2.5"></th>
                <th className="px-2 py-2.5 font-medium">자재코드</th>
                <th className="px-2 py-2.5 font-medium">자재명</th>
                <th className="px-2 py-2.5 font-medium">연결 원자재</th>
                <th className="px-2 py-2.5 font-medium">영향 제품</th>
                <th className="px-2 py-2.5 font-medium">주요 공급사</th>
                <th className="px-2 py-2.5 font-medium">재고 소진일</th>
                <th className="px-2 py-2.5 font-medium">계약 만료일</th>
                <th className="px-2 py-2.5 font-medium">내부 영향도</th>
                <th className="w-8 px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {erpMaterialRows.map((r) => (
                <tr key={r.code} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-2.5 text-slate-300">
                    <Star size={14} />
                  </td>
                  <td className="px-2 py-2.5 font-mono text-[12px] text-slate-500">{r.code}</td>
                  <td className="px-2 py-2.5 font-medium text-slate-700">{r.name}</td>
                  <td className="px-2 py-2.5 text-slate-500">{r.material}</td>
                  <td className="px-2 py-2.5 text-slate-500">{r.product}</td>
                  <td className="px-2 py-2.5 text-slate-500">
                    {r.flag} {r.supplier}
                  </td>
                  <td className="px-2 py-2.5 font-medium text-red-500">{r.stockDays}일</td>
                  <td className="px-2 py-2.5 text-orange-500">
                    {r.contractExpiry} ({r.contractDays}일)
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{r.impact}</span>
                      <RiskBadge level={r.level} size="sm" />
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-slate-300">
                    <ChevronRight size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-1 py-3">
          {[1, 2, 3].map((p) => (
            <button
              key={p}
              className={`h-7 w-7 rounded-md text-[12px] ${p === 1 ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {p}
            </button>
          ))}
          <ChevronRight size={15} className="ml-1 text-slate-400" />
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] text-slate-600 hover:bg-slate-50">
      <span className="text-slate-400">{label}</span>
      {value}
      <ChevronDown size={13} />
    </button>
  );
}
