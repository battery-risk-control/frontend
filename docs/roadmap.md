# 개발 로드맵

> 이 문서는 전체 그림 참고용이다. **각 작업 요청은 해당 시점의 Phase 범위로만 한정한다** — 뒤 Phase를 미리 구현하지 않는다. 명시적으로 다음 Phase를 요청받기 전까지는 그 범위를 건드리지 않는다.

- [x] Phase 1 — 프로젝트 스캐폴딩 (Vite+React19+TS, 폴더 구조, 의존성, tokens.css, 폰트)
- [x] Phase 2 — 육안 검증 (배경색·폰트 렌더링 확인)
- [x] Phase 3 — 공통 컴포넌트: `components/layout/*`(Header, Footer, SideNav, Breadcrumb, SkipLink), `components/ui/*`(ConfidenceBadge, RiskGradeBadge)
- [x] Phase 4 — 1계층 구매팀 대시보드 (MVP): `api/purchasing.api.ts` mock, KpiSummaryPanel/MaterialRiskStatusPanel/ErpImpactPanel/PurchasePriorityPanel/AlertsPanel
- [x] Phase 5 — 인증 플로우: 로그인/회원가입(스플릿스크린+탭 토글) + 승인대기 락 화면
- [x] Phase 5.5 — 라우팅 연결: react-router-dom 실제 연결, `/`(비로그인 공개 대시보드 자리, 아직 미구현), `/auth`, `/purchasing` 라우트 분리. App.tsx의 임시 단일 렌더링 제거
- [x] Phase 5.6 — 비로그인 공개 대시보드 (Seq 23): `features/public/` — 글로벌 리스크 관제 맵 / AI 기반 권고 조치 리스트 / 원자재 가격 추이 / 실시간 뉴스 속보 (2x2, 상단 탭+로그인 버튼). `/` 라우트를 여기로 연결하고 `/auth` 강제 리다이렉트 제거 (Phase 8.5에서 공용 Header 컴포넌트로 교체, 상단 UI는 로그인 상태에 따라 조건부 표시로 변경됨)
- [x] Phase 6 — 2계층·3계층 대시보드
- [x] Phase 6.5 — 페이지 간 내비게이션 + 최소 접근 제어: 공개 대시보드 상단 탭은 미로그인 시 /auth로 유도, 로그인 시 해당 계층 화면 접근 가능. 테스트 계정 3종(mock, 배포 전 삭제 대상으로 명시). 인증/각 대시보드에서 홈으로 돌아가는 경로 추가 (Phase 8.5에서 계층 불일치 시 무음 리다이렉트 대신 확인 모달 "내 화면으로 이동/취소"로 변경됨) — **(2026-07-27 갱신)** FE mock 테스트 계정(`src/api/auth.api.ts`의 `TEST_ACCOUNTS`, ①단계 전용, 배포 전 삭제 대상 원칙은 그대로 유지)과 별개로, 백엔드에도 같은 계정 4종(`purchasing`/`planning`/`executive@test.local`+`pending@company.com`)을 실제 DB에 시드하는 `AuthTestSeedConfig`가 추가됨(`AUTH_TEST_SEED_ENABLED=true`일 때만 동작, 기본 `false` — ②서비스 테스트/e2e 전용, 운영 비활성). 상세는 `docs/backend-integration-guide.md`·`docs/timeline.md` 참고.
- [x] Phase 7 — git remote 연결 및 첫 커밋 (권한 문제로 보류 중 — 첫 커밋/브랜치는 로컬에 존재)
- [x] Phase 8 — 접근 제어 보정 + 계정 UI + 1계층 하위 화면
  - RequireAuth에 실제 org_tier 매칭 추가 (계층 불일치 시 자신의 대시보드로 리다이렉트)
  - Header에 로그인 계정 정보(이메일/계층) 표시 + 로그아웃 버튼, Planning/Executive 페이지에도 Header 적용
  - 1계층 하위 화면: 브리핑 자료 열람 페이지 (Seq 24 "내부 브리핑 자료 열람 화면"), SideNav 플레이스홀더 해시(`#briefing` 등)를 실제 라우트로 연결
    - ⚠️ 각주(2026-07-24): 실제로는 미완료 — href에 `/purchasing` 경로 접두사만 붙였을 뿐 여전히 해시 기반 placeholder이며 대응 앵커 요소도 없음. Phase 10.9에서 재확인 예정

