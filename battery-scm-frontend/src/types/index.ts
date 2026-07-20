export type RiskLevel = "정상" | "주의" | "경고" | "심각";

export type AlertLevel = "심각" | "경고" | "주의" | "정보";

export interface NavChild {
  label: string;
  path: string;
}

export interface NavItem {
  label: string;
  path?: string;
  icon: string;
  children?: NavChild[];
}
