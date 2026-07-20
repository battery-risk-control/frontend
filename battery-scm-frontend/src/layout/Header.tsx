import { Bell, Calendar, ChevronDown, HelpCircle, Menu } from "lucide-react";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <button className="text-slate-500 hover:text-slate-700">
          <Menu size={20} />
        </button>
        <h1 className="text-[17px] font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50">
          전체 조직
          <ChevronDown size={14} />
        </button>
        <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50">
          <Calendar size={14} />
          2025-07-08
        </button>
        <button className="relative text-slate-500 hover:text-slate-700">
          <Bell size={19} />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            12
          </span>
        </button>
        <button className="text-slate-500 hover:text-slate-700">
          <HelpCircle size={19} />
        </button>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            김구매
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-slate-700">김구매</div>
            <div className="text-[11px] text-slate-400">구매기획팀</div>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
