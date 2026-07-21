# 네이밍 사전 — Physical Name(영문) : Logical Name(한글)

> `src/` 전체(.ts/.tsx)를 스캔해 작성한 파일·컴포넌트·함수/훅·타입의 영문(physical)-한글(logical) 대응표다.
> `*.module.css`, `tokens.css`, `index.css` 등 스타일 파일은 export되는 JS 심볼이 없어 범위에서 제외했다.
> 코드가 바뀌면 이 문서도 같이 갱신해야 정확하다 — 스냅샷 문서다.

## 1. 요약 표 (파일 단위)

| 파일 경로 (physical) | 논리명 (logical) |
|---|---|
| `App.tsx` | 앱 루트 컴포넌트 — AuthProvider로 라우트 트리 감싸기 |
| `main.tsx` | 앱 진입점 — ReactDOM 렌더링, BrowserRouter 연결 |
| `api/auth.api.ts` | 인증(로그인/회원가입) mock API |
| `api/executive.api.ts` | 3계층 경영진 대시보드 mock API |
| `api/planning.api.ts` | 2계층 경영기획팀 대시보드 mock API |
| `api/public.api.ts` | 비로그인 공개 대시보드 mock API |
| `api/purchasing.api.ts` | 1계층 구매팀 대시보드 mock API — risk_event 원천 데이터 |
| `api/types.ts` | 전 화면 공용 API 응답 타입 정의 |
| `app/routes.tsx` | 최상위 라우트 정의 및 로그인 가드 |
| `components/layout/Breadcrumb.tsx` | 브레드크럼(탐색 위치 안내) |
| `components/layout/Footer.tsx` | 공통 하단 푸터 |
| `components/layout/Header.tsx` | 공통 상단 헤더(로고 = 홈 링크) |
| `components/layout/SideNav.tsx` | 사이드 메뉴 내비게이션 |
| `components/layout/SkipLink.tsx` | 본문 바로가기 링크(접근성) |
| `components/ui/ConfidenceBadge.tsx` | 리스크 판단 신뢰도 라벨 배지 |
| `components/ui/RiskGradeBadge.tsx` | 리스크 등급 배지 |
| `features/auth/components/AuthTabs.tsx` | 로그인/권한 신청 탭 토글 |
| `features/auth/components/LoginForm.tsx` | 로그인 폼 |
| `features/auth/components/PendingApprovalScreen.tsx` | 승인 대기 보안 락 화면 |
| `features/auth/components/SecurityBadge.tsx` | 보안 안내 배지(IP 제어/OTP) |
| `features/auth/components/SignupForm.tsx` | 권한 신청(회원가입) 폼 |
| `features/auth/pages/AuthPage.tsx` | 로그인/회원가입 통합 페이지 |
| `features/executive/components/CumulativeRiskKpi.tsx` | 누적 리스크 탐지 KPI 3박스 |
| `features/executive/components/EnterpriseRiskSummary.tsx` | 전사 리스크 요약 리스트 |
| `features/executive/components/SavingsSimulation.tsx` | 예산 절감 시뮬레이션 카드 |
| `features/executive/pages/ExecutiveDashboardPage.tsx` | 3계층 경영진 대시보드 페이지 |
| `features/planning/components/ComparisonChart.tsx` | 사업부별 리스크 노출도 비교 차트 |
| `features/planning/components/KpiSummaryCards.tsx` | KPI 요약 카드 |
| `features/planning/components/VendorRiskHistory.tsx` | 협력사 리스크 이력 및 탐색 리스트 |
| `features/planning/pages/PlanningDashboardPage.tsx` | 2계층 경영기획팀 대시보드 페이지 |
| `features/public/components/AiPriorityList.tsx` | AI 기반 권고 조치 리스트 |
| `features/public/components/GlobalRiskBoard.tsx` | 글로벌 리스크 관제 맵(리스트형) |
| `features/public/components/MaterialPriceTrend.tsx` | 원자재 가격 추이 차트 |
| `features/public/components/SupplyNewsFeed.tsx` | 실시간 뉴스 속보 |
| `features/public/pages/PublicDashboardPage.tsx` | 비로그인 공개 대시보드 페이지 |
| `features/purchasing/components/AlertsPanel.tsx` | 주요 알림 및 빠른 작업 패널 |
| `features/purchasing/components/ErpImpactPanel.tsx` | ERP 영향 자재 재고 계약 분석 패널 |
| `features/purchasing/components/KpiSummaryPanel.tsx` | 상단 KPI 요약 패널 |
| `features/purchasing/components/MaterialRiskStatusPanel.tsx` | 원자재 공급사 리스크 현황 패널 |
| `features/purchasing/components/PurchasePriorityPanel.tsx` | 구매 대응 우선순위 패널 |
| `features/purchasing/pages/PurchasingDashboardPage.tsx` | 1계층 구매팀 대시보드 페이지 |
| `lib/AuthContext.ts` | 인증 상태 Context 객체 정의 |
| `lib/AuthProvider.tsx` | 인증 상태 Provider 컴포넌트 |
| `lib/riskEventId.ts` | risk_event_id 날짜 파싱 유틸 |
| `lib/useAuthState.ts` | 인증 상태 접근 훅 |

