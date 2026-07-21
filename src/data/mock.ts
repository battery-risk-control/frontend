import type { AlertLevel, RiskLevel } from "../types";

// ---------- Dashboard ----------

export interface MaterialRiskCard {
  name: string;
  basis: string;
  tag: string;
  level: RiskLevel;
  changeLabel: string;
}

export const materialRiskCards: MaterialRiskCard[] = [
  { name: "리튬", basis: "(탄산리튬 기준)", tag: "핵심원자재", level: "경고", changeLabel: "전일 대비 ▲ 4" },
  { name: "니켈", basis: "(황산니켈 기준)", tag: "핵심원자재", level: "주의", changeLabel: "전일 대비 ▼ 2" },
  { name: "흑연", basis: "(구형흑연 기준)", tag: "핵심원자재", level: "경고", changeLabel: "전일 대비 ▲ 6" },
];

export const summaryScores = {
  external: { label: "외부 리스크 종합 점수", value: 72, level: "높음" as const, deltaLabel: "전일 대비 ▲ +8p" },
  erp: { label: "ERP 영향 점수", value: 65, level: "주의" as const, deltaLabel: "전일 대비 ▲ +6p" },
};

export interface AlertItem {
  level: AlertLevel;
  title: string;
  desc: string;
  time: string;
}

export const dashboardAlerts: AlertItem[] = [
  { level: "심각", title: "중국 장시성 리튬 제련소 환경 규제 강화", desc: "현지 생산 차질로 단기 물량 공급 부족 우려", time: "10:30" },
  { level: "경고", title: "인도네시아 니켈 광산 수출 허가 지연", desc: "7월 선적 물량 지연 가능성", time: "09:15" },
  { level: "주의", title: "흑연(천연) 중국 세관 통관 지연 증가", desc: "통관 지연 평균 2.4일 (전주 대비 +1.1일)", time: "08:40" },
  { level: "정보", title: "탄산리튬 가격 변동성 확대", desc: "7일 변동폭 8.7% (전월 대비 +3.2%p)", time: "07:50" },
];

export const importDependency = {
  total: 82.3,
  year: "2024년 기준",
  breakdown: [
    { label: "중국", value: 54.1, color: "#2f5adb" },
    { label: "인도네시아", value: 12.8, color: "#22c55e" },
    { label: "호주", value: 8.7, color: "#a855f7" },
    { label: "모잠비크", value: 6.3, color: "#f59e0b" },
    { label: "브라질", value: 5.2, color: "#38bdf8" },
    { label: "기타", value: 12.9, color: "#cbd5e1" },
  ],
};

export const priceTrend = {
  unit: "USD/MT",
  current: 10850,
  changeLabel: "▲ +1.8%",
  series: [
    { date: "2024-07", 리튬: 66000, 니켈: 17500, 흑연: 1050 },
    { date: "2024-08", 리튬: 62000, 니켈: 17800, 흑연: 1080 },
    { date: "2024-09", 리튬: 58000, 니켈: 16900, 흑연: 1100 },
    { date: "2024-10", 리튬: 54000, 니켈: 16500, 흑연: 1120 },
    { date: "2024-11", 리튬: 44000, 니켈: 16200, 흑연: 1150 },
    { date: "2024-12", 리튬: 40000, 니켈: 16000, 흑연: 1180 },
    { date: "2025-01", 리튬: 38500, 니켈: 16400, 흑연: 1190 },
    { date: "2025-02", 리튬: 33000, 니켈: 16700, 흑연: 1200 },
    { date: "2025-03", 리튬: 31500, 니켈: 16600, 흑연: 1210 },
    { date: "2025-04", 리튬: 29500, 니켈: 16550, 흑연: 1225 },
    { date: "2025-05", 리튬: 20500, 니켈: 16680, 흑연: 1235 },
    { date: "2025-06", 리튬: 11800, 니켈: 16700, 흑연: 1240 },
    { date: "2025-07", 리튬: 10850, 니켈: 16720, 흑연: 1245 },
  ],
};

export interface SupplierRiskRow {
  name: string;
  country: string;
  flag: string;
  material: string;
  supplyRatio: number;
  level: RiskLevel;
  score: number;
  factor: string;
}

