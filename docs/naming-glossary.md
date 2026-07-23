# 네이밍 사전 — Physical Name(영문) : Logical Name(한글)

> `src/` 전체(.ts/.tsx)를 스캔해 작성한 파일·컴포넌트·함수/훅·타입의 영문(physical)-한글(logical) 대응표다.
> `*.module.css`, `tokens.css`, `index.css` 등 스타일 파일은 export되는 JS 심볼이 없어 범위에서 제외했다.
> 코드가 바뀌면 이 문서도 같이 갱신해야 정확하다 — 스냅샷 문서다.
> 같은 물리 필드명(예: email, label, material)은 타입이 달라도 동일한 한글 표현을 원칙으로 한다. 단, 물리 필드명은 같지만 논리적 의미가 다른 경우(예: status가 실제 가변 상태값인지, 항상 고정값만 갖는 응답 태그인지 등 문맥상 다른 개념인 경우)는 실제 타입 정의와 사용처를 코드에서 먼저 확인한 뒤, 그 의미에 맞는 수식어를 붙이고 물리 필드명을 괄호로 병기해 검색 가능하게 한다. 타입 설명에는 export된 인터페이스의 모든 필드를 빠짐없이 반영한다(첫 필드 누락 금지).

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
| `components/ui/ConfirmModal.tsx` | 확인/취소 모달 |
| `components/ui/RiskGradeBadge.tsx` | 리스크 등급 배지 |
| `components/ui/ScrollCard/ScrollCard.tsx` | 카드형 UI 공통 컨테이너(스크롤 캡슐화) |
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
| `features/public/components/GlobalRiskBoard.tsx` | 글로벌 리스크 관제 맵(인터랙티브 세계지도) |
| `features/public/components/MaterialPriceDetail.tsx` | 원자재 가격 추이(필터+요약카드+차트) |
| `features/public/components/SupplyNewsFeed.tsx` | 실시간 뉴스 속보 |
| `features/public/pages/PublicDashboardPage.tsx` | 비로그인 공개 대시보드 페이지 |
| `features/purchasing/components/AlertsPanel.tsx` | 주요 알림 및 빠른 작업 패널 |
| `features/purchasing/components/ErpImpactPanel.tsx` | ERP 영향 자재 재고 계약 분석 패널 |
| `features/purchasing/components/KpiSummaryPanel.tsx` | 상단 KPI 요약 패널 |
| `features/purchasing/components/MaterialRiskStatusPanel.tsx` | 원자재 공급사 리스크 현황 패널 |
| `features/purchasing/components/PurchasePriorityPanel.tsx` | 구매 대응 우선순위 패널 |
| `features/purchasing/pages/BriefingDetailPage.tsx` | 1계층 브리핑 자료 열람 페이지 |
| `features/purchasing/pages/PurchasingDashboardPage.tsx` | 1계층 구매팀 대시보드 페이지 |
| `lib/AuthContext.ts` | 인증 상태 Context 객체 정의 |
| `lib/AuthProvider.tsx` | 인증 상태 Provider 컴포넌트 |
| `lib/dashboardPaths.ts` | org_tier별 대시보드 경로 매핑 |
| `lib/riskEventId.ts` | risk_event_id 날짜 파싱 유틸 |
| `lib/tierLabels.ts` | org_tier별 한글 라벨 매핑 |
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
| `fetchGlobalRiskBoard` | 글로벌 리스크 관제 맵 조회 함수 | `risk_event` 배열을 요약 항목으로 변환, `market_context`의 country_code/country_name/coordinates도 함께 매핑(지도 마커용, Phase 9.1) |
| `fetchAiRecommendations` | AI 권고 조치 조회 함수 | 등급 기반 일반 권고 문구 생성(ERP 내부 상세는 미노출) |
| `fetchMaterialPriceTrends` | 원자재 가격 추이 조회 함수 | 자재별 합성 가격 지수(기준일=100) 시계열 반환 |
| `fetchMaterialPriceSummaries` | 원자재 가격 요약 카드 조회 함수 | 자재별 등락률/리스크 지수/등급 반환 — `change_label`/`risk_score`/`grade`는 mock 임시값(`docs/mock-schemas.md` 참고), `material`만 실제 연동 키 |
| `fetchNewsFeed` | 실시간 뉴스 속보 조회 함수 | `risk_event`를 `risk_event_id` 기준 날짜 최신순으로 정렬 |