## 2. 상세 — 파일별 export 목록

각 파일에서 실제로 `export`된 심볼만 담았다(내부 전용 `interface XxxProps` 등은 export되지 않으므로 제외).

### `App.tsx`
| physical | logical | 역할 |
|---|---|---|
| `App` (default export) | 앱 루트 컴포넌트 | `AuthProvider`로 `AppRoutes`를 감싸 렌더링 |

### `api/auth.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `login` | 로그인 함수 | 이메일/비밀번호로 로그인 시도 — 테스트 계정 3종(구매팀/경영기획팀/경영진) 또는 PENDING 테스트 계정에 따라 성공/승인대기 응답 반환. DEV/DEMO 전용 |
| `signup` | 회원가입(권한 신청) 함수 | 입력값을 받아 항상 PENDING 상태 응답 생성 |

### `api/executive.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `fetchExecutiveDashboard` | 3계층 대시보드 조회 함수 | 누적 리스크 KPI / 절감 시뮬레이션 / 전사 리스크 요약 반환. `enterprise_risk_summary`는 2계층 데이터에서 파생 |

### `api/planning.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `fetchPlanningDashboard` | 2계층 대시보드 조회 함수 | KPI 요약 / 사업부별 노출도 / 협력사 리스크 이력을 1계층 `risk_event`에서 파생해 반환 |

### `api/public.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `fetchGlobalRiskBoard` | 글로벌 리스크 관제 맵 조회 함수 | `risk_event` 배열을 요약 리스트 항목으로 변환 |
| `fetchAiRecommendations` | AI 권고 조치 조회 함수 | 등급 기반 일반 권고 문구 생성(ERP 내부 상세는 미노출) |
| `fetchMaterialPriceTrends` | 원자재 가격 추이 조회 함수 | 자재별 합성 가격 지수(기준일=100) 시계열 반환 |
| `fetchNewsFeed` | 실시간 뉴스 속보 조회 함수 | `risk_event`를 `risk_event_id` 기준 날짜 최신순으로 정렬 |

### `api/purchasing.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `fetchRiskEvents` | 리스크 이벤트 목록 조회 함수 | 1계층 mock `risk_event` 배열 반환 — 다른 계층 API들이 공유하는 원천 데이터 |

