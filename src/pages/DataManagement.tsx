import { AlertOctagon, AlertTriangle, Check, CloudUpload, Download, FileSpreadsheet, Info, XCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import {
  dataIssues,
  importSummary,
  schemaMapping,
  uploadFiles,
  validationRows,
} from "../data/mock";

const STEPS = ["파일 업로드", "데이터 검증", "매핑 및 확인", "완료"];

export function DataManagement() {
  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div className="space-y-5">
        <Card className="!p-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                      i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-[13px] font-medium ${i === 0 ? "text-slate-800" : "text-slate-400"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="mx-3 h-px flex-1 border-t border-dashed border-slate-200" />}
              </div>
            ))}
          </div>
        </Card>

        <Card title="1. 파일 업로드" action={<span className="text-[12px] text-slate-400">ERP 및 계약 관련 데이터를 업로드하고 검증합니다.</span>}>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 py-10">
            <CloudUpload size={30} className="mb-2 text-blue-500" />
            <p className="text-[14px] font-semibold text-slate-700">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="mt-1 text-[12px] text-slate-400">CSV, XLSX 지원 (최대 500MB)</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {uploadFiles.map((f) => (
              <div key={f.name} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-emerald-500" />
                    <span className="text-[12.5px] font-medium text-slate-700">{f.name}</span>
                  </div>
                  {f.status === "완료" ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : f.status === "검증중" ? null : (
                    <XCircle size={13} className="text-red-400" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-500">{f.type}</span>
                  {f.size}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${f.status === "완료" ? "bg-emerald-500" : "bg-blue-500"}`}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {f.status === "완료" ? "업로드 완료" : f.status === "검증중" ? `검증 중 (${f.progress}%)` : "대기"}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="2. 데이터 검증 결과" action={<button className="text-[12px] font-medium text-blue-600">검증 규칙 보기</button>}>
          <div className="mb-4 grid grid-cols-4 gap-4">
            <MiniStat label="전체 파일" value={6} />
            <MiniStat label="성공" value={2} icon={<Check size={16} className="text-emerald-500" />} valueClass="text-emerald-600" />
            <MiniStat label="경고" value={2} icon={<AlertTriangle size={16} className="text-amber-500" />} valueClass="text-amber-600" />
            <MiniStat label="오류" value={1} icon={<XCircle size={16} className="text-red-500" />} valueClass="text-red-600" />
          </div>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
                <th className="px-3 py-2 font-medium">파일명</th>
                <th className="px-2 py-2 font-medium">데이터 유형</th>
                <th className="px-2 py-2 font-medium">행 수</th>
                <th className="px-2 py-2 font-medium">검증 결과</th>
                <th className="px-2 py-2 font-medium">오류</th>
                <th className="px-2 py-2 font-medium">경고</th>
                <th className="px-2 py-2 font-medium">중복</th>
                <th className="px-2 py-2 font-medium">상태</th>
                <th className="px-2 py-2 font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {validationRows.map((r) => (
                <tr key={r.file} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-700">{r.file}</td>
                  <td className="px-2 py-2.5 text-slate-500">{r.type}</td>
                  <td className="px-2 py-2.5 text-slate-500">{r.rows.toLocaleString()}</td>
                  <td className="px-2 py-2.5">
                    <ResultBadge result={r.result} />
                  </td>
                  <td className="px-2 py-2.5 text-red-500">{r.errors}</td>
                  <td className="px-2 py-2.5 text-amber-500">{r.warnings}</td>
                  <td className="px-2 py-2.5 text-slate-500">{r.duplicates}</td>
                  <td className="px-2 py-2.5 text-slate-500">{r.status}</td>
                  <td className="px-2 py-2.5">
                    <button className="text-[11.5px] font-medium text-blue-600">상세 보기</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card
          title="3. 스키마 매핑 (자재 마스터.xlsx)"
          action={
            <div className="flex items-center gap-3 text-[12px]">
              <button className="font-medium text-blue-600">자동 매핑</button>
              <button className="font-medium text-blue-600">매핑 초기화</button>
              <span className="text-slate-400">필수 필드 8/8 매핑</span>
            </div>
          }
        >
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11.5px] text-slate-400">
                <th className="px-3 py-2 font-medium">대상 필드 (시스템)</th>
                <th className="px-2 py-2 font-medium">설명</th>
                <th className="px-2 py-2 font-medium">매핑된 컬럼 (업로드 파일)</th>
                <th className="px-2 py-2 font-medium">샘플 데이터</th>
                <th className="px-2 py-2 font-medium">필수 여부</th>
                <th className="px-2 py-2 font-medium">매핑 상태</th>
              </tr>
            </thead>
            <tbody>
              {schemaMapping.map((m) => (
                <tr key={m.target} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-700">{m.target}</td>
                  <td className="px-2 py-2.5 text-slate-400">{m.desc}</td>
                  <td className="px-2 py-2.5">
                    <span className="rounded-md border border-slate-200 px-2 py-1 text-[12px] text-slate-600">{m.mapped}</span>
                  </td>
                  <td className="px-2 py-2.5 text-slate-400">{m.sample}</td>
                  <td className="px-2 py-2.5">
                    <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-500">필수</span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">매핑됨</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="4. 가져오기 요약">
          <div className="text-[12px] text-slate-400">예상 데이터 건수</div>
          <div className="text-3xl font-extrabold text-slate-800">316,798<span className="text-sm font-normal text-slate-400"> 건</span></div>
          <ul className="mt-3 space-y-1.5">
            {importSummary.map((s) => (
              <li key={s.label} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <FileSpreadsheet size={13} className="text-slate-300" />
                  {s.label}
                </span>
                <span className="font-medium text-slate-700">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="데이터 품질 점수">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-emerald-500">92</span>
            <span className="text-sm text-slate-400">/100</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[92%] rounded-full bg-emerald-500" />
          </div>
          <span className="mt-1 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            우수
          </span>

          <div className="mt-4 text-[13px] font-semibold text-slate-700">주요 이슈</div>
          <ul className="mt-2 space-y-2">
            {dataIssues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px]">
                {issue.level === "오류" ? (
                  <AlertOctagon size={14} className="mt-0.5 text-red-500" />
                ) : (
                  <AlertTriangle size={14} className="mt-0.5 text-amber-500" />
                )}
                <div>
                  <span className="font-medium text-slate-700">{issue.label}</span>
                  <span className="ml-1 text-slate-400">{issue.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="5. 다음 단계">
          <p className="flex items-start gap-1.5 text-[12px] text-slate-400">
            <Info size={13} className="mt-0.5 shrink-0" />
            검증 및 매핑이 완료되면 데이터를 가져옵니다.
          </p>
          <button className="mt-3 w-full rounded-lg bg-blue-600 py-2.5 text-[13px] font-semibold text-white hover:bg-blue-700">
            데이터 가져오기
          </button>
          <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
            <Download size={14} />
            검증 보고서 다운로드
          </button>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
            <Info size={12} className="mt-0.5 shrink-0" />
            가져오기 실행 시 현재 시스템 데이터는 변경되지 않으며, 검토 후 확정됩니다.
          </p>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  valueClass = "text-slate-700",
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
      <div>
        <div className="text-[11.5px] text-slate-400">{label}</div>
        <div className={`text-xl font-bold ${valueClass}`}>{value}</div>
      </div>
      {icon}
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    "성공": "bg-emerald-100 text-emerald-700",
    "검증 중": "bg-blue-100 text-blue-700",
    "경고": "bg-amber-100 text-amber-700",
    "오류": "bg-red-100 text-red-700",
  };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${map[result]}`}>{result}</span>;
}
