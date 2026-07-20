import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Clock,
  Database,
  FileText,
  FlaskConical,
  Home,
  Layers,
  Radar,
  Settings,
  Star,
  Users,
  Box,
} from "lucide-react";
import { navSections } from "../data/nav";

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  home: Home,
  radar: Radar,
  layers: Layers,
  users: Users,
  flask: FlaskConical,
  "bar-chart": BarChart3,
  "file-text": FileText,
  database: Database,
  settings: Settings,
};

export function Sidebar() {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "리스크 모니터링": location.pathname.startsWith("/risk-monitoring"),
    "보고서 & 브리핑": location.pathname.startsWith("/briefing"),
    "데이터 관리": location.pathname.startsWith("/data-management"),
  });

  const toggle = (label: string) =>
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-navy-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
          <Box size={18} className="text-white" />
        </div>
        <span className="text-[15px] font-bold text-white">SCM Risk Center</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-0.5">
          {navSections.map((section) => {
            const Icon = ICONS[section.icon] ?? Boxes;
            const isOpen = openSections[section.label];
            const isActiveParent =
              section.path
                ? location.pathname === section.path
                : section.children?.some((c) => location.pathname === c.path);

            if (!section.children) {
              return (
                <li key={section.label}>
                  <NavLink
                    to={section.path!}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-navy-700 hover:text-white"
                      }`
                    }
                  >
                    <Icon size={17} />
                    {section.label}
                  </NavLink>
                </li>
              );
            }

            return (
              <li key={section.label}>
                <button
                  type="button"
                  onClick={() => toggle(section.label)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                    isActiveParent ? "text-white" : "text-slate-300 hover:bg-navy-700 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <ul className="mt-0.5 space-y-0.5 border-l border-navy-600 ml-5 pl-3">
                    {section.children.map((child) => (
                      <li key={child.path}>
                        <NavLink
                          to={child.path}
                          className={({ isActive }) =>
                            `block rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                              isActive
                                ? "bg-blue-600 text-white font-medium"
                                : "text-slate-400 hover:bg-navy-700 hover:text-white"
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-navy-700 px-3 py-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400 hover:bg-navy-700 hover:text-white">
          <Star size={16} />
          즐겨찾기
        </button>
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400 hover:bg-navy-700 hover:text-white">
          <Clock size={16} />
          최근 본 화면
        </button>
      </div>
    </aside>
  );
}