export const supplierRisks: SupplierRiskRow[] = [
  { name: "Ganfeng Lithium Co.", country: "중국", flag: "🇨🇳", material: "리튬(탄산리튬)", supplyRatio: 23.5, level: "경고", score: 78, factor: "환경 규제 강화, 생산 차질" },
  { name: "PT Vale Indonesia", country: "인도네시아", flag: "🇮🇩", material: "니켈(황산니켈)", supplyRatio: 18.7, level: "주의", score: 62, factor: "수출 허가 지연, 내수 정책" },
  { name: "Shanshan Technology", country: "중국", flag: "🇨🇳", material: "흑연(구형흑연)", supplyRatio: 15.2, level: "경고", score: 74, factor: "통관 지연, 수요 증가" },
  { name: "Mineral Resources Ltd.", country: "호주", flag: "🇦🇺", material: "리튬(스포듬민)", supplyRatio: 11.8, level: "주의", score: 58, factor: "기상 영향, 선적 지연" },
  { name: "Coral Bay Nickel Corp.", country: "필리핀", flag: "🇵🇭", material: "니켈(니켈광)", supplyRatio: 8.6, level: "정상", score: 34, factor: "운영 안정적" },
];

export const quickActions = [
  { title: "ERP 영향 분석", desc: "리스크 이벤트가 재고/원가/납기에 미치는 영향을 분석합니다.", color: "emerald" },
  { title: "브리핑 생성", desc: "주요 리스크 요약과 인사이트를 브리핑 문서로 생성합니다.", color: "blue" },
  { title: "파일 업로드", desc: "공급망 데이터, 리스크 리포트 등을 업로드합니다.", color: "violet" },
];

export const dataStatus = [
  { label: "시장 데이터", time: "10분 전", ok: true },
  { label: "공급업체 데이터", time: "1시간 전", ok: true },
  { label: "물류 데이터", time: "30분 전", ok: true },
  { label: "ERP 데이터", time: "2시간 전", ok: false },
];

// ---------- Risk Monitoring ----------

export interface HotspotItem {
  name: string;
  issue: string;
  level: RiskLevel;
  lat: number;
  lon: number;
  levelDot: "낮음" | "보통" | "높음" | "매우 높음";
  material: "리튬" | "니켈" | "흑연" | "코발트";
  newsSummary: string;
}

export const hotspots: HotspotItem[] = [
  {
    name: "유럽 (EU)",
    issue: "정책 변화",
    level: "경고",
    lat: 50.1,
    lon: 10.5,
    levelDot: "높음",
    material: "니켈",
    newsSummary: "EU 배터리 원자재 공급망 실사 규정 초안 공개. 니켈·리튬 공급망 실사 의무화로 컴플라이언스 부담 증가 전망.",
  },
  {
    name: "우크라이나",
    issue: "지정학적 리스크",
    level: "심각",
    lat: 48.4,
    lon: 31.2,
    levelDot: "매우 높음",
    material: "리튬",
    newsSummary: "동부 전선 교전 격화로 인근 물류·에너지 인프라 피해 우려. 현지 리튬 개발 프로젝트 일정 지연 가능성.",
  },
  {
    name: "중국",
    issue: "수출 규제",
    level: "심각",
    lat: 35.9,
    lon: 104.2,
    levelDot: "매우 높음",
    material: "흑연",
    newsSummary: "흑연 제품 수출 통제 강화 조치 발표. 흑연 음극재 수출 허가제 전환으로 글로벌 공급 차질 우려.",
  },
  {
    name: "DRC",
    issue: "운송/안보 리스크",
    level: "경고",
    lat: -4.0,
    lon: 21.8,
    levelDot: "높음",
    material: "코발트",
    newsSummary: "동부 지역 무장 충돌로 코발트 운송 차질. 주요 광산 인근 물류 경로 안전 우려 지속.",
  },
  {
    name: "호주",
    issue: "광산 차질",
    level: "경고",
    lat: -25.3,
    lon: 133.8,
    levelDot: "높음",
    material: "리튬",
    newsSummary: "WA 지역 사이클론으로 리튬 광산 운영 일시 중단. 필바라 지역 선적 일정 차질 예상.",
  },
  {
    name: "칠레",
    issue: "수자원 부족",
    level: "주의",
    lat: -23.5,
    lon: -68.5,
    levelDot: "보통",
    material: "리튬",
    newsSummary: "북부 아타카마 지역 수자원 부족 심화. 리튬 브라인 생산량 제한 조치 검토 중.",
  },
];