### `api/purchasing.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `fetchRiskEvents` | 리스크 이벤트 목록 조회 함수 | 1계층 mock `risk_event` 배열 반환 — 다른 계층 API들이 공유하는 원천 데이터 |
| `fetchRiskEventBriefing` | 브리핑 자료 조회 함수 | risk_event_id로 찾은 이벤트의 rag_view/output_artifacts만 추출(Seq 24). 존재하지 않으면 `null` 반환 |

### `api/types.ts`
| physical | logical | 역할 |
|---|---|---|
| `ConfidenceLabel` *(재노출)* | 신뢰도 라벨 타입 | `'확정' \| '참고' \| '경고'` — 원본은 `components/ui/ConfidenceBadge.tsx` |
| `RiskGrade` *(재노출)* | 리스크 등급 타입 | `'정상' \| '주의' \| '심각'` — 원본은 `components/ui/RiskGradeBadge.tsx` |
| `MarketContext` | 시황 컨텍스트 타입 | 출처/자재/이벤트 요약/국가코드/국가명/좌표 |
| `ErpView` | ERP 관점 타입 | 안전재고일수/자재코드/대체 조달처 |
| `QualityCheck` | 품질 검증 타입 | 검증 상태(status)/기준/사유 |
| `RagView` | RAG(계약) 관점 타입 | 계약조항 요약/협상 포인트 |
| `OutputArtifacts` | 산출물 메타 타입 | 렌더 모드/파일 URL/JSON 폴백 여부 |
| `RiskEvent` | 리스크 이벤트 타입 | 1계층 원천 스키마(CLAUDE.md 기준) |
| `RiskEventBriefing` | 브리핑 자료 열람 응답 타입 | risk_event_id + risk_event의 rag_view/output_artifacts만 추출 + 배지 표시용 material/grade/confidence_label(Seq 24) |
| `OrgTier` | 조직 계층 타입 | `'purchasing' \| 'planning' \| 'executive'` |
| `LoginRequest` | 로그인 요청 타입 | 이메일/비밀번호 |
| `LoginFormValues` | 로그인 폼 값 타입 | `LoginRequest` + 로그인 상태 유지 여부(UI 로컬 상태) |
| `LoginSuccessResponse` | 로그인 성공 응답 타입 | 액세스 토큰/조직계층/승인 완료 표시(status, 항상 'APPROVED' 고정값) |
| `LoginPendingErrorResponse` | 로그인 승인대기 응답 타입 | 에러 코드/메시지 |
| `LoginResponse` | 로그인 응답 유니언 타입 | 성공 또는 승인대기 응답 |
| `SignupFormValues` | 회원가입 폼 값 타입 | 성명/이메일/비밀번호/조직계층(Figma 폼 필드 기준) |
| `SignupRequest` | 회원가입 요청 타입 | `SignupFormValues` + 소속 회사명(api 계층 고정값) |
| `SignupResponse` | 회원가입 응답 타입 | 사용자ID/승인 대기 표시(status, 항상 'PENDING' 고정값)/메시지 |
| `GlobalRiskBoardItem` | 글로벌 리스크 관제 맵 항목 타입 | 리스크 이벤트ID(risk_event_id)/자재/등급/신뢰도/이벤트 요약/국가코드/국가명/좌표(Phase 9.1 — 지도 마커용, 국가 특정 불가 시 생략 가능) |
| `AiRecommendation` | AI 권고 조치 항목 타입 | 리스크 이벤트ID(risk_event_id)/자재/등급/신뢰도/권고 문구 |
| `MaterialPricePoint` | 원자재 가격 포인트 타입 | 날짜/가격지수 |
| `MaterialPriceSeries` | 원자재 가격 시계열 타입 | 자재/단위/포인트 배열 |
| `NewsFeedItem` | 뉴스 속보 항목 타입 | 리스크 이벤트ID(risk_event_id)/날짜/자재/출처/헤드라인/신뢰도 |
| `KpiSummaryItem` | KPI 요약 카드 항목 타입 | 라벨/값/단위 |
| `RiskExposureByUnit` | 사업부별 리스크 노출도 타입 | 사업부명/노출도 점수 |
| `VendorRiskHistoryItem` | 협력사 리스크 이력 항목 타입 | 공급사ID/명/90일 이력 건수/최신 등급·신뢰도 |
| `PlanningDashboardResponse` | 2계층 대시보드 응답 타입 | business_unit + period + kpi_summary + risk_exposure_by_unit + vendor_risk_history |
| `CumulativeRiskKpi` | 누적 리스크 KPI 타입 | 탐지/응답 건수·비율, 심각 건수, 평균 대응 소요 |
| `SavingsSimulation` | 절감 시뮬레이션 타입 | is_simulation(항상 true)/예상 절감액/가정 |
| `EnterpriseRiskSummaryItem` | 전사 리스크 요약 항목 타입 | 사업부명/노출도 점수/추세 |
| `ExecutiveDashboardResponse` | 3계층 대시보드 응답 타입 | period + cumulative_risk_kpi + savings_simulation + enterprise_risk_summary |