### `api/types.ts`
| physical | logical | 역할 |
|---|---|---|
| `ConfidenceLabel` *(재노출)* | 신뢰도 라벨 타입 | `'확정' \| '참고' \| '경고'` — 원본은 `components/ui/ConfidenceBadge.tsx` |
| `RiskGrade` *(재노출)* | 리스크 등급 타입 | `'정상' \| '주의' \| '심각'` — 원본은 `components/ui/RiskGradeBadge.tsx` |
| `MarketContext` | 시황 컨텍스트 타입 | risk_event의 출처/자재/이벤트 요약 |
| `ErpView` | ERP 관점 타입 | 안전재고일수/자재코드/대체 조달처 |
| `QualityCheck` | 품질 검증 타입 | 검증 상태/기준/사유 |
| `RagView` | RAG(계약) 관점 타입 | 계약조항 요약/협상 포인트 |
| `OutputArtifacts` | 산출물 메타 타입 | 렌더 모드/파일 URL/JSON 폴백 여부 |
| `RiskEvent` | 리스크 이벤트 타입 | 1계층 원천 스키마(CLAUDE.md 기준) |
| `OrgTier` | 조직 계층 타입 | `'purchasing' \| 'planning' \| 'executive'` |
| `LoginRequest` | 로그인 요청 타입 | 이메일/비밀번호 |
| `LoginFormValues` | 로그인 폼 값 타입 | `LoginRequest` + 로그인 상태 유지 여부(UI 로컬 상태) |
| `LoginSuccessResponse` | 로그인 성공 응답 타입 | 액세스 토큰/조직계층/상태 |
| `LoginPendingErrorResponse` | 로그인 승인대기 응답 타입 | 에러 코드/메시지 |
| `LoginResponse` | 로그인 응답 유니언 타입 | 성공 또는 승인대기 응답 |
| `SignupFormValues` | 회원가입 폼 값 타입 | 성명/이메일/비밀번호/조직계층(Figma 폼 필드 기준) |
| `SignupRequest` | 회원가입 요청 타입 | `SignupFormValues` + 소속 회사명(api 계층 고정값) |
| `SignupResponse` | 회원가입 응답 타입 | 사용자ID/상태/메시지 |
| `GlobalRiskBoardItem` | 글로벌 리스크 관제 맵 항목 타입 | 자재/등급/신뢰도/이벤트 요약 |
| `AiRecommendation` | AI 권고 조치 항목 타입 | 자재/등급/신뢰도/권고 문구 |
| `MaterialPricePoint` | 원자재 가격 포인트 타입 | 날짜/가격지수 |
| `MaterialPriceSeries` | 원자재 가격 시계열 타입 | 자재명/단위/포인트 배열 |
| `NewsFeedItem` | 뉴스 속보 항목 타입 | 날짜/자재/출처/헤드라인/신뢰도 |
| `KpiSummaryItem` | KPI 요약 카드 항목 타입 | 라벨/값/단위 |
| `RiskExposureByUnit` | 사업부별 리스크 노출도 타입 | 사업부명/노출도 점수 |
| `VendorRiskHistoryItem` | 협력사 리스크 이력 항목 타입 | 공급사ID/명/90일 이력 건수/최신 등급·신뢰도 |
| `PlanningDashboardResponse` | 2계층 대시보드 응답 타입 | kpi_summary + risk_exposure_by_unit + vendor_risk_history |
| `CumulativeRiskKpi` | 누적 리스크 KPI 타입 | 탐지/응답 건수·비율, 심각 건수, 평균 대응 소요 |
| `SavingsSimulation` | 절감 시뮬레이션 타입 | is_simulation(항상 true)/예상 절감액/가정 |
| `EnterpriseRiskSummaryItem` | 전사 리스크 요약 항목 타입 | 사업부명/노출도 점수/추세 |
| `ExecutiveDashboardResponse` | 3계층 대시보드 응답 타입 | cumulative_risk_kpi + savings_simulation + enterprise_risk_summary |

### `app/routes.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AppRoutes` | 최상위 라우트 컴포넌트 | `/`, `/auth`, `/purchasing`, `/planning`, `/executive` 라우트 정의. 뒤 3개는 내부 `RequireAuth`(비export) 가드 적용 |

### `components/layout/Breadcrumb.tsx`
| physical | logical | 역할 |
|---|---|---|
| `BreadcrumbItem` | 브레드크럼 항목 타입 | label/href(선택) |
| `Breadcrumb` | 브레드크럼 컴포넌트 | 탐색 위치 안내, 마지막 항목은 링크 없이 현재 페이지로 표시 |

### `components/layout/Footer.tsx`
| physical | logical | 역할 |
|---|---|---|
| `Footer` | 공통 푸터 컴포넌트 | 모든 화면 하단에 운영기관 식별 정보 표시 |

### `components/layout/Header.tsx`
| physical | logical | 역할 |
|---|---|---|
| `Header` | 공통 헤더 컴포넌트 | 좌측 로고(클릭 시 "/" 이동, sticky 상단 고정) + 우측 액션 슬롯(children) |