- [x] Phase 8.5 — 발견된 UX/일관성 오류 수정 (merge 전 필수)
  - PublicDashboardPage가 Header를 쓰지 않아 로그인 상태 표시가 반영 안 됨 → Header 재사용으로 통일
  - 로그인 상태에서 /auth 재진입 시 자동 리다이렉트 실동작 여부 재검증
  - 홈 복귀가 텍스트 링크 하나에만 의존 → 별도 홈 아이콘 추가
  - RequireAuth 계층 불일치 시 무음 리다이렉트 → 확인 모달("내 화면으로 이동"/"취소", 기본은 취소)로 변경
  - docs/qa-checklist.md 전체 항목 재점검

- [ ] Phase 9 — surin 브랜치 시각 요소 이식 (`dev-김영진_merge-test` 브랜치, git 히스토리 무관하므로 병합이 아닌 수동 이식)
  - 원칙: dev-김영진의 구조(3계층 분리+RequireAuth, 신뢰도 라벨, 공개 대시보드, PENDING 화면, api/types.ts 스키마, CSS Modules)는 유지. surin에서는 시각/위젯 구현만 가져온다. surin의 Tailwind·mock.ts·요구사항에 없는 추가 메뉴는 가져오지 않는다.
  - [x] 9.1 GlobalRiskBoard: surin의 react-leaflet 지도 이식 (최우선 — 격차 가장 큼)
  - [ ] 9.2 로그인/회원가입: surin AuthShell 비주얼 이식 — **보류(기존 dev-김영진 화면 유지 결정, 20260722)**. surin 비주얼 이식은 현재 우선순위 밖.
  - [x] 9.3 원자재 가격 추이(부분 완료, 2026-07-22~23): 전체보기/상세보기 토글, 상세보기 단독 유지 결정, 자재 드롭다운 실제 필터링, `ScrollCard` 공용 컴포넌트 도입(공개 대시보드 4개 카드 교체 포함), 애니메이션/스크롤 예외 처리(`scrollable={false}`) — surin `RiskMonitoring.tsx` 시각 이식(`d5ae9e3`/`bf68bb8`/`104c174`/`a670542`/`1938156`/`726b69f`). **"2·3계층 차트: surin 스타일 이식" 부분은 미착수** — Planning/Executive 차트 컴포넌트(`ComparisonChart`/`CumulativeRiskKpi` 등)는 Phase 6/8 이후 수정 이력이 없다(`git log` 확인). 원래 항목명이 두 범위를 함께 가리켜 착시가 있었음을 여기 기록. 상세는 `docs/roadmap-candidates.md` "C4" 참고.
  - [x] 9.4 구매팀 대시보드 UX-01-DB 데모 구조 반영 + ScrollCard 통일 + SideNav 접기: 5칸 리스크 게이지 그리드(`MaterialRiskOverviewRow`, surin `RiskStepGauge` 이식) → 지도(승격된 `GlobalRiskBoard` 재사용) → 도넛+가격추이 2단(`ImportDependencyRow`, surin `DonutChart` 이식) 요약 영역 신설, 기존 4개 패널 전체를 `ScrollCard`로 전환, `GlobalRiskBoard`/`MaterialPriceDetail`을 `components/widgets/`로 승격(공개 대시보드와 구매팀 대시보드가 공유), `SideNav` 접기/펼치기(Context 전역 상태) 추가
  - [ ] 9.5(후보) — 리스크 유형별 분포 차트: **미착수**. product-overview.md MVP 필수 항목이나 Seq 번호 없음, `risk_event` 스키마에 "유형" 관련 필드 자체가 없어 신규 필드 설계 선행 필요. 카테고리 출처·배치 화면 등 미결 사항은 `docs/roadmap-candidates.md` "C1" 참고
  - [ ] 9.6(후보) — ERP 영향 분석 화면 신설: **미착수**. surin `pages/ErpImpact.tsx`(`/erp-impact`)·데모 이미지에는 있으나 `docs/requirements-frontend.md`에 대응 Seq 항목이 없고 우리 레포엔 미구현. 상세는 `docs/roadmap-candidates.md` "C2" 참고