export const monitoringPrices = [
  { material: "리튬 (Li₂CO₃)", price: 10850, unit: "USD/MT", changeLabel: "▲ 1.8%", up: true, score: 72, level: "높음" as const },
  { material: "니켈 (Ni)", price: 16720, unit: "USD/MT", changeLabel: "▼ 0.7%", up: false, score: 58, level: "주의" as const },
  { material: "흑연 (Natural Graphite)", price: 1245, unit: "USD/MT", changeLabel: "▲ 2.3%", up: true, score: 68, level: "경고" as const },
];

export interface TimelineEvent {
  time: string;
  flag: string;
  title: string;
  tags: string[];
  level: RiskLevel | "매우 높음";
}

export const eventTimeline: TimelineEvent[] = [
  { time: "10:30", flag: "🇨🇳", title: "중국, 흑연 제품 수출 통제 강화 조치 발표", tags: ["흑연", "중국"], level: "매우 높음" },
  { time: "09:15", flag: "🇦🇺", title: "호주 WA 지역 사이클론으로 광산 운영 일시 중단", tags: ["리튬", "호주"], level: "경고" },
  { time: "08:40", flag: "🇪🇺", title: "EU, 배터리 원자재 공급망 실사 규정 초안 공개", tags: ["리튬", "니켈", "EU"], level: "경고" },
  { time: "07:50", flag: "🇨🇩", title: "DRC 동부 지역 무장 충돌로 코발트 운송 차질", tags: ["코발트", "DRC"], level: "경고" },
  { time: "07:20", flag: "🇮🇩", title: "인도네시아 니켈 광산 로열티 인상 검토", tags: ["니켈", "인도네시아"], level: "주의" },
];

export const riskDrivers = [
  { icon: "ship", title: "수출 규제", desc: "중국의 흑연·갈륨 등 전략 자원 수출 통제로 글로벌 공급 불확실성 증가", materials: ["흑연", "리튬", "갈륨"] },
  { icon: "pickaxe", title: "광산 차질", desc: "호주 사이클론, 필리핀/DRC 광산 사고 등으로 생산 차질 지속", materials: ["리튬", "구리"] },
  { icon: "landmark", title: "정책 변화", desc: "EU 공급망 실사법, 인니 니켈 로열티 인상 등 규제 강화 추세", materials: ["니켈", "리튬", "코발트"] },
  { icon: "waves", title: "물류 지연", desc: "홍해 지정학 리스크, 파나마 운하 수위 저하 등 해상 운임 상승", materials: ["전체", "리튬"] },
];

export const monitoringPriceSeries = [
  { date: "06-08", 리튬: 10500, 니켈: 16500, 흑연: 1180 },
  { date: "06-15", 리튬: 10600, 니켈: 16400, 흑연: 1190 },
  { date: "06-22", 리튬: 10700, 니켈: 16550, 흑연: 1200 },
  { date: "06-29", 리튬: 10750, 니켈: 16600, 흑연: 1220 },
  { date: "07-06", 리튬: 10850, 니켈: 16720, 흑연: 1245 },
];

export const monitoringNewsFeed = [
  { time: "10:30", level: "매우 높음" as const, title: "중국, 흑연 제품 수출 통제 강화 조치 발표", desc: "흑연 음극제 및 관련 기술 수출 허가제 전환, 즉시 시행...", source: "로이터" },
  { time: "09:15", level: "높음" as const, title: "호주 WA 지역 사이클론으로 리튬 광산 운영 중단", desc: "필바라 지역 강풍과 폭우로 일부 광산 가동 일시 중단...", source: "Bloomberg" },
  { time: "08:00", level: "주의" as const, title: "인도네시아, 니켈 광석 FOB 상한 조정", desc: "니켈 원석 물량기준 1%p 상향 조정 (15%p 인상)...", source: "Reuters" },
];