### `components/layout/SideNav.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SideNavItem` | 사이드 메뉴 항목 타입 | label/href |
| `SideNav` | 사이드 메뉴 컴포넌트 | 하위 화면이 많은 대시보드용 좌측 내비게이션(`Link` 기반) |

### `components/layout/SkipLink.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SkipLink` | 본문 바로가기 링크 컴포넌트 | 스크린리더/키보드 접근성용 — 평소 숨김, 포커스 시 노출 |

### `components/ui/ConfidenceBadge.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ConfidenceLabel` | 신뢰도 라벨 타입 | `'확정' \| '참고' \| '경고'` |
| `ConfidenceBadge` | 신뢰도 라벨 배지 컴포넌트 | Seq 20 — 전 화면 공통 필수 표시 |

### `components/ui/RiskGradeBadge.tsx`
| physical | logical | 역할 |
|---|---|---|
| `RiskGrade` | 리스크 등급 타입 | `'정상' \| '주의' \| '심각'` |
| `RiskGradeBadge` | 리스크 등급 배지 컴포넌트 | 등급별 색상(`--color-risk-*`) 배지 |

### `features/auth/components/AuthTabs.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AuthTabKey` | 인증 탭 키 타입 | `'login' \| 'signup'` |
| `AuthTabs` | 로그인/권한 신청 탭 토글 컴포넌트 | Seq 33 — 새로고침 없이 전환, 슬라이딩 인디케이터 |

### `features/auth/components/LoginForm.tsx`
| physical | logical | 역할 |
|---|---|---|
| `LoginForm` | 로그인 폼 컴포넌트 | 사내 이메일/비밀번호/로그인 상태 유지/비밀번호 초기화 신청 링크 |

### `features/auth/components/PendingApprovalScreen.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PendingApprovalScreen` | 승인 대기 보안 락 화면 컴포넌트 | Seq 35 — "처음으로" 버튼으로 로그인 화면 복귀 |

### `features/auth/components/SecurityBadge.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SecurityBadge` | 보안 안내 배지 컴포넌트 | Seq 36 — IP 접근 제어 및 2차 인증(OTP) 활성화 구간 안내 |

### `features/auth/components/SignupForm.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SignupForm` | 권한 신청(회원가입) 폼 컴포넌트 | 임직원 성명/이메일/비밀번호 + 3계층 접근권한 라디오(설명 포함) |

### `features/auth/pages/AuthPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AuthPage` | 로그인/회원가입 통합 페이지 | 좌:우 5:6 스플릿스크린. 로그인 성공 시 해당 계층 대시보드로 이동, PENDING 시 락 화면 전환 |

### `features/executive/components/CumulativeRiskKpi.tsx`
| physical | logical | 역할 |
|---|---|---|
| `CumulativeRiskKpi` | 누적 리스크 탐지 KPI 컴포넌트 | 이번 분기 탐지 건수/심각 등급 건수/평균 대응 소요 3박스. ⚠️ `api/types.ts`의 동명 타입 `CumulativeRiskKpi`와 이름은 같지만 별개 심볼(컴포넌트 vs 타입) — import 시 혼동 주의 |

### `features/executive/components/EnterpriseRiskSummary.tsx`
| physical | logical | 역할 |
|---|---|---|
| `EnterpriseRiskSummary` | 전사 리스크 요약 컴포넌트 | 2계층 통계를 압축한 리스트, 상승/유지/하락 추세 표시 |

### `features/executive/components/SavingsSimulation.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SavingsSimulation` | 예산 절감 시뮬레이션 컴포넌트 | "시뮬레이션 값" 문구 필수 표기(비예측 원칙). ⚠️ `api/types.ts`의 동명 타입 `SavingsSimulation`과 이름은 같지만 별개 심볼 |

### `features/executive/pages/ExecutiveDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ExecutiveDashboardPage` | 3계층 경영진 대시보드 페이지 | 상단 KPI 3박스 → 하단 좌우 분할(절감 시뮬레이션/전사 요약) |

### `features/planning/components/ComparisonChart.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ComparisonChart` | 핵심 시각화 및 비교 차트 컴포넌트 | 사업부별 리스크 노출도 막대그래프(Recharts, 단일 계열) |

### `features/planning/components/KpiSummaryCards.tsx`
| physical | logical | 역할 |
|---|---|---|
| `KpiSummaryCards` | KPI 요약 카드 컴포넌트 | `kpi_summary` 배열을 카드로 렌더링 |