- [ ] Phase 10(후보) — 전체 앱 반응형 대응 — 이미 합의된 사항, 구매팀/기획팀/경영진 대시보드를 포함한 전체 화면의 반응형 대응 자체는 아직 착수 전. 아래 하위 항목은 진행 중 실제로 완료된 작업을 시간순으로 소급 번호 매김한 것(2026-07-26)이며, 전체 반응형 자체가 끝난 건 아니다.
  - [x] 10.1 — 공개 대시보드(Seq 23) 760px 미만 브레이크포인트(2x2 → 1열 4행) + 하단 콘텐츠 힌트(ScrollHint)를 실험적으로 도입(2026-07-23, `5e4f119`). **(2026-07-26 갱신)** ScrollHint는 이후 컷오프 기법(그리드 행 auto 크기 + `.page` 자체 스크롤)으로 대체됐다 — 상세는 `docs/design-candidates.md` "공개 대시보드 좁은 화면 콘텐츠 신호" 참고.
  - [ ] 10.2 — 스켈레톤 UI(`VITE_MOCK_DELAY_MS` 기반 의도적 로딩 지연 + 스켈레톤 화면): **미착수**.
  - [x] 10.3 — GlobalRiskBoard 지도 스크롤휠 확대/축소 활성화(2026-07-25, `b0485d0`).
  - [x] 10.4 — 원자재 리스크 게이지 요약 카드 + "더보기"(Disclosure)로 5칸 상세 그리드 접기/펼치기(`MaterialRiskOverviewSection`, 2026-07-25, `b98b222`).
  - [x] 10.5 — GlobalRiskBoard 지도 정보 패널 접기/펼치기(Disclosure)(2026-07-25, `b98b222`, 10.4와 같은 커밋).
  - [x] 10.6 — `ScrollCard` 카드 내부 오버플로 시각 신호(그라데이션+화살표 힌트) 도입 + `design-tokens.md` "카드 레이아웃·스크롤 규칙" 문서화(2026-07-25, `8080101`), 이후 3개 패널(원자재 공급사 리스크 현황/ERP 영향/구매 대응 우선순위)에 실측 기반 `maxBodyHeight` 적용해 4개 초과 시 실제 스크롤 트리거하도록 후속 수정(2026-07-25, `588fe73`).
  - [x] 10.7 — 구매팀 대시보드 페이지 섹션 도트 인디케이터(`PageSectionDots`, 2026-07-26, `c73b654`) + SideNav/AlertsPanel 독립 스크롤 전환(`useScrollOverflowHint` 공용 훅 분리 포함, `dd3e07a`) + 공개 대시보드 컷오프 기법 적용(`37e011d`) + 미사용 `ScrollHint` 컴포넌트 삭제 및 문서 정리(`71d8787`).
  - [ ] 10.9(후보) — SideNav 실기능 연결: **미착수**. `SIDE_NAV_ITEMS`가 Phase 4부터 `href="#..."` 순수 placeholder였고(원 목적: React key 중복 경고 회피), Phase 8에서 "실제 라우트로 교체"했다는 기록과 달리 실제로는 여전히 미기능 상태임을 Playwright 6개 시나리오로 실측 확인(2026-07-24). 앵커 스크롤/신규 페이지 분리/surin `Briefing.tsx` 이식 등 착수 방향 전부 미결정. 상세는 `docs/roadmap-candidates.md` "C3" 참고
  - [x] 10.10 — "오류 및 기능 미흡 발견" 2차 라운드(#1 도트 hover 2단계 툴팁 → #3 관제맵 마커
    hover 툴팁) + C7(도트 최하단 사각지대) 병합 완료(2026-07-27): C7 해소(`9c69569`) → #1
    `PageSectionDots` 도트 hover 2단계 툴팁 신규(`e80922c`) → 사용자 재검토로 발견된 버그 3건
    수정(expanded 리셋 누락/배지가 호버 도트 근처에 뭉침/`scroll-margin-top` 타겟이 heading
    대신 `ScrollCard`의 `.panel`이어야 함, `5566491`) → 배지-도트 세로 중앙 정렬 불일치 보정
    (`.dot`의 기본 `display:inline-block`이 원인, `0dd37cd`) → #3 `GlobalRiskBoard` 마커
    hover 시 `confidence_label` 노출(`18cd9e0`). 미검증 상태로 남은 사항(중간 사각지대 2곳,
    완전히 겹친 마커 간 hover 전환)은 각각 `docs/roadmap-candidates.md` "C8"/"C10" 참고.
    다음 순서는 3차 라운드(#6-1 → #7 변경) 예정.
  - [x] 10.11 — 공개 대시보드 글로벌 리스크 관제 지도, 최초 실 백엔드 API 연동(2026-07-27):
    `GET /api/v1/public/risk-board`(백엔드 `b8d44b9`, 토큰 불필요)를 `public.api.ts`의
    `fetchPublicRiskBoard()`로 연결 — `VITE_API_BASE_URL` 설정 시 실 API, 미설정 시(①단계)
    기존 mock(`fetchGlobalRiskBoard()`) 그대로 폴백. 구매팀 대시보드가 쓰는
    `fetchGlobalRiskBoard()`(`purchasing.api.ts`)는 이 변경과 분리돼 mock 그대로 유지 —
    실측(mock 6개 마커 vs 실 API 4개 마커)으로 두 화면이 서로 다른 데이터 소스를 쓰는 것
    확인. 코드베이스 최초의 실제 비동기 API 연동이지만 `useQuery`(TanStack Query)는 도입
    하지 않고 `useState`/`useEffect`로 최소 구현 — `QueryClientProvider` 정식 도입 여부는
    `docs/roadmap-candidates.md` "C11"에서 별도 트랙으로 계속 미룸. 로딩 중에는 최소 텍스트만
    표시(정식 스켈레톤 UI는 Phase 10.2, 미착수). 응답 스키마는 `docs/mock-schemas.md` "4-1"
    참고.
  - [x] 10.12 — "오류 및 기능 미흡 발견" 3차 라운드 완료(2026-07-27): #6-1(스크롤힌트 클릭
    시 "카드 1장 겹치는" 페이징 이동, `d920d38`) → #7(알림 패널 접기/펼치기 + 헤더 벨
    아이콘 hover 미리보기+고정, 이 커밋) — 10.10에서 예정으로 남겨뒀던 "3차 라운드(#6-1
    → #7 변경)"가 완료됨. #7은 `AlertsPanelContext`(펼침 상태, 페이지 이동 간 유지)로
    구현했고, 이 상태-분리 원칙(무엇을 Context로 올리고 무엇을 로컬로 둘지)은
    `docs/design-tokens.md` "카드 레이아웃·스크롤 규칙" e항에 일반 원칙으로 남겼다.

