import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";
import { navSections } from "../data/nav";

function getPageTitle(pathname: string): string {
  for (const section of navSections) {
    if (section.path === pathname) return section.label;
    const child = section.children?.find((c) => c.path === pathname);
    if (child) return child.label;
  }
  return "화면";
}

export function Placeholder() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-slate-400">
      <Construction size={40} className="mb-3" />
      <p className="text-sm font-medium text-slate-500">{title} 화면은 준비 중입니다.</p>
      <p className="mt-1 text-xs text-slate-400">MVP 우선순위에 따라 순차적으로 구현됩니다.</p>
    </div>
  );
}