### `app/routes.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AppRoutes` | 최상위 라우트 컴포넌트 | `/`, `/auth`, `/purchasing`, `/purchasing/briefing/:riskEventId`, `/planning`, `/executive` 라우트 정의. 뒤 4개는 내부 `RequireAuth`(비export) 가드 적용 — `tier` prop으로 org_tier까지 매칭. 미로그인이면 무음으로 `/auth` 리다이렉트하지만, 계층 불일치는 무음 리다이렉트 대신 `ConfirmModal`로 안내 후 사용자가 "내 화면으로 이동"을 선택해야 이동한다(Phase 8.5, qa-checklist.md C) |

### `components/layout/Breadcrumb.tsx`
| physical | logical | 역할 |
|---|---|---|
| `BreadcrumbItem` | 브레드크럼 항목 타입 | 라벨/href(선택) |
| `Breadcrumb` | 브레드크럼 컴포넌트 | 탐색 위치 안내, 마지막 항목은 링크 없이 현재 페이지로 표시 |

### `components/layout/Footer.tsx`
| physical | logical | 역할 |
|---|---|---|
| `Footer` | 공통 푸터 컴포넌트 | 모든 화면 하단에 운영기관 식별 정보 표시 |

### `components/layout/Header.tsx`
| physical | logical | 역할 |
|---|---|---|
| `Header` | 공통 헤더 컴포넌트 | 좌측에 홈 아이콘 링크(브랜드 텍스트 링크와 별개)+브랜드 텍스트 링크(둘 다 "/" 이동, sticky 상단 고정) + 우측 액션 슬롯(children). 로그인 상태면 계정 정보(이메일·계층)와 로그아웃 버튼, 미로그인 상태면 로그인/회원가입 버튼을 표시(Phase 8.5부터 모든 화면·비로그인 공개 대시보드 포함 대칭 적용) — 로그아웃은 SPA navigate와 인증 상태 갱신 간 경쟁을 피하려 하드 리다이렉트(`window.location.href`) 사용 |

### `components/layout/SideNav.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SideNavItem` | 사이드 메뉴 항목 타입 | 라벨/href |
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

