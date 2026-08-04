# 네이밍 사전 — Physical Name(영문) : Logical Name(한글)

> `src/` 전체(.ts/.tsx)를 스캔해 작성한 파일·컴포넌트·함수/훅·타입의 영문(physical)-한글(logical) 대응표다.
> `*.module.css`, `tokens.css`, `index.css` 등 스타일 파일은 export되는 JS 심볼이 없어 범위에서 제외했다.
> 코드가 바뀌면 이 문서도 같이 갱신해야 정확하다 — 스냅샷 문서다.
> 같은 물리 필드명(예: email, label, material)은 타입이 달라도 동일한 한글 표현을 원칙으로 한다. 단, 물리 필드명은 같지만 논리적 의미가 다른 경우(예: status가 실제 가변 상태값인지, 항상 고정값만 갖는 응답 태그인지 등 문맥상 다른 개념인 경우)는 실제 타입 정의와 사용처를 코드에서 먼저 확인한 뒤, 그 의미에 맞는 수식어를 붙이고 물리 필드명을 괄호로 병기해 검색 가능하게 한다. 타입 설명에는 export된 인터페이스의 모든 필드를 빠짐없이 반영한다(첫 필드 누락 금지).

## 1. 요약 표 (파일 단위)

| 파일 경로 (physical) | 논리명 (logical) |
|---|---|
| `App.tsx` | 앱 루트 컴포넌트 — AuthProvider·SideNavProvider·AlertsPanelProvider로 라우트 트리 감싸기(Phase 9.4에서 SideNavProvider, 2026-07-27에 AlertsPanelProvider 추가) |
| `main.tsx` | 앱 진입점 — ReactDOM 렌더링, BrowserRouter 연결 |
| `api/auth.api.ts` | 인증(로그인/회원가입) mock API |
| `api/executive.api.ts` | 3계층 경영진 대시보드 mock API |
| `api/planning.api.ts` | 2계층 경영기획팀 대시보드 mock API |
| `api/public.api.ts` | 비로그인 공개 대시보드 API(Phase 9.4에서 fetchMaterialPriceTrends/fetchMaterialPriceSummaries를 purchasing.api.ts로 옮기고 재수출만 함; 2026-07-27 — fetchPublicRiskBoard 신규로 지도만 실 API 연동. **2026-08-03(minji 이식)** — fetchPublicAiRecommendations/fetchPublicNewsFeed/fetchPublicPriceTrends/fetchPublicPriceSummaries/fetchPublicImportDependency/fetchPublicExchangeRates 신규로 4패널 전부 비동기 mode 분기 연동, fetchNewsFeed 재작성(collected_at/grade/headline_original/translated/country_code/url 필드 추가), fetchExchangeRates(mock) 신규. **2026-08-03(tier1 재동기화, 9번 섹션)** — fetchPublicNewsFeed가 limit/offset 파라미터를 받도록 확장(마퀴 5건+페이징 목록 분리), fetchPublicNewsFeedCount 신규(마지막 페이지 판정)) |
| `api/publicAiBriefing.api.ts` | 비로그인 `/public/ai-briefing` API(신규, 2026-08-03, minji `aiBriefing.api.ts` 이식) — accessToken을 `string \| null`로 받아 ①단계는 항상 mock, 로그인 없는 ②/③단계는 LOGIN_REQUIRED_MESSAGE를 던지는 3단계 분기. **2026-08-03(tier1 재동기화)** — generateAiBriefing에 5번째 인자 `analysisId` 추가(프리필 분석으로 고정), mock context에 `latest_briefing_id` 추가 |
| `api/publicContractRag.api.ts` | 비로그인 `/public/contract-rag` API(신규, 2026-08-03, minji `contractRag.api.ts` 이식) — 업로드/재처리는 mock 모드에서 "준비 중" 에러 |
| `api/publicMaterialRisk.api.ts` | 비로그인 `/public/materials` API(신규, 2026-08-03, minji `materialRisk.api.ts` 이식). **2026-08-03(tier1 재동기화)** — fetchMaterialRiskOverview에 `refresh` 2번째 인자 추가("새로고침" 버튼용) |
| `api/publicPurchasingDashboard.api.ts` | 비로그인 대시보드(`/`) 인증 API 3종(신규, 2026-08-03, tier1 `purchasingDashboard.api.ts` 이식) — KPI 요약/원자재별 리스크 점수/공급사 현황. 원저자는 mock 폴백 없음 원칙이었으나 `/public/*` 공통 원칙("완전 공개+mock 폴백")을 적용, 다른 `publicX.api.ts`와 동일한 3단계 분기. `toPurchasePriority` 순수 함수 포함(`toMaterialRiskGauges`/`toScoreCards`는 2026-08-04 제거, 아래 상세 섹션 참고) |
| `api/publicRiskMonitoring.api.ts` | 비로그인 `/public/risk-monitoring` API(신규, 2026-08-03, minji `riskMonitoring.api.ts` 이식) — 4개 `publicX.api.ts` 공통 3단계 분기(①mock/②③비로그인=LOGIN_REQUIRED/②③로그인=fetchWithAuth) 규칙을 이 파일 최상단 주석에 정의, 나머지 3개가 참조. **2026-08-03(tier1 재동기화)** — mock procurement_risk에 representative_material_id/valid_material_count/target_material_count/material_assessments 추가 |
| `api/purchasing.api.ts` | 1계층 구매팀 대시보드 mock API — risk_event 원천 데이터 + Phase 9.4에서 이동된 글로벌 리스크 맵/가격 추이 mock + 신규 원자재 리스크 개요/수입 의존도 mock |
| `api/types.ts` | 전 화면 공용 API 응답 타입 정의 |
| `app/routes.tsx` | 최상위 라우트 정의 및 로그인 가드. **2026-08-03** — `/public/risk-monitoring`/`/public/materials`/`/public/contract-rag`/`/public/ai-briefing` 4개 라우트 신규(RequireAuth 없이 완전 공개, minji 이식) |
| `components/layout/Breadcrumb.tsx` | 브레드크럼(탐색 위치 안내) |
| `components/layout/Footer.tsx` | 공통 하단 푸터. **2026-08-03(minji 이식)** — 환율 출처 표기(ExchangeRate-API 이용조건 의무) 추가, `flex-shrink:0` 보정 |
| `components/layout/AlertsBellButton.tsx` | 헤더 알림 벨 아이콘(2026-07-27 신규) — `Header`의 `accountExtra` 슬롯에 들어감. **2026-08-04(tier1 재동기화 D 배치)** — `onOpenAlerts?`(열기 전용, `/public`) 선택 prop 추가, `expanded`/`onToggle`(기존 토글, `/purchasing`)은 그대로 유지해 두 모드 동시 지원(tier1은 완전 교체했으나 `/purchasing`이 옛 계약을 계속 써서 하위호환 필요) |
| `components/layout/Header.tsx` | 공통 상단 헤더(로고 = 홈 링크). 2026-07-27 — `accountExtra` prop 추가(계정정보-로그아웃 사이 슬롯, 선택) |
| `components/layout/SideNav.tsx` | 사이드 메뉴 내비게이션(Phase 9.4부터 SideNavContext의 collapsed 상태 반영) |
| `components/layout/SideNavToggleButton.tsx` | SideNav 접기/펼치기 토글 버튼(Phase 9.4 신규) — SideNav 바깥에 위치 |
| `components/layout/SidePanelToggleButton.tsx` | 우측 `DashboardSidePanel` 접기/펼치기 토글 버튼(신규, 2026-08-04, tier1 재동기화 D 배치) — 좌측 `SideNavToggleButton`과 생김새는 같지만 `position: fixed`로 패널 위에 얹는 배치 방식이 다름(페이지 섹션 점과 패널 사이 간격 유지 목적). 헤더 알림 벨이 겸하던 패널 토글 역할을 분리해 받음 |
| `components/layout/SkipLink.tsx` | 본문 바로가기 링크(접근성) |
| `components/ui/ConfidenceBadge.tsx` | 리스크 판단 신뢰도 라벨 배지 |
| `components/ui/ConfirmModal.tsx` | 확인/취소 모달 |
| `components/ui/DonutChart.tsx` | 도넛 차트(Phase 9.4 신규, surin DonutChart 이식) |
| `components/ui/HorizontalScrollHint.tsx` | 가로 스크롤 좌우 오버플로 힌트(2026-07-27 신규 — `MaterialRiskOverviewRow`/`MaterialRiskOverviewSection`에 중복돼 있던 CSS/JSX를 공용 컴포넌트로 추출; 같은 날 후속으로 `onClickLeft`/`onClickRight` 선택적 prop 추가돼 두 소비처 모두에서 클릭 가능한 페이징 버튼으로도 쓰임) |
| `components/ui/PageSectionDots/PageSectionDots.tsx` | 페이지 섹션 이동 도트 인디케이터(Phase 10.7 신규, `rootMargin` 헤더 높이 보정 2026-07-27) |
| `components/ui/RiskGauge.tsx` | 3단계 리스크 게이지(Phase 9.4 신규, surin RiskStepGauge 이식) |
| `components/ui/RiskGradeBadge.tsx` | 리스크 등급 배지 |
| `components/ui/ScrollCard/ScrollCard.tsx` | 카드형 UI 공통 컨테이너(스크롤 캡슐화) |
| `components/ui/Skeleton/Skeleton.tsx` | 로딩 자리표시자 컴포넌트(신규, 2026-08-04, tier1 재동기화 1차 배치) — `Skeleton`(단일 조각, `variant` line/title/block/circle) + `SkeletonText`(여러 줄, 마지막 줄만 짧게) |
| `components/widgets/GlobalRiskBoard.tsx` | 글로벌 리스크 관제 맵(Phase 9.4에서 `features/public/components/`→여기로 승격 — 구매팀 대시보드도 재사용). **2026-08-03(tier1 재동기화)** — `onSelectItem?` 선택적 prop 추가, 넘기면 마커 클릭 시 카드 내부 상세 패널 대신 콜백만 호출(우측 `DashboardSidePanel`용, 넘기지 않는 기존 소비처는 무수정 동작) |
| `components/widgets/MaterialPriceDetail.tsx` | 원자재 가격 추이(Phase 9.4에서 `features/public/components/`→여기로 승격 — 구매팀 대시보드도 재사용). **2026-08-03(minji 이식)** — `period`/`onPeriodChange`가 필수 prop으로 전환(내부 `useState` 제거, 조회는 호출부 소유), 국가·지역 필터가 `countries` 응답 기반 실동작으로 전환. **2026-08-04(tier1 재동기화 1차 배치)** — `isLoading?` 선택 prop 추가, 차트 영역에 `Skeleton` 자리표시자 |
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
| `features/public/components/DashboardSidePanel.tsx` | 비로그인 대시보드 우측 패널 — 탭 3개(뉴스 상세/주요 알림/브리핑)+데이터 업로드 카드(신규, 2026-08-03, tier1 `DashboardSidePanel.tsx` 이식) — 기존 `AlertsBellButton` 배선(펼침/접힘 `AlertsPanelContext`, 호버 미리보기) 재사용. **2026-08-04(D 배치)** — `isNewsLoading?`/`isAlertsLoading?`/`isBriefingsLoading?`(탭별 스켈레톤)·`focusAlertsToken?`(벨 클릭 시 "주요 알림" 탭 강제 전환) prop 추가, `selectedNews` 참조 변경 시 "뉴스 상세" 탭 자동 복귀 effect 신규 |
| `features/public/components/LatestNewsPanel.tsx` | 최신 뉴스 페이징 목록(신규, 2026-08-03, tier1 이식) — 우측 "뉴스 상세" 탭과 짝을 이루는 선택 가능한 목록, `ScrollCard` 사용 |
| `features/public/components/LiveNewsMarquee.tsx` | 실시간 뉴스 헤드라인 마퀴+환율 칩(신규, 2026-08-03, tier1 이식) — 최신 뉴스와 같은 `/public/news-feed`를 `limit`으로 줄여 재사용 |
| `features/public/components/MaterialRiskGaugeGrid.tsx` | 원자재별 리스크 게이지 그리드(신규, 2026-08-04, tier1 재동기화 1차 배치) — `MaterialRiskSummaryTable`과 같은 배열을 게이지 7장으로 재표현, 기본 접힘+더보기 |
| `features/public/components/MaterialRiskSummaryTable.tsx` | 원자재별 리스크 점수 7종 테이블(신규, 2026-08-03, tier1 이식) — 최종 합성 점수(외부신호+ERP노출+계약공백), "대응 완료" 버튼 포함 |
| `features/public/components/PublicErpImpactPanel.tsx` | ERP 영향 자재 재고 계약 분석 패널(신규, 2026-08-03, tier1 `ErpImpactPanel.tsx` 이식) — `features/purchasing/components/ErpImpactPanel.tsx`(Phase 4 MVP, `events` 배열 prop)와 이름이 겹쳐 `Public` 접두로 분리, `materials` 배열 prop 기반 |
| `features/public/components/PublicMaterialRiskStatusPanel.tsx` | 원자재 공급사 리스크 현황 패널(신규, 2026-08-03, tier1 `MaterialRiskStatusPanel.tsx` 이식) — 이름 충돌로 `Public` 접두 분리, `materials` 배열 prop 기반 |
| `features/public/components/PublicPurchasePriorityPanel.tsx` | 구매 대응 우선순위 패널(신규, 2026-08-03, tier1 `PurchasePriorityPanel.tsx` 이식) — 이름 충돌로 `Public` 접두 분리, `materials` 배열 prop 기반, 정렬은 `publicPurchasingDashboard.api.ts`의 `toPurchasePriority` |
| `features/public/components/PurchasingDashboardHeader.tsx` | 비로그인 대시보드 본문 제목줄(신규, 2026-08-03, tier1 이식) — "구매 위험 관제 대시보드" + 기준일 칩 |
| `features/public/components/PurchasingKpiRow.tsx` | 비로그인 대시보드 상단 KPI 5칸(신규, 2026-08-03, tier1 이식) — 심각·주의 건수/ERP 영향도/외부 위험/검증 브리핑, 24시간 전 대비 보조 값 포함 |
| `features/public/components/SupplierOverviewPanel.tsx` | 공급사 현황 및 대체 공급사 추천 패널(신규, 2026-08-03, tier1 이식) — 현재 공급사(ERP 발주 실적)와 추천 대체 공급사(분석 저장 결과)를 좌우로 병기 |
| `features/public/components/SupplyNewsFeed.tsx` | 실시간 뉴스 속보 |
| `features/public/pages/PublicAiBriefingPage.tsx` | 비로그인 `/public/ai-briefing` 페이지(신규, 2026-08-03, minji `AiBriefingPage.tsx` 이식 — 완전 공개 + mock 폴백으로 방향 전환). **2026-08-03(tier1 재동기화, 잘못된 브랜치 정정)** — `?briefing=` URL-as-source-of-truth, `safeReturnTo`+복귀 링크(`/public/` 화이트리스트), `handleOpen` URL 파라미터 동기화, 브리핑 생성 시 `analysis_id` 고정 전달 반영 |
| `features/public/pages/PublicContractRagPage.tsx` | 비로그인 `/public/contract-rag` 페이지(신규, 2026-08-03, minji `ContractRagPage.tsx` 이식). **2026-08-03(tier1 재동기화)** — 계약 선택 드롭다운이 상세 패널을 직접 여는 동작, 파일 확장자/크기 검증(`stageFile`) 반영, tier1이 제거한 "근거로 사용하기"(evidence) 기능 함께 제거, 업로드 UI(드롭존+"문서 재처리")는 `accessToken` 있을 때만 노출(3단계 로그인 게이트) |
| `features/public/pages/PublicDashboardPage.tsx` | 비로그인 공개 대시보드 페이지. **2026-08-03(minji 이식)** — 4패널 전부 비동기 실 API/mock 연동으로 전환, `ExchangeRateBand`/`ImportDependencyPanel`(구매팀과 공유)/`MaterialPriceTrendCard`/`Footer` 추가, 기간 탭 상태를 페이지가 소유. **2026-08-03(tier1 전면 재작성, 5bfd7db 잘못된 브랜치 정정)** — 4패널 2x2 그리드를 tier1 `PurchasingDashboardPage.tsx` 기준 본문 12섹션+우측 `DashboardSidePanel` 구조로 전면 교체, `ExchangeRateBand`/`MaterialPriceTrendCard` 삭제 |
| `features/public/pages/PublicMaterialRiskPage.tsx` | 비로그인 `/public/materials` 페이지(신규, 2026-08-03, minji `MaterialRiskPage.tsx` 이식). **2026-08-03(tier1 재동기화)** — `forceRefresh` 새로고침, `hasErpContext()` 정밀 판정, ERP 경고 목록, 계약 검토 필요 강조 스타일 반영 |
| `features/public/pages/PublicRiskMonitoringPage.tsx` | 비로그인 `/public/risk-monitoring` 페이지(신규, 2026-08-03, minji `RiskMonitoringPage.tsx` 이식) — 4개 `Public*Page.tsx` 공통으로 원본과의 차이(완전 공개 + mock 폴백, `RequireAuth`/`apiConfigured` 가드 제거)를 이 파일 최상단 주석에 정의, 나머지 3개가 참조. **2026-08-03(tier1 재동기화)** — `?eventId=` URL 상태 복원+`returnTo` 왕복, 동적 버튼 라벨(`resolveAction`), `hasSignalInputs` 예외 처리, 자재별 세부 breakdown 반영 |
| `features/purchasing/components/AlertsPanel.tsx` | 주요 알림 및 빠른 작업 패널. 2026-07-27 — `AlertsPanelContext`의 `expanded`로 펼침/접힘, 접힘+호버 시 상위 4개 `ScrollCard` 미리보기 추가(오류 및 기능 미흡 발견 #7) |
| `features/purchasing/components/ErpImpactPanel.tsx` | ERP 영향 자재 재고 계약 분석 패널 |
| `features/purchasing/components/ImportDependencyPanel.tsx` | 수입 의존도 도넛차트 패널(Phase 9.4 신규). **2026-08-03(minji 이식)** — 비로그인 화면 공유를 위해 `blurred?` prop, `base_date` 각주, 상위 5개+"기타" 조각 그룹핑 추가(전부 하위호환, 구매팀 대시보드 기존 호출부 무수정) |
| `features/purchasing/components/ImportDependencyRow.tsx` | 수입 의존도+원자재 가격 추이 2컬럼 행(Phase 9.4 신규). 2026-07-27 — `940px` 이하 1컬럼 전환 미디어 쿼리 추가(신설 이후 처음, 미구현 상태였음). **2026-08-03** — `MaterialPriceDetail`의 `period`/`onPeriodChange` 필수 prop화에 맞춰 내부 `useState`로 자체 충족(외부 시그니처 무변경, `PurchasingDashboardPage.tsx`는 무수정). **2026-08-03(tier1 재동기화)** — `period`/`onPeriodChange`를 선택적 외부 prop으로 추가(넘기면 제어형, 안 넘기면 기존처럼 내부 상태로 비제어형) — 비로그인 대시보드(제어형)와 구매팀 대시보드(비제어형, 무수정)를 한 컴포넌트로 지원 |
| `features/purchasing/components/KpiSummaryPanel.tsx` | 상단 KPI 요약 패널 |
| `features/purchasing/components/MaterialRiskOverviewRow.tsx` | 원자재 리스크 상세 그리드(게이지 카드+placeholder 자재 카드, Phase 9.4 신규 — 더보기 구조 재정의 후 점수 카드는 `ScoreCardPanel`로 분리, 9장으로 늘어나며 세로 줄바꿈 대신 가로 스크롤로 전환) |
| `features/purchasing/components/MaterialRiskOverviewSection.tsx` | 원자재 리스크 개요 요약 행 — 더보기(Disclosure) 컨테이너, 형제 카드 캐러셀형(가로 스크롤+드래그) |
| `features/purchasing/components/MaterialRiskStatusPanel.tsx` | 원자재 공급사 리스크 현황 패널 |
| `features/purchasing/components/MaterialRiskSummaryCard.tsx` | 원자재 리스크 요약 카드(더보기 토글 보유) |
| `features/purchasing/components/PurchasePriorityPanel.tsx` | 구매 대응 우선순위 패널 |
| `features/purchasing/components/ScoreCardPanel.tsx` | 점수 카드(외부 리스크 종합/ERP 영향) — 더보기 구조 재정의로 신규 분리. **2026-08-03(tier1 재동기화)** — `ScoreCardItem.grade`가 선택 필드로 바뀌어 값이 없으면 `RiskGradeBadge`를 생략하도록 조건부 렌더로 변경 |
| `features/purchasing/pages/BriefingDetailPage.tsx` | 1계층 브리핑 자료 열람 페이지 |
| `features/purchasing/pages/PurchasingDashboardPage.tsx` | 1계층 구매팀 대시보드 페이지 |
| `lib/dashboardAlerts.ts` | 비로그인 대시보드 우측 "주요 알림" 목록 생성 함수(`buildDashboardAlerts`, 신규, 2026-08-03, tier1 이식) — 멀티에이전트 완료된 심각·주의 뉴스 + 가격 변동성(정보)을 병합, 뉴스 최신순→정보 순 정렬 |
| `lib/dataQuality.ts` | ERP 데이터 품질 코드 라벨·색 등급 공용 함수(`dataQualityLabel`/`dataQualityTone`, 신규, 2026-08-04, tier1 재동기화 1차 배치) — 원자재 위험 화면과 `PublicErpImpactPanel`이 `VALID`/`STALE`/`INCOMPLETE`/`INVALID`/`UNKNOWN` 코드를 같은 말로 부르도록 한곳에 둠 |
| `lib/formatCollectedAt.ts` | 수집 시각 `MM-DD HH:mm`(24시간) 포맷 함수(신규, 2026-08-03, tier1 이식) — `toLocale*`의 12시간제/로케일 구분자 문제 회피 |
| `lib/newsEventRef.ts` | 선택 기사 → AI 브리핑 `ref` 변환 함수(`toNewsEventRef`, 신규, 2026-08-03, tier1 이식) — `event_id`→`RAW-{id}`→분석 UUID 순으로 시도 |
| `lib/selectedArticle.ts` | 뉴스·지도 마커 → 공통 `SelectedArticle` 변환 함수(`fromNewsFeedItem`/`fromRiskBoardItem`, 신규, 2026-08-03, tier1 이식) |
| `lib/AuthContext.ts` | 인증 상태 Context 객체 정의. **2026-08-03** — `accessToken: string \| null` 필드 + `signIn` 세 번째 인자로 추가(minji/feat 브랜치와 동일한 독립 구현, `/public/*` API가 `useAuthState()`로 토큰을 읽어 씀) |
| `lib/AuthProvider.tsx` | 인증 상태 Provider 컴포넌트. **2026-08-03** — `accessToken` state 추가 |
| `lib/dashboardPaths.ts` | org_tier별 대시보드 경로 매핑 |
| `lib/materialPricePeriods.ts` | 원자재 가격 추이 기간 탭 정의(`PERIOD_DAYS`/`DEFAULT_PERIOD`/`PERIOD_OPTIONS`, 신규, 2026-08-03, minji 이식) — `MaterialPriceDetail`/`ImportDependencyRow`/`PublicDashboardPage` 공용, 컴포넌트 파일 밖에 둔 이유는 react-refresh 제약 |
| `lib/publicNav.ts` | 비로그인 `/public/*` 사이드 메뉴 정의(`PUBLIC_SIDE_NAV_ITEMS`, 신규, 2026-08-03) — minji `purchasingNav.ts`와 같은 패턴, 첫 항목이 비로그인 대시보드(`/`)로 돌아가는 링크 |
| `lib/AlertsPanelContext.ts` | AlertsPanel 펼침/접힘 상태 Context 객체 정의(2026-07-27 신규, SideNavContext와 동일 패턴). **2026-08-04(D 배치)** — `open: () => void`(접혀 있으면 펴고, 펴져 있으면 무시) 추가(순수 additive, `toggle` 유지) |
| `lib/AlertsPanelProvider.tsx` | AlertsPanel 펼침/접힘 상태 Provider 컴포넌트(2026-07-27 신규) — `DEFAULT_ALERTS_EXPANDED` 기본값 상수도 이 파일에 있음. **2026-08-04(D 배치)** — `open: () => setExpanded(true)` 구현 추가 |
| `lib/riskEventId.ts` | risk_event_id 날짜 파싱 유틸 |
| `lib/selectAlertEvents.ts` | 알림 대상 risk_event 필터 함수(2026-07-27 신규, `AlertsPanel.tsx`에서 분리 — react-refresh 규칙상 컴포넌트 파일은 컴포넌트만 export해야 해서) — `AlertsPanel`(전체 목록)과 `AlertsBellButton`의 배지 숫자 양쪽이 재사용 |
| `lib/SideNavContext.ts` | SideNav 접기/펼치기 상태 Context 객체 정의(Phase 9.4 신규) |
| `lib/SideNavProvider.tsx` | SideNav 접기/펼치기 상태 Provider 컴포넌트(Phase 9.4 신규) |
| `lib/tierLabels.ts` | org_tier별 한글 라벨 매핑 |
| `lib/useAlertsPanelState.ts` | AlertsPanel 펼침/접힘 상태 접근 훅(2026-07-27 신규) |
| `lib/useAuthState.ts` | 인증 상태 접근 훅 |
| `lib/scrollHorizontalByPage.ts` | 형제 카드 캐러셀형 "카드 1장 겹치는" 페이징 스크롤 유틸(2026-07-27 신규, `MaterialRiskOverviewRow`/`MaterialRiskOverviewSection` `HorizontalScrollHint` 클릭 핸들러에서 사용) |
| `lib/useHorizontalDragScroll.ts` | 가로 스크롤 grab-to-scroll 드래그 훅(2026-07-27 신규, `MaterialRiskOverviewRow`에서 추출해 공용화) |
| `lib/useHoverDisclosure.ts` | 2단계 hover 디스클로저 상태 훅(2026-07-27 신규, `PageSectionDots`에서 처음 사용 — WCAG 1.4.13 hoverable/dismissible/persistent 충족용). **소급 정정**: GlobalRiskBoard 마커 hover(#3)에서는 실제로 재사용하지 않기로 확정됨(근거는 `docs/roadmap-candidates.md` C9), AlertsPanel hover 프리뷰(#7)에서도 "벗어나면 항상 초기화" 모델이 pin 요구사항과 안 맞아 재사용하지 않음(`design-tokens.md` "카드 레이아웃·스크롤 규칙" e항 참고) — 지금까지 실사용처는 `PageSectionDots` 한 곳뿐 |
| `lib/useScrollOverflowHint.ts` | 스크롤 오버플로 힌트 감지 훅(Phase 9.4/10.7, `axis` 파라미터로 세로/가로 축 지원) |
| `lib/useSideNavState.ts` | SideNav 접기/펼치기 상태 접근 훅(Phase 9.4 신규) |

## 2. 상세 — 파일별 export 목록

각 파일에서 실제로 `export`된 심볼만 담았다(내부 전용 `interface XxxProps` 등은 export되지 않으므로 제외).

### `App.tsx`
| physical | logical | 역할 |
|---|---|---|
| `App` (default export) | 앱 루트 컴포넌트 | `AuthProvider`→`SideNavProvider`로 `AppRoutes`를 감싸 렌더링(Phase 9.4에서 `SideNavProvider` 추가) |

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
| `fetchPublicRiskBoard` | 글로벌 리스크 관제 맵 조회 함수(실 API 연동) | 2026-07-27 신규. `VITE_API_BASE_URL` 설정 시 `GET /api/v1/public/risk-board` 실 호출(`fetchJson` 재사용, 새 인증 헬퍼 불필요 — 토큰 없는 공개 엔드포인트), 미설정 시(①단계) `purchasing.api.ts`의 `fetchGlobalRiskBoard()`(mock)를 그대로 반환. `auth.api.ts`의 `login`/`signup`과 동일한 mode 분기 컨벤션. 구매팀 대시보드가 쓰는 `fetchGlobalRiskBoard()`와는 별도 함수라 이 변경이 구매팀 대시보드에 영향 없음(설계 의도, 실측 확인) |
| `fetchMaterialPriceTrends` *(재수출)* | 원자재 가격 추이 조회 함수 | Phase 9.4에서 `api/purchasing.api.ts`로 이동, 여기서는 재수출만 |
| `fetchMaterialPriceSummaries` *(재수출)* | 원자재 가격 요약 카드 조회 함수 | Phase 9.4에서 `api/purchasing.api.ts`로 이동, 여기서는 재수출만 |
| `fetchAiRecommendations` | AI 권고 조치 조회 함수(mock) | 등급 기반 일반 권고 문구 생성(ERP 내부 상세는 미노출). `fetchPublicAiRecommendations`의 ①단계/폴백 경로 |
| `fetchPublicAiRecommendations` | AI 권고 조치 조회 함수(실 API 연동, 2026-08-03 신규) | `fetchPublicRiskBoard`와 동일 mode 분기 |
| `fetchNewsFeed` | 실시간 뉴스 속보 조회 함수(mock) | 2026-08-03 재작성 — `collected_at`/`grade?`/`headline_original`/`translated`/`country_code`/`url` 필드 추가. `fetchPublicNewsFeed`의 ①단계/폴백 경로 |
| `fetchPublicNewsFeed` | 실시간 뉴스 속보 조회 함수(실 API 연동, 2026-08-03 신규) | 수집 원본(raw_events)이라 F3 분석 없이도 채워짐 |
| `fetchPublicPriceTrends` | 원자재 가격 추이 조회 함수(실 API 연동, 2026-08-03 신규) | `days` 파라미터로 조회 구간 지정, `fetchPublicPriceSummaries`와 같은 값을 넘겨야 함 |
| `fetchPublicPriceSummaries` | 원자재 요약 카드 조회 함수(실 API 연동, 2026-08-03 신규) | 가격 추이와 같은 구간에서 파생 |
| `fetchPublicImportDependency` | 수입 의존도 조회 함수(실 API 연동, 2026-08-03 신규) | ERP 발주 데이터를 공급사 국적별로 묶어 구성 |
| `fetchPublicExchangeRates` | 환율 밴드 조회 함수(실 API 연동, 2026-08-03 신규) | 한국수출입은행 고시환율 DB 최신 고시일 조회 |
| `fetchExchangeRates` | 환율 밴드 조회 함수(mock, 2026-08-03 신규) | USD/EUR/CNH/CLP/JPY 5개 통화 하드코딩. `fetchPublicExchangeRates`의 ①단계/폴백 경로 |

### `api/publicRiskMonitoring.api.ts`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `LOGIN_REQUIRED_MESSAGE` | 로그인 필요 안내 문구 상수 | ②/③단계에서 비로그인 방문자가 호출할 때 던지는 에러 메시지 — 4개 `publicX.api.ts` 공통 이름 |
| `fetchRiskMonitoringEvents` | 리스크 모니터링 이벤트 목록 조회 함수 | `accessToken: string \| null` — ①mock/②③비로그인=에러/②③로그인=fetchWithAuth 3단계 분기 |
| `fetchRiskMonitoringEvent` | 리스크 모니터링 이벤트 상세 조회 함수 | 〃 |
| `runErpImpactAnalysis` | ERP·계약 영향 분석 실행 함수 | mock 모드에서는 실제 재계산 없이 저장된 상세를 그대로 반환 |

### `api/publicMaterialRisk.api.ts`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `fetchMaterialRiskOverview` | 원자재 위험 KPI+목록 조회 함수 | 3단계 분기(publicRiskMonitoring.api.ts와 동일 규칙) |
| `fetchMaterialRiskDetail` | 자재 상세 조회 함수 | 〃 |
| `fetchContractEvidence` | 계약 RAG 근거 조회 함수 | 〃 |

### `api/publicContractRag.api.ts`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `fetchContracts` | 계약 목록 조회 함수 | 3단계 분기 |
| `searchClauses` | 계약 조항 검색 함수 | `contractId` 생략 시 전체 계약 검색 |
| `fetchContractDetail` | 계약 문서 상세 조회 함수 | 3단계 분기 |
| `uploadContractDocument` | 계약서 업로드 함수 | mock 모드에서 "준비 중" 에러(실제 파일 처리 없음) |
| `reprocessContractDocuments` | 계약 문서 재처리 함수 | 〃 |

### `api/publicAiBriefing.api.ts`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `fetchAiBriefingContext` | 분석 대상 프리필 조회 함수 | 3단계 분기, 멀티에이전트를 돌리지 않음 |
| `generateAiBriefing` | LLM 브리핑 생성 함수 | mock 모드에서는 고정 브리핑을 반환(source/ref 무관하게 동일 본문) |
| `fetchRecentAiBriefings` | 최근 브리핑 목록 조회 함수 | 3단계 분기 |
| `fetchAiBriefing` | 브리핑 상세 재조회 함수 | 생성 결과와 같은 타입(`AiBriefingDetail`) |

### `api/publicPurchasingDashboard.api.ts`(신규, 2026-08-03, 9번 섹션)
| physical | logical | 역할 |
|---|---|---|
| `LOGIN_REQUIRED_MESSAGE` | 로그인 필요 안내 문구 상수 | 4개 `publicX.api.ts`와 동일 이름 |
| `fetchPurchasingKpiSummary` | 상단 KPI 5칸 조회 함수 | 3단계 분기(다른 `publicX.api.ts`와 동일 규칙) — tier1 원저자는 mock 폴백 없음 원칙이었으나 이 브랜치는 `/public/*` 공통 원칙 적용 |
| `fetchMaterialRiskSummary` | 원자재별 리스크 점수 7종 조회 함수 | 〃 |
| `fetchSupplierOverview` | 공급사 현황+대체 공급사 추천 조회 함수 | 〃 |
| `acknowledgeAssessment` | 평가 완료 처리 함수 | mock 모드에서는 서버 반영 없이 호출부가 로컬로만 갱신 |
| `toPurchasePriority` | 자재별 위험 목록 → 구매 대응 우선순위 정렬 함수 | **2026-08-04(tier1 재동기화 1차 배치) 갱신**: 반환 타입이 `MaterialRiskItem[]`(평가 불가를 심각·주의 사이 2.5로 끼워 정렬)에서 `PurchasePriority`(`{ ranked, unavailable }`, 평가 불가는 순위 없이 별도 배열)로 변경 |

> **정정(2026-08-04)**: `toMaterialRiskGauges`/`toScoreCards`는 이 파일에서 제거했다 — tier1이
> `MaterialRiskOverviewSection`(이 두 함수의 유일한 소비처)을 삭제하며 이 화면(`PublicDashboardPage.tsx`)이
> `MaterialRiskGaugeGrid`로 전환됐고, 다른 소비처가 없어 함께 정리했다(`docs/mock-schemas.md`
> 10번 섹션 참고).

### `api/purchasing.api.ts`
| physical | logical | 역할 |
|---|---|---|
| `fetchRiskEvents` | 리스크 이벤트 목록 조회 함수 | 1계층 mock `risk_event` 배열 반환 — 다른 계층 API들이 공유하는 원천 데이터 |
| `fetchRiskEventBriefing` | 브리핑 자료 조회 함수 | risk_event_id로 찾은 이벤트의 rag_view/output_artifacts만 추출(Seq 24). 존재하지 않으면 `null` 반환 |
| `fetchGlobalRiskBoard` | 글로벌 리스크 관제 맵 조회 함수 | Phase 9.4에서 `api/public.api.ts`→이 파일로 이동(로직 변경 없음). `risk_event` 배열을 요약 항목으로 변환, `market_context`의 country_code/country_name/coordinates도 함께 매핑(지도 마커용) |
| `fetchMaterialPriceTrends` | 원자재 가격 추이 조회 함수 | Phase 9.4에서 이동. 자재별 합성 가격 지수(기준일=100) 시계열 반환 |
| `fetchMaterialPriceSummaries` | 원자재 가격 요약 카드 조회 함수 | Phase 9.4에서 이동. 자재별 등락률/리스크 지수/등급 반환 — `change_label`/`risk_score`/`grade`는 mock 임시값(`docs/mock-schemas.md` 참고), `material`만 실제 연동 키 |
| `fetchMaterialRiskGauges` | 원자재 리스크 개요 게이지 카드 조회 함수 | Phase 9.4 신규, surin `materialRiskGauges` 이식. 리튬/니켈/흑연 3종 반환(전 필드 mock 임시값, `grade`는 3단계 `RiskGrade`로 매핑) |
| `fetchScoreCards` | 원자재 리스크 개요 점수 카드 조회 함수 | Phase 9.4 신규, surin `summaryScores` 이식. 외부 리스크 종합 점수/ERP 영향 점수 2종 반환(전 필드 mock 임시값) |
| `fetchImportDependency` | 수입 의존도 조회 함수 | Phase 9.4 신규, surin `importDependency` 이식. 국가별 수입 비중 반환(전 필드 mock 임시값) |

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
| `MaterialPriceSeries` | 원자재 가격 시계열 타입 | 자재/단위/포인트 배열. **2026-08-03** — base_date(선택, 지수 100 기준일)/countries(선택, `SourcingCountry[]`) 추가 |
| `NewsFeedItem` | 뉴스 속보 항목 타입 | 리스크 이벤트ID(risk_event_id)/날짜/자재/출처/헤드라인/신뢰도. **2026-08-03** — collected_at/grade(선택)/headline_original/translated/country_code(nullable)/url(nullable) 추가(minji 이식) |
| `KpiSummaryItem` | KPI 요약 카드 항목 타입 | 라벨/값/단위 |
| `RiskExposureByUnit` | 사업부별 리스크 노출도 타입 | 사업부명/노출도 점수 |
| `VendorRiskHistoryItem` | 협력사 리스크 이력 항목 타입 | 공급사ID/명/90일 이력 건수/최신 등급·신뢰도 |
| `PlanningDashboardResponse` | 2계층 대시보드 응답 타입 | business_unit + period + kpi_summary + risk_exposure_by_unit + vendor_risk_history |
| `CumulativeRiskKpi` | 누적 리스크 KPI 타입 | 탐지/응답 건수·비율, 심각 건수, 평균 대응 소요 |
| `SavingsSimulation` | 절감 시뮬레이션 타입 | is_simulation(항상 true)/예상 절감액/가정 |
| `EnterpriseRiskSummaryItem` | 전사 리스크 요약 항목 타입 | 사업부명/노출도 점수/추세 |
| `ExecutiveDashboardResponse` | 3계층 대시보드 응답 타입 | period + cumulative_risk_kpi + savings_simulation + enterprise_risk_summary |
| `MaterialRiskGaugeItem` | 원자재 리스크 게이지 카드 타입 | Phase 9.4 신규 — name/basis/grade/changeLabel(선택) |
| `ScoreCardItem` | 점수 카드 타입 | Phase 9.4 신규 — label/score/grade/diffLabel(선택) |
| `ImportDependencyBreakdownItem` | 수입 의존도 국가별 비중 항목 타입 | Phase 9.4 신규 — label/value/color. **2026-08-03** — color 필수→선택 완화, country_code(선택) 추가 |
| `ImportDependencyData` | 수입 의존도 타입 | Phase 9.4 신규 — total/year(선택)/breakdown. **2026-08-03** — base_date(선택) 추가 |
| `SourcingCountry` | 조달 국가 타입(2026-08-03 신규) | 국가코드/국가명 — `MaterialPriceSeries.countries`(선택)가 참조, 가격 추이 국가 필터용 |
| `ExchangeRateItem` | 환율 밴드 통화 1건 타입(2026-08-03 신규) | 통화코드/통화명/고시단위/표기라벨/환율/등락액/등락률/등락라벨/고시출처/재정환율여부 |
| `ExchangeRateBoard` | 환율 밴드 전체 타입(2026-08-03 신규) | 고시일(nullable)/기준통화/rates 배열 |
| `RiskMonitoringEvent` | 리스크 모니터링 이벤트 목록 항목 타입(2026-08-03 신규) | 이벤트ID(숫자)/등급(nullable)/신뢰도/멀티에이전트완료여부/헤드라인(원문·번역여부)/자재/국가코드·국가명(nullable)/수집시각/출처 |
| `RiskExternalSignal` | 외부 신호 타입(2026-08-03 신규) | Goldstein/Tone/관련뉴스건수/위험점수/severity/사유코드 배열, 전부 nullable |
| `ProcurementRiskAssessment` | 멀티에이전트 종합 평가 타입(2026-08-03 신규) | assessment_id/완료여부/위험단계/위험점수/외부신호·ERP노출·계약공백 점수/사유배열/검증통과여부/평가시각 |
| `RiskMonitoringDetail` | 리스크 모니터링 이벤트 상세 타입(2026-08-03 신규) | `RiskMonitoringEvent` 확장 — 요약/영향도메인/좌표/원문URL/external_signal/procurement_risk/ERP영향분석가능여부·차단사유 |
| `MaterialRiskSummary` | 원자재 위험 KPI 타입(2026-08-03 신규) | 평가자재수/심각·주의·정상·평가불가 건수/평균재고일수/데이터품질/기준시각 |
| `MaterialRiskItem` | 자재별 위험 현황 1행 타입(2026-08-03 신규) | erp자재ID/자재명/자재대분류(nullable)/등급(nullable)/노출단계/점수(nullable)/재고·안전재고일수/공급사의존도비율/데이터품질/평가불가사유 |
| `MaterialRiskOverview` | 원자재 위험 화면 1회 로드분 타입(2026-08-03 신규) | summary + materials 배열 |
| `MaterialPrimarySupplier` | 주 공급사 타입(2026-08-03 신규) | erp공급사ID/공급사명/공급사상태/대체공급사확보상태/FEOC해당여부, 전부 nullable |
| `MaterialLinkedContract` | 연결 계약 타입(2026-08-03 신규) | contract_id/erp계약ID/계약번호/계약명/상태/시작일/종료일 |
| `MaterialRiskComponents` | ERP 노출도 세부 점수 5종 타입(2026-08-03 신규) | 공백위험/안전재고위험/의존도위험/발주지연위험/대체공급사위험 점수, 전부 nullable |
| `MaterialContractQuestion` | 계약 RAG 질의 1건 타입(2026-08-03 신규) | 질문코드/질문 |
| `MaterialRiskDetail` | 자재 상세 타입(2026-08-03 신규) | `MaterialRiskItem` 확장 — 단위/재고 수량 3종/일평균사용량/다음입고일·D-day/예상공급공백일수/재고스냅샷시각/주공급사/연결계약/세부점수/강제심각여부/계약검토필요여부/계약질의배열/경고배열/브리핑생성가능여부·차단사유/기준시각 |
| `ContractEvidenceItem` | 계약 RAG 검색 결과 청크 1건 타입(2026-08-03 신규) | 문서ID/계약ID·공급사ID·자재ID(nullable)/문서유형/청크인덱스/페이지/본문/유사도/mock임베딩여부 |
| `ContractEvidence` | 계약 RAG 근거 응답 타입(2026-08-03 신규) | erp자재ID/연결계약/질의배열/실제질의문자열/결과배열/mock여부 |
| `ContractSummary` | 계약 요약 타입(2026-08-03 신규) | contract_id/erp계약ID/계약명/상태/시작·종료일/통화/공급사ID·erp공급사ID·공급사명/국가코드/자재ID·erp자재ID·자재명·자재대분류/문서건수/색인청크건수 |
| `ContractClauseHit` | 조항 검색 결과 카드 1건 타입(2026-08-03 신규) | 문서ID/청크인덱스/페이지/조항제목/조항번호(nullable)/원문표제(nullable)/유사도/본문/콘텐츠해시/출처/contract(nullable) |
| `ContractClauseSearchResult` | 조항 검색 응답 타입(2026-08-03 신규) | 질의/범위('all'\|'filtered')/contract_id(nullable)/결과건수/mock여부/임베딩유형·버전/결과배열 |
| `ContractDocument` | 계약 문서 1건 타입(2026-08-03 신규) | 문서ID/원본파일명/문서유형/MIME/파일크기/처리상태/청크건수/임베딩유형·버전/에러코드·메시지/생성·처리시각 |
| `ContractDetail` | 계약 문서 상세 타입(2026-08-03 신규) | contract + documents 배열 + 임베딩유형·버전/mock임베딩여부/브리핑생성가능여부·차단사유 |
| `ContractUploadResult` | 계약서 업로드 결과 타입(2026-08-03 신규) | 문서ID/contract_id/원본파일명/처리상태/청크건수/임베딩유형·버전/중복여부/mock여부/처리시각 |
| `ContractReprocessResult` | 문서 재처리 결과 타입(2026-08-03 신규) | contract_id/전체·성공·실패 건수/문서별 결과 배열 |
| `ContractEvidenceRef` | "근거로 사용하기"로 담은 조항 타입(2026-08-03 신규) | 문서ID/청크인덱스/조항제목 |
| `AiBriefingSource` | AI 브리핑 진입 경로 타입(2026-08-03 신규) | `'NEWS' \| 'MATERIAL' \| 'CONTRACT'` |
| `AiBriefingContext` | 분석 대상 프리필 타입(2026-08-03 신규) | 진입경로/참조값/제목/뉴스ID·분석ID(nullable)/외부신호헤드라인/erp자재·공급사·계약ID/contract_id/자재명·대분류/국가코드/영향도메인/외부신호단계·점수/생성가능여부·차단사유 |
| `AiBriefingErpEvidence` | ERP 노출 근거 타입(2026-08-03 신규) | 노출점수·단계/재고·안전재고일수/다음입고D-day/예상공급공백일수/공급사의존도비율/입고전소진여부 |
| `AiBriefingStep` | 분석 근거 1칸 타입(2026-08-03 신규) | 라벨/단계(nullable)/점수(nullable)/비고(nullable) |
| `AiBriefingEvidenceChain` | 분석 근거 4칸 타입(2026-08-03 신규) | external_signal/erp_exposure/contract_rag/final_risk(각 AiBriefingStep) |
| `AiBriefingVerification` | 검증 메타데이터 타입(2026-08-03 신규) | 검증통과여부/LLM사용여부·에러/경고건수·배열/contract_id·페이지/가중치버전/mock여부 |
| `AiBriefingDetail` | 브리핑 상세 타입(2026-08-03 신규) | 생성 응답과 재조회 응답이 공유. briefing_id/assessment_id/진입경로·참조값/제목/뉴스ID/분석ID/외부신호헤드라인/erp연결 3종/contract_id/자재명·대분류/영향도메인/composite여부/구매위험단계·점수/본문/사유·권고배열/erp_evidence/계약근거배열/evidence_chain/verification/생성시각 |
| `AiBriefingListItem` | 최근 브리핑 카드 1건 타입(2026-08-03 신규) | briefing_id/진입경로/제목/뉴스ID/구매위험단계·점수/composite여부/검증통과여부(nullable)/생성시각 |

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

### `components/layout/AlertsBellButton.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AlertsBellButton` | 헤더 알림 벨 아이콘 컴포넌트 | 2026-07-27 신규(오류 및 기능 미흡 발견 #7). `Header`의 `accountExtra` 슬롯에 들어감. `count`(배지 숫자, 펼침/접힘과 무관하게 항상 표시)/`onMouseEnter`/`onMouseLeave`는 공통, hover 이벤트는 그대로 상위로 올려보내 디바운스 판단은 호출부가 맡는다(트리거와 콘텐츠가 화면상 떨어져 있어서). **2026-08-04(D 배치) 갱신 — 두 모드**: `onOpenAlerts?`가 있으면(신규, `/public`) 클릭 시 패널을 열고 "주요 알림" 탭으로 옮김(`aria-expanded` 미부여), 없으면(기존, `/purchasing`) `expanded`/`onToggle`로 펼침/접힘 토글(`aria-expanded` 부여) — `/purchasing`의 `PurchasingDashboardPage.tsx`가 여전히 옛 계약을 쓰고 있어 tier1처럼 완전 교체하지 않고 두 모드를 분기 |

### `components/layout/Header.tsx`
| physical | logical | 역할 |
|---|---|---|
| `Header` | 공통 헤더 컴포넌트 | 좌측에 홈 아이콘 링크(브랜드 텍스트 링크와 별개)+브랜드 텍스트 링크(둘 다 "/" 이동, sticky 상단 고정) + 우측 액션 슬롯(children). 로그인 상태면 계정 정보(이메일·계층)와 로그아웃 버튼, 미로그인 상태면 로그인/회원가입 버튼을 표시(Phase 8.5부터 모든 화면·비로그인 공개 대시보드 포함 대칭 적용) — 로그아웃은 SPA navigate와 인증 상태 갱신 간 경쟁을 피하려 하드 리다이렉트(`window.location.href`) 사용. 2026-07-27 — `accountExtra`(선택) prop 추가 — 계정 정보와 로그아웃 버튼 사이에 렌더링(예: `AlertsBellButton`), 미전달 시 기존과 완전히 동일(다른 소비처 무변경) |

### `components/layout/SideNav.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SideNavItem` | 사이드 메뉴 항목 타입 | 라벨/href |
| `SideNav` | 사이드 메뉴 컴포넌트 | 하위 화면이 많은 대시보드용 좌측 내비게이션(`Link` 기반). Phase 9.4부터 `useSideNavState()`의 `collapsed`를 읽어 폭 0으로 접힘(내부 `<Link>`에 `tabIndex={-1}`, `<nav>`에 `aria-hidden` 적용) |

### `components/layout/SideNavToggleButton.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SideNavToggleButton` | SideNav 접기/펼치기 토글 버튼 컴포넌트 | Phase 9.4 신규. `useSideNavState()`의 `collapsed`/`toggle` 사용, 인라인 SVG 쉐브론(`aria-label`/`aria-expanded`). SideNav가 접히면 폭이 0이 돼 내부 요소가 클릭 불가능해지므로 SideNav 바깥(각 페이지 `.body`, `<SideNav>` 바로 앞)에 별도로 둔다. `position:sticky;top:var(--header-height)`가 누락돼 페이지 스크롤 시 버튼만 SideNav와 달리 사라지던 버그를 수정(2026-07-27) — SideNav `.wrapper`와 동일한 sticky 처리 적용 |

### `components/layout/SidePanelToggleButton.tsx`(신규, 2026-08-04, tier1 재동기화 D 배치)
| physical | logical | 역할 |
|---|---|---|
| `SidePanelToggleButton` | 우측 `DashboardSidePanel` 접기/펼치기 토글 버튼 컴포넌트 | `useAlertsPanelState()`의 `expanded`/`toggle` 사용. `SideNavToggleButton`과 생김새는 같지만 `position: fixed`로 패널 위에 얹는다(흐름 안에 두면 페이지 섹션 점과 패널 사이가 버튼 폭만큼 벌어짐) — 펼침 상태에서 `right: var(--side-panel-width)`로 패널 왼쪽 가장자리에 붙어 따라간다. 화살표 방향은 누르면 패널이 갈 쪽(펼침→오른쪽, 접힘→왼쪽). 예전엔 헤더 알림 벨이 이 역할을 겸했으나(벨을 누르면 뉴스 상세 탭이 열려 트리거·결과 불일치), 이제 벨은 열기만 하고 이 버튼이 접기/펼치기를 전담 |

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

### `components/ui/DonutChart.tsx`
| physical | logical | 역할 |
|---|---|---|
| `DonutChart` | 도넛 차트 컴포넌트 | Phase 9.4 신규, surin `DonutChart` 이식(recharts `Pie`/`Cell`). 고정 180x180px 컨테이너라 `ScrollCard` 기본 `scrollable`(true) 상태에서도 `ResponsiveContainer` 되먹임 리사이즈가 재현되지 않는다(사전 실측 확인) |

### `components/ui/HorizontalScrollHint.tsx`
| physical | logical | 역할 |
|---|---|---|
| `HorizontalScrollHint` | 가로 스크롤 좌우 오버플로 힌트 컴포넌트 | 2026-07-27 신규. `showLeft`/`showRight`만 props로 받는 최소 인터페이스 — 대개 `useScrollOverflowHint(axis:'horizontal')`의 반환값을 그대로 연결. `MaterialRiskOverviewRow`(자재 상세 그리드)와 `MaterialRiskOverviewSection`(요약 행)에 각각 중복돼 있던 동일한 그라데이션+화살표 CSS/JSX(26줄)를 공용화하며 추출 — 코드 정리 조사에서 두 파일 간 설명 주석 불일치(한쪽에만 SideNav/AlertsPanel 유래 설명이 있음)를 발견한 것이 계기. 같은 날 후속(오류 및 기능 미흡 발견 #6-1) — 선택적 `onClickLeft`/`onClickRight` prop 추가, 전달되면 `<button aria-label>`로(클릭 시 `scrollHorizontalByPage`로 "카드 1장 겹치는" 페이징 이동), 안 주면 기존과 동일하게 `<div aria-hidden>` 순수 시각 힌트로 렌더링(하위 호환). 두 소비처 모두 이 클릭 기능을 연결해 씀 |

### `components/ui/PageSectionDots/PageSectionDots.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PageSectionDotsSection` | 도트 섹션 정의 타입 | `id`(표시명)+`headingId`(관찰 대상 heading의 DOM id) |
| `PageSectionDots` | 페이지 섹션 이동 도트 인디케이터 컴포넌트 | Phase 10.7 신규. `sections`의 heading들을 `IntersectionObserver`로 다중 관찰해 뷰포트에 보이는 섹션 도트를 활성 표시(여러 개 동시 활성 가능), 클릭 시 `scrollIntoView`. 2026-07-27 — `rootMargin: -{header-height}px 0px -60% 0px`를 추가해 sticky Header에 가려지는 상단을 관찰 대상에서 제외하고 "뷰포트 상단 40%" 기준선으로 좁힘(통상적 스크롤스파이 기법). 같은 날 후속 수정 4건 — (1) 마지막 섹션이 rootMargin 조건을 영영 만족 못 해 active가 안 되던 사각지대(C7)를 "문서 하단 도달" 별도 감지로 해소, (2) 도트 호버 시 `useHoverDisclosure` 기반 hover 툴팁(각 배지를 자기 도트와 동일한 y좌표에 개별 고정 배치, 대상 도트가 바뀌면 1단계로 리셋, 현재 활성 섹션 강조) 추가, (3) 클릭 시 스크롤 대상을 heading이 아니라 `ScrollCard`의 `.panel`(section 컨테이너)로 변경 — `scroll-margin-top: var(--header-height)`도 `ScrollCard.module.css`의 `.title`(heading)이 아니라 `.panel`에 걸어야 heading 위 카드 padding까지 포함해 정확히 헤더 아래로 오게 된다(heading에만 걸면 그 위 padding만큼 카드 테두리가 헤더 뒤로 가려짐, 실측 확인 — 소급 정정), (4) 배지-도트 세로 중앙 정렬 버그 수정 — `.dot`(button)의 기본 `display:inline-block`이 인라인 서식 문맥을 만들어 부모 `<li>` 렌더링 높이가 버튼 자체 8px이 아니라 상속된 line-height(약 19px)로 부풀려지고 버튼도 `vertical-align:baseline`으로 배치돼 li 중앙과도 어긋나던 것(8개 도트 전수 실측 시 항상 배지가 도트보다 7px 위, `diff:-7`)이 근본 원인 — `.dot`에 `display:block`을 줘 li 높이를 정확히 8px로 맞추고, `.hoverPanel`도 고정 px 오프셋(`-8px`) 대신 `top:50%; transform:translateY(-50%)`(li 중앙 기준 퍼센트 정렬)로 되돌려 li 중앙=도트 중앙이 구조적으로 보장되게 함(수정 후 8개 도트 전수 `diff:0`), (5) (4)의 부수 효과로 발생한 도트 간격 회귀 수정 — `.dot`의
`display:block` 전환이 li 높이를 19px→8px로 줄이며 `.dots`의 `gap`(`var(--space-2)`, 8px)과
합쳐진 실제 간격도 27px(19+8)→16px(8+8)로 함께 좁아졌고, 2단계 hover 시 24px 고정 높이
배지 8개가 서로 8px씩 겹치는 회귀로 이어짐(실측 확인). li 높이(=정렬 기준)는 8px로 그대로
두고 `.dots`의 `gap`만 `var(--space-6)`(24px)로 늘려 간격을 32px(8+24)로 복구 — 배지끼리도
8px(32-24) 여유가 생겨 겹침 해소, 정렬(`diff:0`)은 그대로 유지 |
| `BOTTOM_THRESHOLD_PX` | 문서 하단 도달 판정 여유값(2px) | C7 해소용 — 특정 콘텐츠의 부족분을 메우는 값이 아니라 픽셀 반올림 오차만 흡수하는 값 |

### `components/ui/RiskGauge.tsx`
| physical | logical | 역할 |
|---|---|---|
| `RiskGauge` | 3단계 리스크 게이지 컴포넌트 | Phase 9.4 신규, surin `RiskStepGauge` 이식. surin의 4단계 대신 기존 3단계 `RiskGrade`(`components/ui/RiskGradeBadge.tsx`)를 재사용하고, 점 색상도 리터럴 hex 대신 `--color-risk-*` 토큰을 사용 |

### `components/ui/RiskGradeBadge.tsx`
| physical | logical | 역할 |
|---|---|---|
| `RiskGrade` | 리스크 등급 타입 | `'정상' \| '주의' \| '심각'` |
| `RiskGradeBadge` | 리스크 등급 배지 컴포넌트 | 등급별 색상(`--color-risk-*`) 배지 |

### `components/ui/ScrollCard/ScrollCard.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ScrollCard` | 카드형 UI 공통 컨테이너 컴포넌트 | 제목(`title`)+헤더 우측 컨트롤(`actions`)+부제(`caption`)+스크롤 영역 밖 고정 콘텐츠(`pinnedTop`)+스크롤 본문(`children`)+하단 고정 안내(`footer`) 슬롯 구조. 본문에 기본적으로 `min-height:0`+`overflow-y:auto`를 캡슐화해, 부모 레이아웃이 카드 높이를 제약하는 경우(예: 비로그인 공개 대시보드 2x2 그리드)에만 내부 스크롤이 실제로 발동하고 그 외에는 자유롭게 늘어난다. `fillHeight`는 형제와 높이를 맞춰야 하는 카드용(`height:100%`). `scrollable`(기본 `true`)을 `false`로 주면 본문에 `overflow: visible`이 적용돼 스크롤이 배제된다(레이아웃 속성인 `flex:1`/`min-height:0`은 유지) — Recharts `ResponsiveContainer`처럼 스크롤 컨테이너 안에서 폭을 잘못 재측정하는 콘텐츠용(MaterialPriceDetail에서 실사용, 트러블슈팅으로 확인). 신규 카드형 컴포넌트는 이 컴포넌트를 사용하고 자체 `.panel`/`.title` 스타일을 새로 만들지 않는다(CLAUDE.md). `.panel`(section 컨테이너)에 `scroll-margin-top: var(--header-height)`를 줘(2026-07-27, 최초 `.title`에 걸었다가 같은 날 `.panel`로 정정 — heading에만 걸면 그 위 카드 padding만큼 테두리가 헤더 뒤로 가려짐) `PageSectionDots`의 `scrollIntoView`(대상도 heading이 아니라 이 `.panel`로 함께 변경)가 sticky Header에 안 가리는 위치로 이동하게 한다 |

### `components/widgets/GlobalRiskBoard.tsx`
| physical | logical | 역할 |
|---|---|---|
| `GlobalRiskBoard` | 글로벌 리스크 관제 맵 컴포넌트 | Phase 9.1 구현, Phase 9.4에서 `features/public/components/`→여기로 승격(구매팀 대시보드도 재사용, 로직 변경 없음). `react-leaflet`+`world-atlas`+`topojson-client` 기반 인터랙티브 세계지도. "이벤트뷰"(개별 좌표 마커)/"국가뷰"(country_code 기준 집계, 대표 이벤트=최고 심각도) 토글, 마커 클릭 시 컴포넌트 내부 상세 패널에 관련 risk_event 리스트 표시. country_code 없는 이벤트는 마커 제외. `ScrollCard` 도입(지도는 `pinnedTop`으로 항상 고정 노출, 뷰토글은 `actions`, 클릭 시 상세 리스트만 스크롤 영역인 `children`). 2026-07-27 — 마커 hover 시 `confidence_label`을 permanent Tooltip 안에 조건부로 추가 노출(`hoveredKey` state, `CircleMarker`의 `eventHandlers.mouseover`/`mouseout`로 갱신) — Leaflet은 레이어 하나에 Tooltip을 하나만 바인딩할 수 있어 별도 hover 전용 Tooltip을 새로 못 붙이는 제약 때문에 기존 permanent Tooltip을 그대로 확장하는 방식을 씀(`useHoverDisclosure`/커스텀 오버레이는 채택 안 함, 근거는 `docs/roadmap-candidates.md` C9 참고). 국가뷰는 대표(`representative`) 이벤트의 confidence_label을 그대로 사용 |

### `components/widgets/MaterialPriceDetail.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialPriceDetail` | 원자재 가격 추이 컴포넌트 | Phase 9.3 구현, Phase 9.4에서 `features/public/components/`→여기로 승격(구매팀 대시보드도 재사용, 로직 변경 없음). surin RiskMonitoring.tsx 시각 이식(필터行/요약카드 3장/기간버튼/Recharts 멀티라인 차트). "원자재" 드롭다운만 실제로 차트 계열을 필터링, "국가·지역"과 기간 버튼은 의도적으로 표시 전용(확정된 범위). `ScrollCard` 도입(필터行+요약카드는 `pinnedTop`으로 항상 고정 노출). 차트 영역은 `scrollable={false}`로 스크롤 제외 |

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

> **삭제됨(2026-08-03, 9번 섹션)**: `ExchangeRateBand.tsx`/`MaterialPriceTrendCard.tsx` — 잘못된
> 브랜치(`origin/minji`) 기준 산출물, tier1 본문 12섹션 구조로 대체되며 소비처가 사라져 삭제.

### `features/public/components/DashboardSidePanel.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `DashboardSidePanel` | 대시보드 우측 패널 컴포넌트 | 탭 3개(뉴스 상세/주요 알림/브리핑)+`UploadCard`. `expanded`/`isPreviewing`/`onPreviewMouseEnter`/`onPreviewMouseLeave` prop 계약은 기존 `AlertsPanel`과 동일. **2026-08-04(D 배치) 갱신**: `isNewsLoading?`/`isAlertsLoading?`/`isBriefingsLoading?`(탭별 `Skeleton` 자리표시자)·`focusAlertsToken?`(0=아직 안 누름, 오를 때마다 "주요 알림" 탭 강제 전환) prop 추가, `selectedNews` 참조 변경 시 "뉴스 상세" 탭 자동 복귀 `useEffect` 신규(둘 다 `react-hooks/set-state-in-effect` eslint-disable 적용 — tier1 원본에도 동일 lint 에러 있음 확인) |

### `features/public/components/LatestNewsPanel.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `LatestNewsPanel` | 최신 뉴스 목록 컴포넌트 | 번호 매긴 페이징 목록, 제목 클릭 시 우측 "뉴스 상세" 탭 전환·원문 링크는 별도 — `isLoading` prop 추가(2026-08-04, tier1 재동기화 1차 배치, 목록 모양 그대로의 `Skeleton` 자리표시자 5줄) |

### `features/public/components/MaterialRiskGaugeGrid.tsx`(신규, 2026-08-04, tier1 재동기화 1차 배치)
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskGaugeGrid` | 원자재별 리스크 게이지 그리드 컴포넌트 | `MaterialRiskSummaryTable`과 같은 배열(`MaterialRiskSummaryItem[]`)을 게이지 7장으로 다시 그림, 기본 접힘+더보기(Disclosure). tier1이 삭제한 `MaterialRiskOverviewSection`을 이 화면에서 대체(`/purchasing`의 동명 컴포넌트는 그대로 유지, `docs/mock-schemas.md` 10번 섹션 참고) |

### `features/public/components/LiveNewsMarquee.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `LiveNewsMarquee` | 실시간 뉴스 헤드라인 마퀴 컴포넌트 | 헤드라인 무한 스크롤 + 우측 환율 칩 순환 표시(`RATE_ROTATE_MS`), hover 시 정지 |

### `features/public/components/MaterialRiskSummaryTable.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskSummaryTable` | 원자재별 리스크 점수 테이블 컴포넌트 | 자재 7종 고정, 최종 합성 점수·24시간 대비·주요 이슈·"대응 완료" 버튼 — `isLoading` prop 추가(2026-08-04, tier1 재동기화 1차 배치, 7줄 `Skeleton` 자리표시자) |

### `features/public/components/PublicErpImpactPanel.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `PublicErpImpactPanel` | ERP 영향 자재 재고 계약 분석 패널 컴포넌트 | `features/purchasing/components/ErpImpactPanel.tsx`(이름 충돌)와 분리, `materials` prop — 데이터 품질 라벨·색 등급을 신규 공용 모듈 `lib/dataQuality.ts`로 추출(2026-08-04, tier1 재동기화 1차 배치) |

### `features/public/components/PublicMaterialRiskStatusPanel.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `PublicMaterialRiskStatusPanel` | 원자재 공급사 리스크 현황 패널 컴포넌트 | `features/purchasing/components/MaterialRiskStatusPanel.tsx`(이름 충돌)와 분리, `materials` prop |

### `features/public/components/PublicPurchasePriorityPanel.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `PublicPurchasePriorityPanel` | 구매 대응 우선순위 패널 컴포넌트 | `features/purchasing/components/PurchasePriorityPanel.tsx`(이름 충돌)와 분리, `materials` prop — `isLoading` prop 추가 + **평가 불가 자재를 순위에서 빼고 목록 아래 별도 영역으로**(2026-08-04, tier1 재동기화 1차 배치) — `toPurchasePriority()` 반환 타입이 `MaterialRiskItem[]`에서 `{ ranked, unavailable }`로 바뀜 |

### `features/public/components/PurchasingDashboardHeader.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `PurchasingDashboardHeader` | 대시보드 본문 제목줄 컴포넌트 | "구매 위험 관제 대시보드" 타이틀+기준일 칩(`asOfDate` 없으면 숨김) |

### `features/public/components/PurchasingKpiRow.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `PurchasingKpiRow` | 상단 KPI 5칸 컴포넌트 | 심각·주의 원자재 종수/ERP 영향도/외부 위험/검증 브리핑, 각 칸 24시간 전 대비 보조 값(증감 기호 없음, 24시간 줄만 단위가 `건`으로 갈림) — `isLoading` prop 추가(2026-08-04, tier1 재동기화 1차 배치, `Skeleton` 자리표시자) |

### `features/public/components/SupplierOverviewPanel.tsx`(신규, 2026-08-03, tier1 이식)
| physical | logical | 역할 |
|---|---|---|
| `SupplierOverviewPanel` | 공급사 현황 및 대체 공급사 추천 패널 컴포넌트 | 좌: 현재 공급사(ERP 발주 실적), 우: 추천 대체 공급사(분석 저장 결과) — 원천이 다른 두 시점 병기, `isLoading` prop 추가(2026-08-04, tier1 재동기화 1차 배치) |

### `features/public/components/SupplyNewsFeed.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SupplyNewsFeed` | 실시간 뉴스 속보 컴포넌트 | risk_event 기반 최신순 뉴스 리스트. `ScrollCard` 도입(리스트가 `children`) |

### `features/public/pages/PublicDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PublicDashboardPage` | 비로그인 공개 대시보드 페이지 | 공통 `Header`(3계층 탭을 children으로 전달) + 4개 패널 2x2 그리드. 탭 클릭 시 인증 상태에 따라 대시보드 또는 /auth로 이동. Phase 8.5 전에는 `Header`를 쓰지 않고 로그인 여부와 무관하게 로그인 버튼을 무조건 노출하는 자체 상단바를 갖고 있었음(버그, qa-checklist.md A/B 계기). 2026-07-27 — 글로벌 리스크 관제 지도만 `fetchPublicRiskBoard()`(비동기, `useState`/`useEffect`)로 전환. **2026-08-03(minji 이식)** — 나머지 3개 패널도 전부 비동기 전환 + `ExchangeRateBand`(지도 위 가로 띠) + `ImportDependencyPanel`/`MaterialPriceTrendCard`(4번째 행) + `Footer` 추가, 기간 탭(`period`) 상태를 페이지가 소유해 `MaterialPriceDetail`에 전달 |

### `features/public/pages/PublicRiskMonitoringPage.tsx`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `PublicRiskMonitoringPage` | 비로그인 리스크 모니터링 페이지 | minji `RiskMonitoringPage.tsx` 이식 — `Header`+`SideNav`(`PUBLIC_SIDE_NAV_ITEMS`)+`Footer` 레이아웃, 좌측 이벤트 목록+우측 상세 2단. `RequireAuth`/`isRiskMonitoringApiConfigured` 가드 제거(완전 공개), "ERP·계약 영향 분석" 클릭 시 `/public/ai-briefing?source=NEWS&ref=`으로 이동 |

### `features/public/pages/PublicMaterialRiskPage.tsx`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `PublicMaterialRiskPage` | 비로그인 원자재 위험 페이지 | minji `MaterialRiskPage.tsx` 이식 — 상단 KPI 4장 + 좌측 자재 목록 + 우측 상세 2단. "AI 브리핑 생성" 클릭 시 `/public/ai-briefing?source=MATERIAL&ref=`으로 이동 |

### `features/public/pages/PublicContractRagPage.tsx`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `PublicContractRagPage` | 비로그인 계약·RAG 검색 페이지 | minji `ContractRagPage.tsx` 이식 — 좌측 조항 검색 결과 + 우측 계약 문서 2단. "이 근거로 AI 브리핑 생성" 클릭 시 `/public/ai-briefing?source=CONTRACT&ref=`으로 이동 |

### `features/public/pages/PublicAiBriefingPage.tsx`(신규, 2026-08-03)
| physical | logical | 역할 |
|---|---|---|
| `PublicAiBriefingPage` | 비로그인 AI 구매 브리핑 페이지 | minji `AiBriefingPage.tsx` 이식 — 상단 분석 대상 + 좌측 브리핑 본문 + 우측 분석 근거·최근 브리핑. `?source=&ref=` 쿼리스트링 유무로 두 진입 경로 분기 |

### `features/purchasing/components/AlertsPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `AlertsPanel` | 주요 알림 및 빠른 작업 패널 컴포넌트 | 등급 '심각' 또는 신뢰도 '경고' 항목 우선 노출(필터링은 `selectAlertEvents`, 소비처가 미리 걸러 `alerts` prop으로 전달). 2026-07-27 — `expanded`(펼침, `AlertsPanelContext`)/`isPreviewing`(접힘+호버 미리보기, 로컬) 두 상태로 분기: 펼침은 기존과 동일한 자체 sticky 패널+`useScrollOverflowHint`, 접힘은 `.wrapper`가 폭 0(SideNav 접기와 동일한 width 트랜지션), 그 상태에서 `isPreviewing`이면 상위 4개(`PREVIEW_COUNT`)를 `ScrollCard`로 감싼 `position:absolute` 오버레이가 opacity+transform으로 떠오름(항상 DOM에 렌더링해두고 클래스로만 토글 — 조건부 마운트면 등장/퇴장에 transition이 안 먹어서) |
| `AlertItem` | 알림 목록 항목(내부 헬퍼) | 등급/신뢰도 배지+요약, 전체 목록과 미리보기 양쪽에서 재사용 |
| `PREVIEW_COUNT` | 미리보기 표시 개수 상수(4) | design-tokens.md d항목("리스트 항목 4개 초과 시 overflow")과 일관되게 4로 고정 |

### `features/purchasing/components/ErpImpactPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ErpImpactPanel` | ERP 영향 자재 재고 계약 분석 패널 컴포넌트 | 재고 소진일수/대체 공급사/품질 검증 결과. Phase 9.4에서 자체 `.panel`/`.title` 대신 `ScrollCard`로 전환 |

### `features/purchasing/components/ImportDependencyPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ImportDependencyPanel` | 수입 의존도 도넛차트 패널 컴포넌트 | Phase 9.4 신규(데모 화면ID UX-01-DB, surin `importDependency` 이식). `ScrollCard`+`DonutChart`+범례 리스트. `DonutChart`는 고정 180x180px라 `ScrollCard` 기본 `scrollable`(true) 유지 |

### `features/purchasing/components/ImportDependencyRow.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ImportDependencyRow` | 수입 의존도+원자재 가격 추이 2컬럼 행 컴포넌트 | Phase 9.4 신규. `340px 1fr` grid(surin 비율 그대로) — `ImportDependencyPanel` + 승격된 `components/widgets/MaterialPriceDetail`. 2026-07-27 — 신설 이후 반응형 브레이크포인트가 없어(회귀 아님, 미구현) `940px`(SideNav 펼침 기준 실측) 이하에서 `1fr`(1컬럼)로 전환하는 미디어 쿼리 추가, 카드 순서(수입 의존도→원자재 가격 추이)는 그대로 유지. `docs/design-tokens.md` "카드 레이아웃·스크롤 규칙" f항(고정 px 컬럼 병렬 그리드 규칙) 신설 계기. `isPriceLoading?` 선택 prop 추가(2026-08-04, tier1 재동기화 1차 배치) — `MaterialPriceDetail`에 `isLoading`으로 그대로 전달, 두 곳 모두 선택적이라 이 컴포넌트를 무수정으로 호출하는 `/purchasing` 쪽에 영향 없음 |

### `features/purchasing/components/KpiSummaryPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `KpiSummaryPanel` | 상단 KPI 요약 패널 컴포넌트 | 전체/심각/주의/정상 건수 집계. Phase 9.4에서 자체 `.panel`/`.title` 대신 `ScrollCard`로 전환 |

### `features/purchasing/components/MaterialRiskOverviewRow.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskOverviewRow` | 원자재 리스크 상세 그리드 컴포넌트 | Phase 9.4 신규(데모 화면ID UX-01-DB, surin 이식), 더보기 구조 재정의(2026-07-27) 후 게이지 카드만 렌더링(`RiskGauge`+`RiskGradeBadge`) — 점수 카드는 `ScoreCardPanel`로 분리돼 더 이상 이 컴포넌트에 없음. 같은 날 실제 데이터가 없는 자재 6종(코발트/망간/구리/알루미늄/철광석/희토류, `PLACEHOLDER_MATERIALS`)을 제목만 있는 "준비 중" placeholder 카드로 추가(CLAUDE.md 부분 placeholder UI 원칙). 9장(3+6)으로 카드가 늘며 `grid-template-columns` 대신 `display:flex`+`overflow-x:auto`로 전환(design-tokens.md "스크롤 UI 노출 원칙" — 형제 카드 캐러셀형), 네이티브 스크롤바 노출 + 마우스 드래그(grab-to-scroll, `useHorizontalDragScroll` 공용 훅) 지원, 폭은 섹션의 실제 폭(100%)에 맞춤(고정 카드 수 계산 없음). `useScrollOverflowHint`를 `axis:'horizontal'`로 적용하고 `HorizontalScrollHint` 공용 컴포넌트로 좌우 힌트 표시(2026-07-27 — 개별 CSS/JSX 대신 공용화). 같은 날 후속 — 힌트에 `onClickLeft`/`onClickRight`(`scrollHorizontalByPage`) 연결해 클릭으로도 페이징 이동 가능(#6-1) |

### `features/purchasing/components/MaterialRiskOverviewSection.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskOverviewSection` | 원자재 리스크 개요 요약 행 컴포넌트 | 더보기 구조 재정의(2026-07-27) — 형제 카드 3장(원자재 `MaterialRiskSummaryCard` + 점수 카드 2장 `ScoreCardPanel`)을 한 row에 배치. "원자재" 카드의 더보기만 그 아래 `MaterialRiskOverviewRow`(자재 상세 그리드)의 펼침 상태(`expanded`)를 제어하고, 점수 카드는 더보기 대상에서 제외돼 항상 노출. 같은 날 후속 수정 — 카드 3장뿐이라도 SideNav 펼침 등으로 부모 폭이 좁아지면 줄바꿈되던 auto-fit grid를 `MaterialRiskOverviewRow`와 동일한 형제 카드 캐러셀형(flex+nowrap+overflow-x, `useHorizontalDragScroll`+`useScrollOverflowHint(axis:'horizontal')`+`HorizontalScrollHint` 공용 컴포넌트)으로 전환. 같은 날 후속 — 힌트에 `onClickLeft`/`onClickRight`(`scrollHorizontalByPage`) 연결해 클릭으로도 페이징 이동 가능(#6-1) |

### `features/purchasing/components/MaterialRiskStatusPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskStatusPanel` | 원자재 공급사 리스크 현황 패널 컴포넌트 | risk_event 리스트, 등급/신뢰도 배지 포함. Phase 9.4에서 자체 `.panel`/`.title` 대신 `ScrollCard`로 전환 |

### `features/purchasing/components/MaterialRiskSummaryCard.tsx`
| physical | logical | 역할 |
|---|---|---|
| `MaterialRiskSummaryCard` | 원자재 리스크 요약 카드 컴포넌트 | 자재별 grade+changeLabel 미니 리스트 + 더보기/접기 토글 버튼. `expanded`/`onToggle`은 부모(`MaterialRiskOverviewSection`)로부터 props로 받는다(자체 state 없음) |

### `features/purchasing/components/PurchasePriorityPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PurchasePriorityPanel` | 구매 대응 우선순위 패널 컴포넌트 | 등급·재고 소진일 기준 파생 정렬 순위 리스트. Phase 9.4에서 자체 `.panel`/`.title` 대신 `ScrollCard`로 전환 |

### `features/purchasing/components/ScoreCardPanel.tsx`
| physical | logical | 역할 |
|---|---|---|
| `ScoreCardPanel` | 점수 카드 컴포넌트 | 더보기 구조 재정의(2026-07-27)로 `MaterialRiskOverviewRow` 내부 비export 헬퍼(`ScoreCard`)에서 분리 — "원자재" 카드와 형제 관계로 `MaterialRiskOverviewSection`의 요약 행에 항상 노출되며 더보기 대상이 아니다 |

### `features/purchasing/pages/BriefingDetailPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `BriefingDetailPage` | 1계층 브리핑 자료 열람 페이지 | Seq 24 "내부 브리핑 자료 열람 화면". `/purchasing/briefing/:riskEventId` — 계약 조항 요약/협상 포인트/산출물 메타 표시, RiskGradeBadge/ConfidenceBadge·Breadcrumb 재사용(Breadcrumb 첫 실사용). Phase 9.4부터 `SideNavToggleButton` 추가 |

### `features/purchasing/pages/PurchasingDashboardPage.tsx`
| physical | logical | 역할 |
|---|---|---|
| `PurchasingDashboardPage` | 1계층 구매팀 대시보드 페이지 | 사이드바(+`SideNavToggleButton`) + 단일 컬럼 + 우측 알림 패널(Figma 프레임 기준). Phase 9.4에서 데모(화면ID UX-01-DB) 요약 영역 3종(`MaterialRiskOverviewSection` → 승격된 `GlobalRiskBoard` → `ImportDependencyRow`)을 기존 4단 패널 위에 추가. 2026-07-27 — `selectAlertEvents`로 알림 필터링 후 `Header`의 `accountExtra`(`AlertsBellButton`)와 `AlertsPanel` 양쪽에 전달, hover 미리보기 디바운스(`PREVIEW_CLOSE_DELAY_MS`=150ms)+ESC 닫기 로컬 상태 관리 |
| `PREVIEW_CLOSE_DELAY_MS` | 알림 미리보기 닫힘 디바운스(150ms) | 트리거(헤더 벨)·콘텐츠(AlertsPanel)가 화면상 떨어져 있어 둘 다 벗어난 뒤 이 시간만큼 지나야 닫힘 |

### `lib/AuthContext.ts`
| physical | logical | 역할 |
|---|---|---|
| `AuthContextValue` | 인증 Context 값 타입 | orgTier/이메일/signIn/signOut — 이메일(email)은 Phase 8에서 Header 계정 정보 표시용으로 추가. **2026-08-03** — accessToken(nullable) 추가, signIn 세 번째 인자로 확장(`/public/*` API의 `fetchWithAuth` 호출용) |
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

### `lib/AlertsPanelContext.ts`
| physical | logical | 역할 |
|---|---|---|
| `AlertsPanelContextValue` | AlertsPanel Context 값 타입 | 2026-07-27 신규. `expanded`(펼침 여부)/`toggle`(토글 함수) — `SideNavContextValue`와 동일 형태. **2026-08-04(D 배치)** — `open`(접혀 있으면 펴고, 이미 펴져 있으면 무시) 추가 — 알림 벨이 `toggle`을 쓰면 브리핑 탭을 보다가 벨을 눌렀을 때 패널이 닫히는 문제가 있어 분리 |
| `AlertsPanelContext` | AlertsPanel Context 객체 | `AlertsPanelProvider`/`useAlertsPanelState`가 공유하는 React Context — `SideNavContext`와 동일 패턴 |

### `lib/AlertsPanelProvider.tsx`
| physical | logical | 역할 |
|---|---|---|
| `DEFAULT_ALERTS_EXPANDED` | AlertsPanel 기본 펼침 상태 상수(`true`) | 이 값 하나만 바꾸면 기본 동작(펼침/접힘)이 전체적으로 뒤집힌다(하드코딩 대신 이름 붙은 상수로 한 곳에 선언) |
| `AlertsPanelProvider` | AlertsPanel 펼침/접힘 상태 Provider 컴포넌트 | 2026-07-27 신규. `App.tsx`에서 `SideNavProvider` 안·`AppRoutes` 바깥에 래핑 — 지금은 `PurchasingDashboardPage` 하나만 쓰지만 페이지 이동(예: 브리핑 상세) 간에도 펼침 상태 유지가 필요해 `SideNavContext`와 동일하게 앱 최상위에 둠(실측: Purchasing→브리핑 상세→뒤로가기 왕복에서 유지 확인) |

### `lib/useAlertsPanelState.ts`
| physical | logical | 역할 |
|---|---|---|
| `useAlertsPanelState` | AlertsPanel 펼침/접힘 상태 접근 훅 | 2026-07-27 신규. `AlertsPanelProvider` 내부에서 `expanded`/`toggle` 제공, 범위 밖 사용 시 예외 발생(`useSideNavState`와 동일 패턴) |

### `lib/selectAlertEvents.ts`
| physical | logical | 역할 |
|---|---|---|
| `selectAlertEvents` | 알림 대상 risk_event 필터 함수 | 2026-07-27 신규, `AlertsPanel.tsx`에서 분리(react-refresh 규칙 — 컴포넌트 파일은 컴포넌트만 export). 등급 '심각' 또는 신뢰도 '경고'인 이벤트만 남김. `PurchasingDashboardPage`가 한 번 계산해 `AlertsPanel`(전체 목록)과 `AlertsBellButton`(배지 숫자, `alerts.length`) 양쪽에 내려줌 |

### `lib/SideNavContext.ts`
| physical | logical | 역할 |
|---|---|---|
| `SideNavContextValue` | SideNav Context 값 타입 | Phase 9.4 신규. `collapsed`(접힘 여부)/`toggle`(토글 함수) |
| `SideNavContext` | SideNav Context 객체 | `SideNavProvider`/`useSideNavState`가 공유하는 React Context — `AuthContext.ts`와 동일 패턴 |

### `lib/SideNavProvider.tsx`
| physical | logical | 역할 |
|---|---|---|
| `SideNavProvider` | SideNav 접기/펼치기 상태 Provider 컴포넌트 | Phase 9.4 신규. `App.tsx`에서 `AuthProvider` 안·`AppRoutes` 바깥에 래핑 — Purchasing/BriefingDetail/Planning 3개 페이지가 공유해 페이지 이동 간에도 접힘 상태 유지 |

### `lib/tierLabels.ts`
| physical | logical | 역할 |
|---|---|---|
| `TIER_LABEL` | org_tier별 한글 라벨 매핑 상수 | `Header`(계정 정보 표시)와 `app/routes.tsx`의 `RequireAuth`(계층 불일치 모달 메시지)가 공용으로 참조(Phase 8.5) — 이전엔 `Header.tsx`에 로컬 상수로 중복 정의돼 있었음 |

### `lib/useAuthState.ts`
| physical | logical | 역할 |
|---|---|---|
| `useAuthState` | 인증 상태 접근 훅 | `AuthProvider` 내부에서 orgTier/이메일/signIn/signOut 제공, 범위 밖 사용 시 예외 발생 |

### `lib/useScrollOverflowHint.ts`
| physical | logical | 역할 |
|---|---|---|
| `ScrollOverflowHint` | 스크롤 오버플로 힌트 타입 | `hasOverflowTop`/`hasOverflowBottom` — 필드명은 축과 무관하게 고정, 세로축은 위/아래, 가로축은 왼쪽/오른쪽으로 의미 해석 |
| `ScrollOverflowAxis` | 스크롤 오버플로 판단 축 타입 | `'vertical'`(기본) \| `'horizontal'`(자재 카드 가로 스크롤, 2026-07-27 신규) |
| `useScrollOverflowHint` | 스크롤 오버플로 힌트 감지 훅 | scroll 이벤트+`ResizeObserver`로 실제 오버플로·스크롤 위치 감지(`ScrollCard`/`SideNav`/`AlertsPanel`이 세로축으로, `MaterialRiskOverviewRow`/`MaterialRiskOverviewSection`이 가로축으로 재사용) |

### `lib/scrollHorizontalByPage.ts`
| physical | logical | 역할 |
|---|---|---|
| `scrollHorizontalByPage` | "카드 1장 겹치는" 페이징 스크롤 함수 | `container.clientWidth - 첫 번째 자식 카드의 실제 렌더링 폭`을 매번 계산해 그만큼 `scrollBy({behavior:'smooth'})` — 카드 폭을 하드코딩하지 않아 `MaterialRiskOverviewRow`(고정 180px)와 `MaterialRiskOverviewSection`(가변 240px+flex-grow)처럼 소비처별로 카드 폭이 달라도 그대로 맞는다. 실측 확인: 스크롤 가능 범위가 계산된 스텝보다 작은 경우(예: 카드 3장뿐이라 오버플로가 몇 px밖에 안 되는 행)는 `scrollBy`가 자연히 최대치로 클램프되어 "끝까지 스크롤"로 동작함(별도 처리 불필요) |

### `lib/useHorizontalDragScroll.ts`
| physical | logical | 역할 |
|---|---|---|
| `HorizontalDragScrollHandlers` | 가로 드래그 스크롤 핸들러 타입 | `isDragging`+`onMouseDown`/`onMouseMove`/`onMouseUp`/`onMouseLeave` |
| `useHorizontalDragScroll` | 가로 스크롤 grab-to-scroll 드래그 훅 | mousedown 시작 좌표/scrollLeft 기록 → mousemove로 scrollLeft 갱신 → mouseup/mouseleave 종료. `MaterialRiskOverviewRow`에서 처음 구현 후 `MaterialRiskOverviewSection`도 쓰게 되며 공용 훅으로 추출(2026-07-27) |

### `lib/useHoverDisclosure.ts`
| physical | logical | 역할 |
|---|---|---|
| `HoverDisclosure<T>` | 2단계 hover 디스클로저 상태 타입 | `hovered`(어느 트리거가 호버됐는지, 제네릭)+`expanded`(2단계 확장 여부)+`openHover`/`expandHover`/`closeHover` |
| `useHoverDisclosure` | 2단계 hover 디스클로저 상태 훅 | 순수 CSS `:hover` 대신 상태로 열림/확장/닫힘을 관리 — 트리거+콘텐츠를 하나의 컨테이너로 감싸고 컨테이너에만 `onMouseLeave`를 걸면(개별 트리거는 `onMouseEnter`만) DOM 포함 관계상 트리거→콘텐츠 이동 중엔 안 닫힘(WCAG 1.4.13 hoverable), `Escape`로도 닫힘(dismissible). `PageSectionDots`에서 처음 사용(2026-07-27) |

### `lib/useSideNavState.ts`
| physical | logical | 역할 |
|---|---|---|
| `useSideNavState` | SideNav 접기/펼치기 상태 접근 훅 | Phase 9.4 신규. `SideNavProvider` 내부에서 `collapsed`/`toggle` 제공, 범위 밖 사용 시 예외 발생 |
