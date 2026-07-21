import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Box, ShieldCheck } from "lucide-react";

const TABS = [
  { key: "login", label: "시스템 로그인", to: "/login" },
  { key: "signup", label: "권한 신청", to: "/signup" },
] as const;

export function AuthShell({
  mode,
  pageLabel,
  children,
}: {
  mode: "login" | "signup";
  pageLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f5fa] p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] text-slate-400">{pageLabel}</span>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={14} />
            메인 화면으로
          </Link>
        </div>

        <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg md:grid-cols-[1fr_1.15fr]">
          <div className="hidden flex-col justify-center bg-gradient-to-br from-navy-900 to-navy-700 px-10 py-12 text-white md:flex">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                <Box size={19} className="text-white" />
              </div>
              <span className="text-[16px] font-bold">SCM Risk Center</span>
            </div>
            <h2 className="mt-8 text-xl font-bold leading-snug">
              배터리 공급망
              <br />
              외부 리스크 관제 시스템
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-300">
              원자재 가격, 지정학적 리스크, 공급사 이슈를 실시간으로 모니터링하고
              ERP 영향도를 분석합니다.
            </p>
          </div>

          <div className="px-8 py-10 sm:px-12">
            <div className="flex items-center justify-between border-b border-slate-100">
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  to={t.to}
                  className={`pb-3 text-[14px] font-semibold ${
                    mode === t.key ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <div className="flex h-1 w-full">
              {TABS.map((t) => (
                <span
                  key={t.key}
                  className={`h-full flex-1 ${mode === t.key ? "bg-navy-900" : "bg-slate-100"}`}
                />
              ))}
            </div>

            <div className="mt-7">{children}</div>

            <div className="mt-6 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-slate-400" />
              <span>IP 접근 제어 및 2차 인증(OTP)이 활성화된 구간입니다.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
