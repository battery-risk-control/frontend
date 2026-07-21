import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  icon?: ReactNode;
  padded?: boolean;
}

export function Card({ children, className = "", title, action, icon, padded = true }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          </div>
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function LinkAction({ children }: { children: ReactNode }) {
  return (
    <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
      {children}
    </button>
  );
}