### `components/ui/ConfirmModal.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ConfirmModal` | 확인/취소 모달 컴포넌트 | qa-checklist.md "C. 접근 제어·리다이렉트의 사용자 피드백" 대응 — 무음 리다이렉트 대신 이유를 알리고 선택지를 준다. `cancelLabel` 버튼이 기본 포커스+주 버튼(강조) 스타일, `confirmLabel` 버튼은 보조 스타일(안전한 선택지가 기본이어야 한다는 원칙을 컴포넌트가 강제). `role="dialog"` + `aria-modal="true"`, Esc 키는 취소와 동일하게 동작, Tab/Shift+Tab은 라이브러리 없이 순수 React로 모달 내부 요소끼리만 순환(포커스 트랩). 현재 `app/routes.tsx`의 `RequireAuth` 계층 불일치 안내에서 사용 |

### `components/ui/RiskGradeBadge.tsx`
| physical | logical | 역할 |
|---|---|---|
| `RiskGrade` | 리스크 등급 타입 | `'정상' \| '주의' \| '심각'` |
| `RiskGradeBadge` | 리스크 등급 배지 컴포넌트 | 등급별 색상(`--color-risk-*`) 배지 |

### `components/ui/ScrollCard/ScrollCard.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ScrollCard` | 카드형 UI 공통 컨테이너 컴포넌트 | 제목(`title`)+헤더 우측 컨트롤(`actions`)+부제(`caption`)+스크롤 영역 밖 고정 콘텐츠(`pinnedTop`)+스크롤 본문(`children`)+하단 고정 안내(`footer`) 슬롯 구조. 본문에 항상 `min-height:0`+`overflow-y:auto`를 캡슐화해, 부모 레이아웃이 카드 높이를 제약하는 경우(예: 비로그인 공개 대시보드 2x2 그리드)에만 내부 스크롤이 실제로 발동하고 그 외에는 자유롭게 늘어난다. `fillHeight`는 형제와 높이를 맞춰야 하는 카드용(`height:100%`). 신규 카드형 컴포넌트는 이 컴포넌트를 사용하고 자체 `.panel`/`.title` 스타일을 새로 만들지 않는다(CLAUDE.md) |

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
| `AuthPage` | 로그인/회원가입 통합 페이지 | 좌:우 5:6 스플릿스크린. 로그인 성공 시 해당 계층 대시보드로 이동, PENDING 시 락 화면 전환. 이동은 `signIn()` 호출과 같은 핸들러에서 바로 `navigate()`하지 않고, orgTier가 실제로 커밋된 뒤 `useEffect`에서 수행한다 — 로그아웃과 같은 종류의 SPA navigate·인증 상태 경쟁을 막기 위함(Phase 8) |

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
| `AiPriorityList` | AI 기반 권고 조치 리스트 컴포넌트 | 등급(심각>주의>정상) 순 정렬. `ScrollCard` 도입(리스트가 `children`) |

### `features/public/components/GlobalRiskBoard.tsx`
| physical | logical | 역할 |
|---|---|---|
| `GlobalRiskBoard` | 글로벌 리스크 관제 맵 컴포넌트 | Phase 9.1 — `react-leaflet`+`world-atlas`+`topojson-client` 기반 인터랙티브 세계지도. "이벤트뷰"(개별 좌표 마커)/"국가뷰"(country_code 기준 집계, 대표 이벤트=최고 심각도) 토글, 마커 클릭 시 컴포넌트 내부 상세 패널에 관련 risk_event 리스트 표시. country_code 없는 이벤트는 마커 제외. `ScrollCard` 도입(지도는 `pinnedTop`으로 항상 고정 노출, 뷰토글은 `actions`, 클릭 시 상세 리스트만 스크롤 영역인 `children`) |

