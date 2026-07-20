export interface NavLeaf {
  label: string;
  path: string;
}

export interface NavSection {
  label: string;
  path?: string;
  icon: string;
  children?: NavLeaf[];
}

export const navSections: NavSection[] = [
  { label: "대시보드", path: "/", icon: "home" },
  {
    label: "리스크 모니터링",
    icon: "radar",
    children: [
      { label: "외부 리스크 모니터링", path: "/risk-monitoring" },
      { label: "국가/지역 리스크", path: "/risk-monitoring/country" },
      { label: "원자재 가격 모니터링", path: "/risk-monitoring/price" },
      { label: "글로벌 이벤트", path: "/risk-monitoring/events" },
    ],
  },
  {
    label: "원자재",
    icon: "layers",
    children: [
      { label: "리튬", path: "/materials/lithium" },
      { label: "니켈", path: "/materials/nickel" },
      { label: "흑연", path: "/materials/graphite" },
      { label: "코발트", path: "/materials/cobalt" },
      { label: "망간", path: "/materials/manganese" },
      { label: "구리", path: "/materials/copper" },
    ],
  },
  {
    label: "공급업체 관리",
    icon: "users",
    children: [
      { label: "공급업체 목록", path: "/suppliers/list" },
      { label: "공급업체 평가", path: "/suppliers/eval" },
    ],
  },
  {
    label: "리스크 시뮬레이션",
    icon: "flask",
    children: [
      { label: "시나리오 설정", path: "/simulation/scenario" },
      { label: "결과 비교", path: "/simulation/compare" },
    ],
  },
  { label: "ERP 영향 분석", path: "/erp-impact", icon: "bar-chart" },
  {
    label: "보고서 & 브리핑",
    icon: "file-text",
    children: [{ label: "브리핑 & 의사결정 지원", path: "/briefing" }],
  },
  {
    label: "데이터 관리",
    icon: "database",
    children: [
      { label: "파일 업로드", path: "/data-management" },
      { label: "스키마 관리", path: "/data-management/schema" },
      { label: "데이터 히스토리", path: "/data-management/history" },
    ],
  },
  {
    label: "시스템 설정",
    icon: "settings",
    children: [{ label: "사용자 및 권한", path: "/settings/users" }],
  },
];