export const materialRiskSummary = [
  { material: "리튬 (Li₂CO₃)", score: 72, prevDelta: 4, issue: "호주 광산 차질, 중국 세관 변화" },
  { material: "니켈 (Ni)", score: 58, prevDelta: -2, issue: "인니 정책 변화, 수요 둔화" },
  { material: "흑연 (Natural Graphite)", score: 68, prevDelta: 6, issue: "중국 수출 규제 강화" },
];

// ---------- ERP Impact ----------

export const erpKpis = [
  { label: "영향 자재 수", value: "48", total: "/ 326", level: "높음" as const, delta: 5 },
  { label: "영향 제품 수", value: "136", total: "/ 842", level: "주의" as const, delta: 11 },
  { label: "공급사 의존도 높은 자재", value: "22", total: "/ 48", level: "주의" as const, delta: 3 },
  { label: "재고 30일 이하 자재", value: "18", total: "/ 48", level: "높음" as const, delta: 4 },
  { label: "계약 60일 이내 만료", value: "15", total: "/ 48", level: "주의" as const, delta: 2 },
  { label: "평균 내부 영향도", value: "67", total: "/ 100", level: "주의" as const, delta: 6 },
];

export const impactDistribution = [
  { label: "높음 (80~100)", value: 14, pct: 29, color: "#dc2626" },
  { label: "주의 (50~79)", value: 20, pct: 42, color: "#f59e0b" },
  { label: "보통 (20~49)", value: 10, pct: 21, color: "#38bdf8" },
  { label: "낮음 (0~19)", value: 4, pct: 8, color: "#94a3b8" },
];

export const heatmapMaterials = ["리튬 (Li)", "니켈 (Ni)", "흑연 (Graphite)", "코발트 (Co)", "망간 (Mn)", "구리 (Cu)"];
export const heatmapProducts = ["음극재", "전해질", "분리막", "모듈", "팩"];
export const heatmapData = [
  [92, 70, 40, 20, 10],
  [88, 55, 30, 15, 8],
  [76, 60, 25, 12, 6],
  [84, 45, 20, 10, 5],
  [58, 30, 15, 8, 4],
  [81, 65, 35, 18, 9],
];

export const erpFactorSummary = [
  { icon: "link", label: "공급사 의존도", value: "72", total: "/100", level: "높음" as const, desc: "평균 상위 1개사 의존도" },
  { icon: "box", label: "재고 소진일", value: "38", unit: "일", level: "주의" as const, desc: "평균 재고 확보 기간" },
  { icon: "file", label: "계약 만료 리스크", value: "15", total: "/48", level: "주의" as const, desc: "60일 이내 만료 자재 수" },
  { icon: "clock", label: "리드타임 지연", value: "1.8", unit: "주", level: "주의" as const, desc: "평균 지연 예상 기간" },
];

export interface ErpMaterialRow {
  code: string;
  name: string;
  material: string;
  product: string;
  supplier: string;
  flag: string;
  stockDays: number;
  contractExpiry: string;
  contractDays: number;
  impact: number;
  level: RiskLevel;
}

export const erpMaterialRows: ErpMaterialRow[] = [
  { code: "RM-LI-006", name: "수산화리튬 (LiOH)", material: "리튬 (Li)", product: "양극재, 전해질", supplier: "Ganfeng Lithium Co.", flag: "🇨🇳", stockDays: 32, contractExpiry: "2025-08-15", contractDays: 38, impact: 92, level: "경고" },
  { code: "RM-NI-011", name: "황산니켈 (NiSO4)", material: "니켈 (Ni)", product: "양극재", supplier: "PT Vale Indonesia", flag: "🇮🇩", stockDays: 21, contractExpiry: "2025-08-02", contractDays: 25, impact: 88, level: "경고" },
  { code: "RM-GR-002", name: "인조흑연 (SCG)", material: "흑연 (Graphite)", product: "음극재", supplier: "Shanshan Technology", flag: "🇨🇳", stockDays: 45, contractExpiry: "2025-09-10", contractDays: 64, impact: 76, level: "주의" },
  { code: "RM-CO-004", name: "황산코발트 (CoSO4)", material: "코발트 (Co)", product: "양극재", supplier: "Glencore", flag: "🇨🇭", stockDays: 18, contractExpiry: "2025-07-25", contractDays: 17, impact: 84, level: "경고" },
  { code: "RM-MN-003", name: "황산망간 (MnSO4)", material: "망간 (Mn)", product: "양극재", supplier: "Eramet", flag: "🇫🇷", stockDays: 61, contractExpiry: "2025-10-05", contractDays: 89, impact: 58, level: "주의" },
  { code: "RM-CU-007", name: "전해동박 (Cu Foil)", material: "구리 (Cu)", product: "동박", supplier: "SK nexilis", flag: "🇰🇷", stockDays: 28, contractExpiry: "2025-07-30", contractDays: 22, impact: 81, level: "경고" },
  { code: "RM-LI-007", name: "탄산리튬 (Li2CO3)", material: "리튬 (Li)", product: "양극재, 전해질", supplier: "Tianqi Lithium", flag: "🇨🇳", stockDays: 55, contractExpiry: "2025-09-20", contractDays: 74, impact: 63, level: "주의" },
  { code: "RM-ELE-009", name: "LiPF6", material: "리튬 (Li)", product: "전해질", supplier: "Stella Chemifa", flag: "🇯🇵", stockDays: 12, contractExpiry: "2025-07-18", contractDays: 10, impact: 90, level: "경고" },
];