### `features/public/components/MaterialPriceDetail.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialPriceDetail` | 원자재 가격 추이 컴포넌트 | Phase 9.3 — surin RiskMonitoring.tsx 시각 이식(필터行/요약카드 3장/기간버튼/Recharts 멀티라인 차트). "원자재" 드롭다운만 실제로 차트 계열을 필터링, "국가·지역"과 기간 버튼은 의도적으로 표시 전용(확정된 범위). `ScrollCard` 도입(필터行+요약카드는 `pinnedTop`으로 항상 고정 노출, 차트만 스크롤 영역인 `children`) |

### `features/public/components/SupplyNewsFeed.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SupplyNewsFeed` | 실시간 뉴스 속보 컴포넌트 | risk_event 기반 최신순 뉴스 리스트. `ScrollCard` 도입(리스트가 `children`) |

### `features/public/pages/PublicDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PublicDashboardPage` | 비로그인 공개 대시보드 페이지 | 공통 `Header`(3계층 탭을 children으로 전달) + 4개 패널 2x2 그리드. 탭 클릭 시 인증 상태에 따라 대시보드 또는 /auth로 이동. Phase 8.5 전에는 `Header`를 쓰지 않고 로그인 여부와 무관하게 로그인 버튼을 무조건 노출하는 자체 상단바를 갖고 있었음(버그, qa-checklist.md A/B 계기) |

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

### `features/purchasing/pages/BriefingDetailPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `BriefingDetailPage` | 1계층 브리핑 자료 열람 페이지 | Seq 24 "내부 브리핑 자료 열람 화면". `/purchasing/briefing/:riskEventId` — 계약 조항 요약/협상 포인트/산출물 메타 표시, RiskGradeBadge/ConfidenceBadge·Breadcrumb 재사용(Breadcrumb 첫 실사용) |

### `features/purchasing/pages/PurchasingDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PurchasingDashboardPage` | 1계층 구매팀 대시보드 페이지 | 사이드바 + 단일 컬럼 4단 패널 + 우측 알림 패널(Figma 프레임 기준) |

### `lib/AuthContext.ts`
| physical | logical | 역할 |
|---|---|---|
| `AuthContextValue` | 인증 Context 값 타입 | orgTier/이메일/signIn/signOut — 이메일(email)은 Phase 8에서 Header 계정 정보 표시용으로 추가 |
| `AuthContext` | 인증 Context 객체 | `AuthProvider`/`useAuthState`가 공유하는 React Context |

### `lib/AuthProvider.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AuthProvider` | 인증 상태 Provider 컴포넌트 | 로그인 성공 시 orgTier와 이메일을 메모리에만 저장(localStorage 미사용, 새로고침 시 소실) |

### `lib/dashboardPaths.ts`
| physical | logical | 역할 |
|---|---|---|
| `DASHBOARD_PATH_BY_TIER` | org_tier별 대시보드 경로 매핑 상수 | `AuthPage`(로그인 성공 후 이동)와 `app/routes.tsx`의 `RequireAuth`(계층 불일치 리다이렉트)가 공용으로 참조(Phase 8) |

### `lib/riskEventId.ts`
| physical | logical | 역할 |
|---|---|---|
| `parseRiskEventDate` | risk_event_id 날짜 파싱 함수 | `'RISK-YYYY-MMDD-NNN'` → `'YYYY-MM-DD'` |

### `lib/tierLabels.ts`
| physical | logical | 역할 |
|---|---|---|
| `TIER_LABEL` | org_tier별 한글 라벨 매핑 상수 | `Header`(계정 정보 표시)와 `app/routes.tsx`의 `RequireAuth`(계층 불일치 모달 메시지)가 공용으로 참조(Phase 8.5) — 이전엔 `Header.tsx`에 로컬 상수로 중복 정의돼 있었음 |

### `lib/useAuthState.ts`
| physical | logical | 역할 |
|---|---|---|
| `useAuthState` | 인증 상태 접근 훅 | `AuthProvider` 내부에서 orgTier/이메일/signIn/signOut 제공, 범위 밖 사용 시 예외 발생 |