### `features/planning/components/VendorRiskHistory.tsx`
| physical | logical | 역할 |
|---|---|---|
| `VendorRiskHistory` | 협력사 리스크 이력 및 탐색 컴포넌트 | `vendor_risk_history` 리스트, 등급/신뢰도 배지 포함 |

### `features/planning/pages/PlanningDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PlanningDashboardPage` | 2계층 경영기획팀 대시보드 페이지 | 좌측 사이드바 + 단일 컬럼(KPI 카드 → 비교 차트 → 협력사 이력) |

### `features/public/components/AiPriorityList.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AiPriorityList` | AI 기반 권고 조치 리스트 컴포넌트 | 등급(심각>주의>정상) 순 정렬 |

### `features/public/components/GlobalRiskBoard.tsx`
| physical | logical | 역할 |
|---|---|---|
| `GlobalRiskBoard` | 글로벌 리스크 관제 맵 컴포넌트 | 지도 시각화 대신 리스트형 요약(맵 라이브러리 미도입) |

### `features/public/components/MaterialPriceTrend.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialPriceTrend` | 원자재 가격 추이 차트 컴포넌트 | Recharts 라인차트, 합성 지수(기준일=100), 카테고리 팔레트 검증 완료 |

### `features/public/components/SupplyNewsFeed.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SupplyNewsFeed` | 실시간 뉴스 속보 컴포넌트 | risk_event 기반 최신순 뉴스 리스트 |

### `features/public/pages/PublicDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PublicDashboardPage` | 비로그인 공개 대시보드 페이지 | 상단 3계층 탭 + 로그인/회원가입 버튼, 4개 패널 2x2 그리드. 탭 클릭 시 인증 상태에 따라 대시보드 또는 /auth로 이동 |

### `features/purchasing/components/AlertsPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AlertsPanel` | 주요 알림 및 빠른 작업 패널 컴포넌트 | 등급 '심각' 또는 신뢰도 '경고' 항목 우선 노출 |

### `features/purchasing/components/ErpImpactPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ErpImpactPanel` | ERP 영향 자재 재고 계약 분석 패널 컴포넌트 | 재고 소진일수/대체 공급사/품질 검증 결과 |

### `features/purchasing/components/KpiSummaryPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `KpiSummaryPanel` | 상단 KPI 요약 패널 컴포넌트 | 전체/심각/주의/정상 건수 집계 |

### `features/purchasing/components/MaterialRiskStatusPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskStatusPanel` | 원자재 공급사 리스크 현황 패널 컴포넌트 | risk_event 리스트, 등급/신뢰도 배지 포함 |

### `features/purchasing/components/PurchasePriorityPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PurchasePriorityPanel` | 구매 대응 우선순위 패널 컴포넌트 | 등급·재고 소진일 기준 파생 정렬 순위 리스트 |

### `features/purchasing/pages/PurchasingDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PurchasingDashboardPage` | 1계층 구매팀 대시보드 페이지 | 사이드바 + 단일 컬럼 4단 패널 + 우측 알림 패널(Figma 프레임 기준) |

### `lib/AuthContext.ts`
| physical | logical | 역할 |
|---|---|---|
| `AuthContextValue` | 인증 Context 값 타입 | orgTier/signIn/signOut |
| `AuthContext` | 인증 Context 객체 | `AuthProvider`/`useAuthState`가 공유하는 React Context |

### `lib/AuthProvider.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AuthProvider` | 인증 상태 Provider 컴포넌트 | 로그인 성공 시 orgTier를 메모리에만 저장(localStorage 미사용, 새로고침 시 소실) |

### `lib/riskEventId.ts`
| physical | logical | 역할 |
|---|---|---|
| `parseRiskEventDate` | risk_event_id 날짜 파싱 함수 | `'RISK-YYYY-MMDD-NNN'` → `'YYYY-MM-DD'` |

### `lib/useAuthState.ts`
| physical | logical | 역할 |
|---|---|---|
| `useAuthState` | 인증 상태 접근 훅 | `AuthProvider` 내부에서 orgTier/signIn/signOut 제공, 범위 밖 사용 시 예외 발생 |