// ---------- Data Management ----------

export interface UploadFile {
  name: string;
  type: string;
  size: string;
  progress: number;
  status: "완료" | "검증중" | "대기";
}

export const uploadFiles: UploadFile[] = [
  { name: "자재 마스터.xlsx", type: "XLSX", size: "2.4MB", progress: 100, status: "완료" },
  { name: "BOM.xlsx", type: "XLSX", size: "1.8MB", progress: 100, status: "완료" },
  { name: "구매 이력.csv", type: "CSV", size: "5.6MB", progress: 72, status: "검증중" },
  { name: "재고.xlsx", type: "XLSX", size: "1.2MB", progress: 0, status: "대기" },
  { name: "계약.xlsx", type: "XLSX", size: "3.1MB", progress: 0, status: "대기" },
  { name: "입고 이력.csv", type: "CSV", size: "4.7MB", progress: 0, status: "대기" },
];

export interface ValidationRow {
  file: string;
  type: string;
  rows: number;
  result: "성공" | "검증 중" | "경고" | "오류";
  warnings: number;
  errors: number;
  duplicates: number;
  status: string;
}

export const validationRows: ValidationRow[] = [
  { file: "자재 마스터.xlsx", type: "자재 마스터", rows: 12458, result: "성공", warnings: 1, errors: 0, duplicates: 3, status: "업로드 완료" },
  { file: "BOM.xlsx", type: "BOM", rows: 45231, result: "성공", warnings: 2, errors: 0, duplicates: 8, status: "업로드 완료" },
  { file: "구매 이력.csv", type: "구매 이력", rows: 125894, result: "검증 중", warnings: 4, errors: 1, duplicates: 15, status: "검증 중 (72%)" },
  { file: "재고.xlsx", type: "재고", rows: 32109, result: "경고", warnings: 3, errors: 0, duplicates: 7, status: "대기" },
  { file: "계약.xlsx", type: "계약", rows: 2341, result: "경고", warnings: 6, errors: 0, duplicates: 2, status: "대기" },
  { file: "입고 이력.csv", type: "입고 이력", rows: 98765, result: "오류", warnings: 1, errors: 3, duplicates: 9, status: "대기" },
];

export const schemaMapping = [
  { target: "자재 코드 (Material Code)", desc: "자재의 고유 식별 코드", mapped: "Material_Code", sample: "MAT-00001234", required: true, status: "매핑됨" },
  { target: "자재명 (Material Name)", desc: "자재명", mapped: "Material_Name", sample: "Lithium Hydroxide", required: true, status: "매핑됨" },
  { target: "자재 유형 (Material Type)", desc: "원자재/중간재/완제품 구분", mapped: "Material_Type", sample: "원자재", required: true, status: "매핑됨" },
];

export const importSummary = [
  { label: "자재 마스터", count: "12,458" },
  { label: "BOM", count: "45,231" },
  { label: "구매 이력", count: "125,894" },
  { label: "재고", count: "32,109" },
  { label: "계약", count: "2,341" },
  { label: "입고 이력", count: "98,765" },
];

