import { Download, FileText, RefreshCw, Share2, Users2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import {
  briefingDoc,
  briefingSummary,
  evidenceList,
  recommendedActions,
  scenarioComparison,
  topRisks,
} from "../data/mock";

export function Briefing() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[15px] font-bold text-slate-800">
            AI 브리핑 <span className="text-slate-300">|</span> {briefingSummary.date}
          </h2>
          <span className="text-[12px] text-slate-400">생성 시간 {briefingSummary.time}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-blue-700">
            <RefreshCw size={14} />
            브리핑 생성
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">
            <Share2 size={14} />
            공유
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">
            <Download size={14} />
            내보내기
          </button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-[1fr_260px] gap-6">
          <div>
            <h3 className="text-[13px] font-bold text-slate-700">Executive Summary</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{briefingSummary.text}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-l border-slate-100 pl-6">
            <MiniBox label="영향 원자재" value="6 개" />
            <MiniBox label="영향 협력사" value="21 개" />
            <MiniBox label="예상 영향 기간" value="2~6 주" />
            <MiniBox label="종합 영향 수준" value="높음" tone="warn" />
          </div>
        </div>
      </Card>

      <Card title="주요 리스크 Top 3">
        <div className="grid grid-cols-3 gap-4">
          {topRisks.map((r) => (
            <div key={r.rank} className="rounded-lg border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[12px] font-bold text-white">
                  {r.rank}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    r.level === "검토 필요" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {r.level}
                </span>
              </div>
              <p className="mt-2 text-[13.5px] font-semibold leading-snug text-slate-700">{r.title}</p>
              <div className="mt-3 flex items-center justify-between text-[12px] text-slate-400">
                <span>
                  리스크 지수 <b className="text-slate-700">{r.score}</b>
                </span>
                <span>영향 기간 {r.period}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="권장 대응 조치" action={<button className="text-[12px] font-medium text-blue-600">전체 보기</button>} padded={false}>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
              <th className="px-5 py-2.5 font-medium">우선순위</th>
              <th className="px-2 py-2.5 font-medium">조치 내용</th>
              <th className="px-2 py-2.5 font-medium">관련 원자재</th>
              <th className="px-2 py-2.5 font-medium">예상 효과</th>
              <th className="px-2 py-2.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {recommendedActions.map((a) => (
              <tr key={a.priority} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[12px] font-bold text-slate-600">
                    {a.priority}
                  </span>
                </td>
                <td className="px-2 py-2.5 font-medium text-slate-700">{a.action}</td>
                <td className="px-2 py-2.5 text-slate-500">{a.material}</td>
                <td className="px-2 py-2.5 font-medium text-emerald-600">{a.effect}</td>
                <td className="px-2 py-2.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      a.status === "검토 필요" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-[1.3fr_1fr] gap-5">
        <Card
          title="시나리오 비교 분석"
          action={
            <div className="flex items-center gap-3 text-[11.5px] text-slate-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />기준 시나리오</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />리스크 시나리오</span>
            </div>
          }
        >
          <div className="space-y-4">
            {scenarioComparison.categories.map((c, i) => (
              <div key={c}>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="text-slate-500">{c}</span>
                  <span
                    className={`font-semibold ${scenarioComparison.risk[i] >= 0 ? "text-red-500" : "text-blue-500"}`}
                  >
                    {scenarioComparison.labels[i]}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-slate-100">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-slate-300" style={{ width: "50%" }} />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                    style={{ width: `${50 + Math.min(Math.abs(scenarioComparison.risk[i]) * 2, 45) * (scenarioComparison.risk[i] >= 0 ? 1 : -1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="근거 및 출처 (Evidence)" action={<button className="text-[12px] font-medium text-blue-600">전체 보기</button>}>
          <ul className="space-y-3">
            {evidenceList.map((e, i) => (
              <li key={i} className="flex items-start justify-between gap-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-[12.5px] font-medium leading-snug text-slate-700">{e.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {e.date} | {e.source}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${
                    e.status === "검증 완료" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {e.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-5">
        <Card title="생성된 브리핑 문서 미리보기">
          <div className="flex gap-4">
            <div className="flex h-28 w-24 shrink-0 items-center justify-center rounded-lg bg-blue-600">
              <FileText size={30} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-slate-700">{briefingDoc.title}</p>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[12px]">
                <dt className="text-slate-400">생성 일시</dt>
                <dd className="text-slate-600">{briefingDoc.createdAt}</dd>
                <dt className="text-slate-400">생성자</dt>
                <dd className="text-slate-600">{briefingDoc.creator}</dd>
                <dt className="text-slate-400">대상</dt>
                <dd className="text-slate-600">{briefingDoc.target}</dd>
                <dt className="text-slate-400">분량</dt>
                <dd className="text-slate-600">{briefingDoc.pages}</dd>
              </dl>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-[12px] font-medium text-slate-500">포함 내용</p>
            <ul className="mt-1.5 grid grid-cols-2 gap-y-1 text-[12px] text-slate-500">
              {briefingDoc.contents.map((c) => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-lg bg-blue-600 py-2 text-[12.5px] font-semibold text-white hover:bg-blue-700">미리보기</button>
            <button className="flex-1 rounded-lg border border-slate-200 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50">다운로드</button>
          </div>
        </Card>

        <Card title="공유 및 협업">
          <p className="text-[12px] text-slate-400">공유 대상</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["구매기획팀", "SCM팀", "리스크관리팀", "경영진"].map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] text-slate-600">
                <Users2 size={11} />
                {t}
              </span>
            ))}
            <button className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[12px] text-slate-400">+ 추가</button>
          </div>

          <p className="mt-4 text-[12px] text-slate-400">공유 링크</p>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <span className="flex-1 truncate text-[12px] text-blue-600">https://scrisk.center/briefing/20250708</span>
            <button className="text-[11.5px] font-medium text-slate-500">복사</button>
          </div>

          <p className="mt-4 text-[12px] text-slate-400">댓글</p>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              placeholder="의견을 입력하세요..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[12.5px] outline-none focus:border-blue-300"
            />
            <button className="rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-blue-700">등록</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MiniBox({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`mt-0.5 text-[14px] font-bold ${tone === "warn" ? "text-orange-600" : "text-slate-700"}`}>{value}</div>
    </div>
  );
}
