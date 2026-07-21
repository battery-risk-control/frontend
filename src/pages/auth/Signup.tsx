import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { AuthShell } from "./AuthShell";

const ACCESS_TIERS = [
  {
    key: "tier1",
    title: "1계층 : 구매팀 실무 사용자",
    desc: "원자재별 리스크 실시간 관제 및 내부 Brief 리포트 생성 권한",
  },
  {
    key: "tier2",
    title: "2계층 : 경영기획팀 분석 사용자",
    desc: "전사 관점 위험 노출도 및 협력사 리스크 패턴 비교 분석 권한",
  },
  {
    key: "tier3",
    title: "3계층 : 경영진",
    desc: "누적 리스크 핵심 KPI 요약 및 시뮬레이션 비용 최종 의사결정 권한",
  },
] as const;

export function Signup() {
  const [tier, setTier] = useState<(typeof ACCESS_TIERS)[number]["key"]>("tier1");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <AuthShell mode="signup" pageLabel="회원가입">
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle2 size={40} className="text-emerald-500" />
          <h3 className="mt-4 text-[15px] font-semibold text-slate-800">가입 신청이 접수되었습니다</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
            관리자 승인 후 등록하신 사내 이메일로 계정 활성화 안내를 보내드립니다.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell mode="signup" pageLabel="회원가입">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">임직원 성명</label>
          <input
            type="text"
            required
            placeholder="홍길동"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">회사 이메일 계정 (ID)</label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">접속 비밀번호 설정</label>
          <input
            type="password"
            required
            minLength={8}
            placeholder="8자리 이상, 특수문자 포함"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-[12.5px] font-medium text-slate-600">신청 보안 접근권한</label>
          <div className="space-y-2">
            {ACCESS_TIERS.map((t) => (
              <label
                key={t.key}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-2.5 transition-colors ${
                  tier === t.key ? "border-blue-500 bg-blue-50/60" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="access-tier"
                  checked={tier === t.key}
                  onChange={() => setTier(t.key)}
                  className="mt-1 h-3.5 w-3.5 shrink-0 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-[12.5px] font-semibold text-slate-700">{t.title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2.5 text-[13.5px] font-semibold text-white hover:bg-blue-700"
        >
          가입 및 계정 승인 요청
        </button>
      </form>
    </AuthShell>
  );
}