export const dataIssues = [
  { level: "오류", label: "오류 4건", desc: "데이터 수정 필요" },
  { level: "경고", label: "경고 16건", desc: "값 확인 권장" },
  { level: "오류", label: "중복 44건", desc: "중복 데이터 확인 필요" },
];

// ---------- Briefing ----------

export const briefingSummary = {
  date: "2025년 7월 8일 (화)",
  time: "08:30",
  text: "중국의 리튬 수출 통제 강화 가능성과 인도네시아 니켈 광석 수출 쿼터 조정이 주요 리스크로 부상했습니다. 리튬 가격은 단기 급등 가능성이 있으며, 니켈은 중기 공급 제약이 예상됩니다. 대체 공급원 확보와 재고 전략 재검토가 필요합니다.",
  score: 72,
  level: "높음" as const,
  materials: "리튬, 니켈, 흑연",
  suppliers: "12 개사",
  period: "1~3 개월",
};

export const topRisks = [
  { rank: 1, title: "중국 리튬 수출 통제 강화 가능성", score: 85, level: "검토 필요", period: "1~2개월" },
  { rank: 2, title: "인도네시아 니켈 광석 수출 쿼터 조정", score: 78, level: "검토 필요", period: "2~4개월" },
  { rank: 3, title: "흑연 전극봉 가격 급등 지속", score: 61, level: "검증 완료", period: "1~3개월" },
];

export const affectedItems = [
  { name: "리튬 (탄산리튬)", score: 85, level: "높음" },
  { name: "니켈 (황산니켈)", score: 78, level: "높음" },
  { name: "흑연 (구형흑연)", score: 61, level: "보통" },
  { name: "코발트 (황산코발트)", score: 45, level: "보통" },
  { name: "망간 (황산망간)", score: 32, level: "낮음" },
];

export const recommendedActions = [
  { priority: 1, action: "중국 외 리튬 대체 공급선 확보 가속화", material: "리튬", effect: "리스크 -25%", status: "검토 필요" },
  { priority: 2, action: "니켈 장기 계약 물량 확대 (인도네시아 외)", material: "니켈", effect: "리스크 -18%", status: "검토 필요" },
  { priority: 3, action: "전략 재고 상향 조정 (리튬, 니켈)", material: "리튬, 니켈", effect: "서비스 수준 +12%", status: "검토 필요" },
  { priority: 4, action: "흑연 공급 다변화 및 계약 조건 재협상", material: "흑연", effect: "리스크 -10%", status: "검증 완료" },
  { priority: 5, action: "정책/규제 모니터링 강화 (중국, 인도네시아)", material: "리튬, 니켈", effect: "조기경보 정확도 +20%", status: "검증 완료" },
];

export const scenarioComparison = {
  categories: ["총 구매 비용 (3M)", "납기 준수율", "서비스 수준", "재고 회전율"],
  base: [0, 0, 0, 0],
  risk: [8.7, -6.3, -4.1, -7.8],
  labels: ["+8.7% (125억)", "-6.3% (81.2%)", "-4.1% (92.3%)", "-7.8% (4.2회)"],
};

export const evidenceList = [
  { title: "중국 상무부, 리튬 수출 관리 강화 검토 착수", date: "2025.07.07", source: "Reuters", status: "검증 완료" },
  { title: "인도네시아 에너지부, 니켈 광석 수출 쿼터 재조정 발표", date: "2025.07.06", source: "Antara News", status: "검토 필요" },
  { title: "Fastmarkets 리튬 가격 주간 리뷰 (7/1~7/7)", date: "2025.07.07", source: "Fastmarkets", status: "검증 완료" },
  { title: "S&P Global Battery Materials Outlook (Q3 2025)", date: "2025.07.05", source: "S&P Global", status: "검증 완료" },
];

export const briefingDoc = {
  title: "주간 SCM 리스크 브리핑 (2025-07-08)",
  createdAt: "2025-07-08 08:30",
  creator: "SCM Risk Center AI",
  target: "구매기획팀, SCM팀, 경영진",
  pages: "12 페이지",
  contents: [
    "Executive Summary",
    "주요 리스크 및 영향 분석",
    "시나리오 분석 결과",
    "권장 대응 조치",
    "모니터링 지표 및 알림",
    "부록: 데이터 및 출처",
  ],
};
