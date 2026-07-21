import { AlertCircle, ChevronDown, Download, Landmark, Ship, Sailboat, Pickaxe, RotateCcw } from "lucide-react";
import { Card } from "../components/ui/Card";
import { RiskBadge } from "../components/ui/Badge";
import { MultiLineChart } from "../components/ui/Charts";
import { HOTSPOT_COLOR } from "../components/ui/GlobalRiskMap";
import {
  eventTimeline,
  materialRiskSummary,
  monitoringNewsFeed,
  monitoringPrices,
  monitoringPriceSeries,
  riskDrivers,
} from "../data/mock";

const DRIVER_ICONS = { ship: Ship, pickaxe: Pickaxe, landmark: Landmark, waves: Sailboat };

export function RiskMonitoring() {
  return (
    <div className="space-y-5">
      <Card className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="원자재" value="전체 (3)" />
          <FilterSelect label="국가/지역" value="전체" />
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
            {["1주", "1개월", "3개월", "6개월", "사용자 설정"].map((t) => (
              <button
                key={t}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
                  t === "1개월" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] text-slate-500 hover:bg-slate-50">
            <RotateCcw size={13} />
            필터 초기화
          </button>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700">
            <Download size={13} />
            리스크 요약 다운로드
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {monitoringPrices.map((p) => (
          <Card key={p.material} className="!p-4">
            <div className="text-[12.5px] font-semibold text-slate-700">{p.material}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-800">{p.price.toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {p.unit} <span className={p.up ? "text-red-500" : "text-blue-500"}>{p.changeLabel}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">리스크 지수</span>
              <RiskBadge level={p.level === "높음" ? "경고" : p.level} size="sm" />
            </div>
            <div className="mt-1 text-right text-sm font-bold text-slate-700">{p.score} <span className="text-[11px] font-normal text-slate-400">/100</span></div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-5">
        <Card title="실시간 이벤트 타임라인" action={<LinkBtn>전체 보기</LinkBtn>}>
          <ul className="space-y-4">
            {eventTimeline.map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-10 shrink-0 text-[11px] text-slate-400">{e.time}</span>
                <span className="text-base">{e.flag}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-slate-700">{e.title}</p>
                  <div className="mt-1 flex gap-1.5">
                    {e.tags.map((t) => (
                      <span key={t} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-500">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    color: e.level === "매우 높음" ? "#dc2626" : HOTSPOT_COLOR[e.level as string],
                    backgroundColor: e.level === "매우 높음" ? "#fee2e2" : `${HOTSPOT_COLOR[e.level as string]}1a`,
                  }}
                >
                  {e.level}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="주요 리스크 드라이버" action={<LinkBtn>전체 보기</LinkBtn>}>
          <ul className="space-y-3.5">
            {riskDrivers.map((d) => {
              const Icon = DRIVER_ICONS[d.icon as keyof typeof DRIVER_ICONS];
              return (
                <li key={d.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700">{d.title}</p>
                    <p className="text-[12px] text-slate-400">{d.desc}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {d.materials.map((m) => (
                        <span key={m} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-500">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card title="가격 추이 및 변동성" action={<LinkBtn>1개월</LinkBtn>}>
          <MultiLineChart data={monitoringPriceSeries} lines={["리튬", "니켈", "흑연"]} height={220} />
        </Card>

        <Card title="뉴스 & 이벤트 피드" action={<LinkBtn>전체 보기</LinkBtn>}>
          <ul className="space-y-3.5">
            {monitoringNewsFeed.map((n, i) => (
              <li key={i} className="flex gap-2.5">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-slate-300" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{n.time}</span>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                      style={{
                        color: n.level === "매우 높음" ? "#dc2626" : n.level === "높음" ? "#ea580c" : "#d97706",
                        backgroundColor: n.level === "매우 높음" ? "#fee2e2" : n.level === "높음" ? "#ffedd5" : "#fef3c7",
                      }}
                    >
                      {n.level}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-slate-700">{n.title}</p>
                  <p className="text-[12px] text-slate-400">{n.desc}</p>
                  <p className="text-[11px] text-slate-400">{n.source}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="원자재별 리스크 요약" action={<LinkBtn>전체 보기</LinkBtn>} padded={false}>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
                <th className="px-4 py-2 font-medium">원자재</th>
                <th className="px-2 py-2 font-medium">리스크 지수</th>
                <th className="px-2 py-2 font-medium">전일 대비</th>
                <th className="px-2 py-2 font-medium">주요 이슈</th>
              </tr>
            </thead>
            <tbody>
              {materialRiskSummary.map((m) => (
                <tr key={m.material} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{m.material}</td>
                  <td className="px-2 py-2.5 font-bold text-slate-700">{m.score}</td>
                  <td className={`px-2 py-2.5 font-medium ${m.prevDelta >= 0 ? "text-red-500" : "text-blue-500"}`}>
                    {m.prevDelta >= 0 ? "▲" : "▼"} {Math.abs(m.prevDelta)}
                  </td>
                  <td className="px-2 py-2.5 text-slate-400">{m.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-[10.5px] text-slate-400">* 리스크 지수: 0~100 (높을수록 리스크 큼)</p>
        </Card>
      </div>
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

function LinkBtn({ children }: { children: string }) {
  return <button className="text-[12px] font-medium text-blue-600 hover:text-blue-700">{children}</button>;
}