- [x] Phase 11 — 비로그인 대시보드: `origin/minji`(구매팀 담당자 별도 진행 브랜치) 이식
  (`youngjin/demo-layout-v3` 브랜치, `git merge`가 아니라 비로그인 담당 범위만 파일 단위
  이식, 2026-08-03). 사전 조사(브랜치 diff/의존성 분석) 결과 minji는 이 브랜치가 갈라진
  시점(`180095f`, Phase 11 이전 — `youngjin/2nd-demo-layout` 계열의 Phase 11과는 이름만
  같은 별개 작업)보다 먼저 갈라져 (1) 비로그인 대시보드 4패널 실 API 연동 확장 (2) 구매팀
  1계층 사이드바 하위 화면 4개 신규(리스크 모니터링/원자재 위험/계약·RAG/AI 브리핑,
  `accessToken` 필수·mock 폴백 없음)를 진행 중이었음을 확인.
  - 1. 비로그인 4패널: `PublicDashboardPage.tsx` 전면 교체(4패널 전부 비동기 mode 분기) +
    `ExchangeRateBand`/`MaterialPriceTrendCard`(신규 컴포넌트) + `ImportDependencyPanel`(기존,
    `blurred?` prop 추가) + `Footer`(환율 출처 표기 의무 추가). 의존 체인으로
    `MaterialPriceDetail.tsx`의 `period`/`onPeriodChange` 필수 prop 전환(breaking change)이
    함께 딸려와, 유일한 구매팀 쪽 소비처 `ImportDependencyRow.tsx`도 내부 `useState`로 자체
    충족시켜 `PurchasingDashboardPage.tsx`는 무수정으로 유지했다.
  - 2~3. 사이드바 하위 화면 4개: 사용자 결정(AskUserQuestion, 2026-08-03) — 접근 모델
    "완전 공개 + mock 폴백 신규 작성", 라우트 프리픽스 "`/public/*` 별도 신설". minji 원본은
    `RequireAuth tier="purchasing"` + `accessToken` 필수(mock 폴백 없음, "지어낸 데이터를
    못 보여준다"는 설계 원칙)였으나, `/purchasing/*`의 구매팀 담당자 범위(별도 진행)와 완전히
    분리하기 위해 `features/public/pages/`에 `Public` 접두 컴포넌트(`PublicRiskMonitoringPage`
    등) + 신규 API 4개(`publicRiskMonitoring.api.ts` 등, `accessToken: string | null` +
    ①mock/②③비로그인=`LOGIN_REQUIRED_MESSAGE`/②③로그인=`fetchWithAuth` 3단계 분기)로 새로
    두었다. mock 데이터는 Figma "04~07"(2026-08-02) 화면 예시값을 그대로 옮겼다.
  - 4. `NewsFeedItem` 스키마 확장(`collected_at`/`grade`/`headline_original`/`translated`/
    `country_code`/`url`) + `fetchNewsFeed()` 재작성 — 사전 조사에서 `youngjin/2nd-demo-layout`
    계열(`publisher` 필드 방향)과 다른 방향으로 확장돼 있음을 확인했으나, 이 브랜치엔 그
    변경이 없는 깨끗한 상태임을 재확인 후 진행해 충돌이 없었다.
  - 공유 의존성: `AuthContext`/`AuthProvider`/`AuthPage`에 `accessToken` 배선을 이 작업에서
    처음 추가(minji/`feat/procurement-risk-kpi` 브랜치와 독립적으로 동일한 구현 — 사전
    조사에서 두 브랜치 diff가 바이트 단위로 동일함을 확인했던 지점).
  - 검증: `npm run typecheck`/`lint`/`build` 통과, Playwright로 비로그인 `/`·`/public/*` 4개
    전부 로그인 없이 접근+상호작용(필터/상세선택/검색/브리핑 생성) 확인 + `/purchasing`
    로그인 후 회귀 없음(기간 탭·도넛차트 정상) 확인, 콘솔 에러 0건.
  - 승인 조건: DonutChart.tsx의 `isAnimationActive` 버그 수정은 이번 범위에서 제외(사용자
    지시) — `ImportDependencyPanel`/`MaterialPriceDetail`이 `DonutChartProps` 외 새 prop을
    쓰지 않아 빌드/런타임 영향 없음을 확인 후 진행.

- [x] Phase 12 — 구매팀 대시보드(tier1) 비로그인 전면 이식 (`youngjin/demo-layout-v3`,
  2026-08-03). **Phase 11의 `5bfd7db`(비로그인 4패널+`/public/*` 4화면 이식)가 잘못된 브랜치
  (`origin/minji`, 구버전) 기준이었음이 밝혀져 이번 Phase로 대체됐다** — 실제 최신 구매팀
  대시보드는 `origin/minji-tier1-dashboard`에 있었고, 구조·데이터 소스·세부 기능이 크게
  달랐다(0단계 조사에서 확인).
  - 배경: `origin/minji-tier1-dashboard`의 `PurchasingDashboardPage.tsx`(본문 12섹션+우측
    `DashboardSidePanel`)를 비로그인 대시보드(`/`)에 그대로 복제하고, 기존에 잘못 이식된
    `/public/*` 4화면도 tier1 기준으로 재동기화했다.
  - 사용자 확정 사항(AskUserQuestion, 2026-08-03): (1) 기존 `/public/*` 4화면의 tier1 격차
    해소도 이번 범위에 포함, (2) KPI 3종 API는 tier1의 "mock 금지" 원칙 대신 `/public/*`
    공통 원칙("완전 공개 + mock 폴백") 적용, (3) 이름 충돌 컴포넌트(`MaterialRiskStatusPanel`/
    `ErpImpactPanel`/`PurchasePriorityPanel`)는 `Public` 접두 신규 컴포넌트로 분리(기존
    `/purchasing` 쪽·`PurchasingDashboardPage.tsx`는 무수정).
  - 1단계(본문 12섹션): 이전 세션 산출물(`ExchangeRateBand`/`MaterialPriceTrendCard`) 삭제,
    `publicPurchasingDashboard.api.ts` 신규(KPI 요약/원자재별 리스크 점수/공급사 현황 3종,
    3단계 mock 분기), `public.api.ts`(`fetchPublicNewsFeed` limit/offset 확장+
    `fetchPublicNewsFeedCount` 신규)/`publicMaterialRisk.api.ts`(`refresh` 파라미터 추가)
    확장, `api/types.ts`에 `PurchasingKpiSummary`/`MaterialRiskSummaryItem`/`SupplierOverview`/
    `SelectedArticle`/`DashboardAlert`/`MaterialAssessment` 등 신규, lib 헬퍼 4종
    (`dashboardAlerts`/`selectedArticle`/`newsEventRef`/`formatCollectedAt`) 이식, 신규
    컴포넌트 6개(`PurchasingDashboardHeader`/`PurchasingKpiRow`/`LiveNewsMarquee`/
    `LatestNewsPanel`/`MaterialRiskSummaryTable`/`SupplierOverviewPanel`) + `Public` 접두
    3종(`PublicMaterialRiskStatusPanel`/`PublicErpImpactPanel`/`PublicPurchasePriorityPanel`)
    이식, `PublicDashboardPage.tsx` 12섹션 재구성.
  - 2단계(`DashboardSidePanel`): 탭 3개(뉴스 상세/주요 알림/브리핑)+`UploadCard` 이식, 기존
    `AlertsBellButton` 배선 재사용, 업로드 카드의 "계약서 PDF/TXT" 링크를 `/public/contract-rag`로.
  - 3단계+4단계(기존 `/public/*` 4화면 tier1 동기화, 같은 파일이라 묶어 진행): 각 화면 최상단
    주석에 tier1 대비 정정 사항 기록 — `PublicRiskMonitoringPage`(`?eventId=` URL 복원+
    `returnTo` 왕복, `resolveAction` 동적 버튼 라벨, `hasSignalInputs`, 자재별
    `material_assessments` breakdown), `PublicMaterialRiskPage`(`forceRefresh` 새로고침,
    `hasErpContext()`, ERP 경고 목록, 계약 검토 강조), `PublicContractRagPage`(계약 선택
    드롭다운이 상세 패널 직접 오픈, `stageFile` 파일 검증, tier1이 제거한 "근거로 사용하기"
    evidence 기능 함께 제거, 업로드 UI `accessToken` 있을 때만 노출), `PublicAiBriefingPage`
    (`?briefing=` URL-as-source-of-truth, `safeReturnTo`+복귀 링크, `handleOpen` URL 동기화,
    `analysis_id` 고정 전달).
  - 구현 중 발견해 계획을 벗어난 최소 수정 2건(모두 하위호환, 기존 소비처 무수정): (1)
    `ImportDependencyRow.tsx` — `period`/`onPeriodChange`를 선택적 prop으로 추가(0단계
    조사 당시 "수정 불필요"로 잘못 판단했던 것을 구현 중 typecheck에서 발견), (2)
    `GlobalRiskBoard.tsx` — `onSelectItem?` 선택적 prop 추가(마커 클릭을 바깥으로 알림,
    카드 내부 패널 자동 확장 억제). `ScoreCardItem.grade`도 선택 필드로 완화하고
    `ScoreCardPanel.tsx`가 조건부 렌더하도록 함께 수정.
  - 작업 중 상위 브랜치(`origin/minji-tier1-dashboard`)가 실제로 계속 갱신되고 있음을 재확인
    (조사 시작 시점 이후 `event_id`/`source_ref`/`latest_briefing_id` 등 필드가 추가된 새
    커밋이 들어옴) — 작업 중반에 재`fetch`해 최신 상태로 다시 맞췄다.
  - 검증: `npm run typecheck`/`lint`/`build` 통과, Playwright(계획서 "검증" 항목) + 회귀 확인
    (`git diff --stat -- src/features/purchasing/`로 `ImportDependencyRow.tsx`/
    `ScoreCardPanel.tsx` 외 무수정 확인), `docs/qa-checklist.md` A~H 순회 — 상세는
    `docs/timeline.md` Phase 12 항목 참고.

- [ ] Phase 13 — `origin/minji-tier1-dashboard` 후속 27커밋 재동기화 (`feat/public-tier`,
  2026-08-04~). Phase 12 조사 기준점(`309bd1c`) 이후 그 브랜치에 27개 커밋이 추가로 쌓인 것을
  확인(`git fetch`, HEAD `c2dbe67`) — 규모가 커 A~I로 성격별 분류해 배치로 나눠 반영한다
  (사용자 결정, 2026-08-04). 배치 순서: A(소규모 patch)+B(삭제 컴포넌트 대응)+C(신규 공용
  컴포넌트)+E(로딩 자리표시자) → D(알림 패널/사이드패널 갱신) → F(완료 처리 되돌리기) →
  H(기존 4화면 기능 추가) → G(데이터 관리 화면, `PublicDataManagementPage` 신규 포함 확정).
  - [x] 1차 배치(A+B+C+E, 2026-08-04): `MaterialRiskGaugeGrid`(신규, `features/public/
    components/`) 이식 — tier1이 `MaterialRiskOverviewSection`/`MaterialRiskOverviewRow`/
    `MaterialRiskSummaryCard`/`ScoreCardPanel`을 완전히 삭제하고 이 컴포넌트로 대체했으나,
    이 저장소는 `/purchasing`(구매팀 담당자 범위)의 `PurchasingDashboardPage.tsx`가 여전히
    `MaterialRiskOverviewSection`을 쓰고 있어(`grep` 확인) 그 4개 파일을 삭제하지 않고
    이 화면(`PublicDashboardPage.tsx`)만 신규 컴포넌트로 전환했다. `Skeleton`/`SkeletonText`
    (신규, `components/ui/Skeleton/`) 이식. 7개 컴포넌트에 `isLoading`류 prop patch
    (`PurchasingKpiRow`/`LatestNewsPanel`/`MaterialRiskSummaryTable`/`SupplierOverviewPanel`/
    `ImportDependencyRow`+`MaterialPriceDetail`(공유 위젯, 둘 다 선택적 prop이라 `/purchasing`
    무수정)/`PublicPurchasePriorityPanel`), `PublicErpImpactPanel`은 데이터 품질 라벨을 신규
    공용 모듈 `lib/dataQuality.ts`로 추출. `PublicPurchasePriorityPanel`은 추가로 "평가 불가
    자재를 순위에서 빼고 목록 아래 별도 영역으로"(tier1 `2d4f431` 대응, `toPurchasePriority()`
    반환 타입이 `{ ranked, unavailable }`로 변경). `PublicDashboardPage.tsx`에 패널별
    `isLoading` state 6종 배선(재조회 시 재점화 포함) — 알림·브리핑 로딩(우측
    `DashboardSidePanel` 탭 스켈레톤)은 다음 배치(D)로 이연. 구현 중 `react-hooks/
    set-state-in-effect`(신규 eslint 규칙, tier1 코드엔 없던 제약) 발견 — 재조회 시작을
    알리는 의도된 동기 setState라 `eslint-disable-next-line` 3곳에 사유와 함께 적용.
    검증: `npm run typecheck`/`lint`/`build` 통과, Playwright 13/13 PASS(게이지 그리드 토글,
    패널 표시, `/purchasing` 회귀 — `PurchasingDashboardPage.tsx` 자체는 diff 0, 공유 파일
    `ImportDependencyRow.tsx`만 +4줄), 콘솔 에러 0건. 상세는 `docs/mock-schemas.md` 10번
    섹션 참고.
  - [x] 2차 배치(D, 2026-08-04): `AlertsBellButton`에 `onOpenAlerts?`(열기 전용, `/public`)
    선택 prop 추가 — tier1은 `expanded`/`onToggle`을 완전히 제거했으나, `/purchasing`의
    `PurchasingDashboardPage.tsx`가 지금도 그 옛 계약으로 이 컴포넌트를 쓰고 있어(`grep`
    확인) 그대로 옮기면 컴파일이 깨진다 — 두 모드를 동시 지원하는 방향으로 정정(B 배치의
    `MaterialRiskOverviewSection`과 같은 판단). `AlertsPanelContext`/`Provider`에 `open`
    추가(순수 additive, `/purchasing` 무수정). `SidePanelToggleButton`(신규,
    `components/layout/`) 배선 + `tokens.css`의 `--side-panel-width` 토큰 신규. `DashboardSidePanel`
    탭별 스켈레톤(`isNewsLoading`/`isAlertsLoading`/`isBriefingsLoading`)·`focusAlertsToken`
    ·`selectedNews` 자동 복귀 effect 반영, `PublicDashboardPage.tsx`에 `handleOpenAlerts`/
    `handleSelectArticle`+`alertsLoading`/`briefingsLoading`(1차 배치에서 이연) 배선.
    UploadCard는 조사 결과 이미 원안 상태(RAG→`/public/contract-rag`, ERP→비활성
    placeholder)라 변경 없음 — tier1의 `data-management` 통합 링크로 바뀐 적이 없었다.
    검증: `npm run typecheck`/`lint`/`build` 통과, Playwright 16/16 PASS(벨 열기 전용 동작,
    브리핑 탭에서 벨 재클릭 시 알림 탭 복귀, 뉴스 클릭 시 뉴스 상세 탭 복귀,
    `SidePanelToggleButton` 토글, `/purchasing` 벨 여전히 토글 동작), `git diff --stat --
    src/features/purchasing/` 완전히 빈 결과(이번 배치는 `/purchasing` 파일을 아예 안 건드림).
    `react-hooks/set-state-in-effect` 2건 추가 발견 — tier1 원본(`DashboardSidePanel.tsx:292·305`)
    에도 동일 lint 에러가 남을 로컬 재현으로 확인, `eslint-disable-next-line`으로 처리.
    상세는 `docs/mock-schemas.md` 10번 섹션 D 항목 참고.
  - [x] 3차 배치(F, 2026-08-04): `AcknowledgedPanel`("완료 처리 항목" 되돌리기) 신규 이식+배선
    (1차 배치에서도 아직 파일 자체가 없었음 — `grep` 0건 확인, 이번이 첫 이식). `api/types.ts`에
    `AcknowledgedItem` 신규. `publicPurchasingDashboard.api.ts`에 `unacknowledgeAssessment`/
    `fetchAcknowledgedAssessments` 신규 — tier1 원본은 로그인 필수 화면이라 이 둘에 mock/
    비로그인 분기가 없었으나, 기존 `acknowledgeAssessment`와 대칭인 3단계 분기를 새로 설계해
    적용(①무동작/②비로그인 `LOGIN_REQUIRED_MESSAGE`/②로그인 `fetchWithAuth`).
    `fetchAcknowledgedAssessments`의 ①단계 mock은 항상 빈 배열 — `acknowledgeAssessment`
    ①단계가 무동작이라 mock 모드에서는 실제로 완료 처리되는 항목이 없어, 되돌릴 목업을
    지어내면 앞뒤가 안 맞기 때문. `PublicDashboardPage.tsx`는 기존 KPI/원자재리스크/공급사/
    자재 조회 effect(`[accessToken, reloadKey]`)에 합류(별도 트리거 불필요, tier1도 동일),
    `handleUndoAcknowledge` 신규(기존 `pendingAssessmentId` state 공유). UX는 확인 모달 없이
    즉시 실행(tier1 원본 그대로). 검증: `npm run typecheck`/`lint`/`build` 통과, Playwright
    9/9 PASS, `git diff --stat -- src/features/purchasing/` 완전히 빈 결과(이 기능 자체가
    `/purchasing`엔 없어 충돌 여지가 구조적으로 없음). 상세는 `docs/mock-schemas.md` 10번
    섹션 F 항목 참고.
  - [x] main 자체 수정 동기화(A~H 배치 밖 보정, 2026-08-05): 3차 배치(F) 이후
    `origin/main`이 별도로 진행되며(`feat/public-tier`가 main 조상 이력에서 빠짐) 자체적으로
    얹은 수정 중 `/public/*`와 실질적으로 겹치는 2건을 전수 조사(`git diff`/`git log
    --not`/`git show`)로 찾아 이식. `MaterialPriceDetail.tsx`에 `isAnimationActive={false}`
    (main `ee69ebe` 이식, 툴팁 지연 버그 수정). `/public/*`에 남아있던
    `react-hooks/set-state-in-effect` eslint-disable 5건(1차 3건+2차 2건)을 main `bb08fb9`와
    같은 "렌더 중 조정" 패턴(React 공식 "Storing information from previous renders")으로
    재작성해 전부 제거 — `DashboardSidePanel.tsx`(`selectedNews`/`focusAlertsToken`),
    `PublicDashboardPage.tsx`(`period`/`newsPage`/`accessToken`+`reloadKey` 인증 7종).
    검증: typecheck/lint(신규 disable 0건)/build 통과, Playwright 12/13 PASS(1건은 mock
    모드 `fetchPublicNewsFeedCount()`가 항상 0을 반환해 페이징 버튼이 애초에 안 뜨는 기존
    설계상 정상 동작, 테스트 스크립트 오류이지 회귀 아님), `git diff --stat --
    src/features/purchasing/` 빈 결과. 상세는 `docs/mock-schemas.md` 10번 섹션 참고.
  - [ ] 4차 배치(H): `AiBriefingPage`/`ContractRagPage`/`MaterialRiskPage`/`RiskMonitoringPage`
    추가 기능(필터·페이징·PDF 다운로드 등), `fetchRecentAiBriefings` 페이징 계약 브레이킹
    체인지 흡수. **origin/minji-tier1-dashboard가 아니라 origin/main 기준으로 재조사**(main이
    계속 자체 진행 중이라 2026-08-05부터 유일한 기준으로 전환) — H-1/H-2/H-3 하위 배치로
    분할.
    - [x] H-1(2026-08-05): `fetchRecentAiBriefings` 브레이킹 체인지+신규 타입 4종
      (`ApiPage`/`AiBriefingListQuery`/`AiBriefingRiskLevel`/`AiBriefingReviewStatus`),
      `RiskMonitoringEvent.briefing_id` 신규 필드, 확정 배지 숨김 버그 수정(main `912c26b`
      대응), 죽은 코드 `runErpImpactAnalysis` 삭제(main이 navigate 방식으로 이미 대체,
      소비처 0곳 확인). 검증: typecheck/lint/build 통과, Playwright 4/4 PASS, 콘솔 에러
      0건, `/purchasing` 무수정. 상세는 `docs/mock-schemas.md` "H 배치" 섹션 참고.
    - [ ] H-2: PDF 다운로드(`downloadGetWithAuth`/`saveBlob` 신규) + AI 브리핑 카드 UX
      (`ae97647`) + AiBriefingPage 로딩 자리표시자.
    - [ ] H-3: `ContractEvidenceItem.clause_no`/`clause_title`(`e7afd83`) + 계약·RAG 검색
      결과 병합/내부값 은닉(`99f9deb`) + 나머지 화면 로딩 자리표시자. 착수 전
      `--color-primary-alt`(다크 섹션용 색) 오용 여부 `/public/*` 전수 확인 선행.
  - [ ] 5차 배치(G): 데이터 관리 화면(`DataManagementPage`) `PublicDataManagementPage`로 신규
    이식 — `/public/*` 원칙(완전 공개+mock 폴백) 적용 확정.

## 재사용 규칙 (Phase 3에서 결정되는 인터페이스는 이후 Phase가 그대로 따른다)
- `ConfidenceBadge`/`RiskGradeBadge`의 props 타입은 이후 모든 화면에서 동일하게 재사용한다 — 화면별로 별도 배지를 새로 만들지 않는다.
- `Header`/`Footer`/`SideNav`는 `components/layout/`에서 한 번만 구현하고, `features/*`는 이를 import해서 쓰기만 한다.