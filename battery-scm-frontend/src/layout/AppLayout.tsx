import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { navSections } from "../data/nav";

function getPageTitle(pathname: string): string {
  for (const section of navSections) {
    if (section.path === pathname) return section.label;
    const child = section.children?.find((c) => c.path === pathname);
    if (child) return child.label;
  }
  return "배터리 공급망 리스크 센터";
}

export function AppLayout() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-[#f3f5fa]">
      <Sidebar />
      <div className="ml-[248px] flex min-h-screen flex-col">
        <Header title={title} />
        <main className="flex-1 px-6 py-5">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 px-6 py-3 text-center text-[11px] text-slate-400">
          © 2025 Battery Co., Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
