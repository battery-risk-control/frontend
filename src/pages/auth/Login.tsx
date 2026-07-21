import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "./AuthShell";

export function Login() {
  const navigate = useNavigate();
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <AuthShell mode="login" pageLabel="로그인">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">사내 이메일 주소</label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-medium text-slate-600">비밀번호</label>
          <input
            type="password"
            required
            placeholder="********"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2.5 text-[13.5px] font-semibold text-white hover:bg-blue-700"
        >
          보안 세션 로그인
        </button>

        <div className="flex items-center justify-between text-[12px]">
          <label className="flex items-center gap-1.5 text-slate-500">
            <input
              type="checkbox"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            로그인 상태 유지
          </label>
          <Link to="#" className="font-medium text-blue-600 hover:text-blue-700">
            비밀번호 초기화 신청
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
