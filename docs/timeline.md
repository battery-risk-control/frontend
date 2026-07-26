# 개발 타임라인

> 이 문서는 Claude(claude.ai)와의 기획 대화 및 Claude Code 세션 전체를 바탕으로 최초 작성되었다.
> **이후 각 Phase가 끝날 때마다 이 문서 맨 아래에 새 항목을 추가해 갱신한다** (기존 항목은 수정하지 않는다 — append-only).

## 사전 준비
- 프로젝트 기획정의서/요구사항정의서/아키텍처 이미지 검토
- Claude(대화) vs Claude Code 비교 후 Claude Code로 개발 방침 결정
- 팀 R&R 확인 (6인 팀, FE 담당: 박태희·김영진(본인)·김수린), FE는 김영진 담당으로 진행
- 별도 레포 2개(frontend/backend) 구조로 GitHub 확인
- 기술 스택 확정: React 19 + TypeScript + Vite + react-router-dom + TanStack Query + CSS Modules + Recharts
- Figma 와이어프레임(`KT_AIVLE_빅프로젝트.png`) + UI/UX 가이드라인 PDF(AIVLE 개발권고사항) 확보
- `CLAUDE.md` + `docs/{product-overview, architecture, requirements-frontend, mock-schemas, design-tokens}.md` 최초 작성
- `docs/design-tokens.md`: ui-demo-image 9장 대표색 실제 추출(colorthief) + 가이드라인 PDF 명시 폰트(Pretendard GOV) 근거로 확정

## Phase 1 — 프로젝트 스캐폴딩
Vite + React 19 + TS 초기화, 의존성 설치, 폴더 구조(`features/components/api/lib/styles/assets`) 생성, `design-tokens.md` → `tokens.css` 이식, Pretendard GOV 웹폰트 연결(공식 배포처 `orioncactus/pretendard` 확인).

## Phase 2 — 육안 검증
`App.tsx`에 임시 확인 텍스트("가나다 ABC 123")를 넣어 `tokens.css`의 `--font-family-base`(Pretendard GOV) 적용 여부를 사용자가 직접 브라우저에서 육안 확인 — 확인 후 텍스트 제거.

## Phase 3 — 공통 컴포넌트
`components/layout`(Header, Footer, SideNav, Breadcrumb, SkipLink), `components/ui`(ConfidenceBadge, RiskGradeBadge) 구현.

## Phase 4 — 1계층 구매팀 대시보드
**Figma vs CLAUDE.md 컨벤션 불일치 발견**: CLAUDE.md 개발 컨벤션의 "1계층 구매팀" 화면 구성(글로벌 리스크 현황판 등 4개, 2x2)이 실제로는 "비로그인 공개 대시보드"(Seq 23) Figma 프레임과 일치하고, 실제 "구매팀 대시보드" Figma 프레임은 사이드바+단일 컬럼 4단 스택+우측 알림 패널 구조임을 확인. 사용자에게 확인받아 Figma 기준으로 진행 결정(문서는 수정하지 않고 코드만 Figma에 맞춤). `api/purchasing.api.ts` mock, KpiSummaryPanel/MaterialRiskStatusPanel/ErpImpactPanel/PurchasePriorityPanel/AlertsPanel 구현.
**버그**: `SideNav` 두 항목이 동일한 `href="#"`를 사용해 React key 중복 경고 발생 → 항목별 고유 해시(`#risk-board`, `#briefing`)로 수정.

## Phase 5 — 인증 플로우
Figma 로그인/회원가입 프레임(같은 스플릿스크린 템플릿의 탭 전환 2상태)을 확인해 필드 라벨을 그대로 반영(사내 이메일 주소/보안 세션 로그인/비밀번호 초기화 신청/임직원 성명/접속 비밀번호 설정 등). 로그인/회원가입(스플릿스크린+탭 토글)/승인대기 락 화면/보안 배지 구현.
**버그**: 승인대기 화면 "처음으로" 버튼이 `activeTab` 상태를 초기화하지 않아 직전 탭(권한 신청)이 그대로 유지되던 문제 발견·수정.
**스키마 보완**: Figma 회원가입 폼(임직원 성명 필드 있음)과 `mock-schemas.md` 스키마(그 필드 없음, 대신 `org_name` 있음)의 불일치 발견 — `name` 필드는 확장 원칙에 따라 추가, `org_name`은 폼 UI가 없어 API 계층 고정값(`OO배터리`) 처리로 `mock-schemas.md`에 반영.

## Phase 5.5 — 라우팅 연결
`react-router-dom` 연결, `/auth`·`/purchasing` 라우트 분리.

## Phase 5.6 — 비로그인 공개 대시보드 (Seq 23)
Phase 4에서 이관된 4개 컴포넌트로 구현, `/` 라우트 연결. 원자재 가격 추이는 스키마에 가격 필드가 없어 합성 지수(기준일=100) 사용 — `mock-schemas.md`에 근거 반영.

## Phase 6 — 2·3계층 대시보드
Figma "경영기획팀/경영진 대시보드" 프레임 확인 — 경영진 프레임의 화면 설명 예시("이번 분기 리스크 탐지 32건, 심각 등급 5건, 평균 대응 소요 2.3일")를 KPI 수치 근거로 사용. `risk_event` 원천 데이터에서 파생(사업부 노출도, 협력사 이력, 누적 KPI 등) — 자재→사업부 매핑·vendor_id는 데모용 고정 가정. Figma 부가 지표 중 스키마에 없는 것은 구현 제외(사용자 지시 우선 원칙). `mock-schemas.md` 1·2절에 파생 근거 및 확장 필드(`critical_count`, `avg_response_days`) 반영.

## Phase 6.5 — 페이지 간 내비게이션 + 최소 접근 제어
공개 대시보드 탭 실제 연결, `AuthProvider`/`useAuthState`(메모리 전용) 도입, `RequireAuth` 가드, 테스트 계정 3종(DEV/DEMO 전용, 배포 전 삭제 명시), `SideNav`/`Breadcrumb` `<a>` → `Link` 전환, `authState` 3파일 분리(Context/Provider/훅).

## Phase 8 — 접근 제어 보정 + 계정 UI + 1계층 하위 화면
`RequireAuth`에 `org_tier` 매칭 추가 — 계층 불일치 시 403 대신 자신의 실제 대시보드로 리다이렉트. `AuthProvider`에 `email` 저장 추가. `Header`에 계정 정보(이메일·계층)와 로그아웃 버튼 추가, Planning/Executive 페이지에도 `Header` 적용(CSS를 Header+본문 2단 구조로 조정). 1계층 하위 화면 "브리핑 자료 열람"(`BriefingDetailPage`, `/purchasing/briefing/:riskEventId`) 신규 구현 — `api/purchasing.api.ts`에 `fetchRiskEventBriefing` 추가, `MaterialRiskStatusPanel`에 "브리핑 보기" 링크 추가, `SideNav` 플레이스홀더 해시(`#briefing` 등)를 실제 라우트로 교체(React key 중복을 피하려 자재 페이지 경로 뒤에 서로 다른 해시를 붙임), `mock-schemas.md` 5절에 브리핑 상세 조회 스키마 추가.
**버그**: 로그아웃 시 `navigate('/')`와 `signOut()`을 같은 이벤트 핸들러에서 호출하면, react-router의 history 리스너가 인증 Context 갱신과 다른 타이밍에 위치를 반영하면서 현재 라우트의 `RequireAuth`가 먼저 `/auth`로 리다이렉트를 덮어써 버리는 경쟁 상태가 재현됨(호출 순서를 바꿔도, `setTimeout`으로 미뤄도 해결 안 됨) → 인증 상태가 애초에 메모리 전용(새로고침 시 소실)으로 설계된 점을 이용해 로그아웃을 하드 리다이렉트(`window.location.href = '/'`)로 전환해 경쟁 자체를 없앰.
**e2e**: 새 시나리오(계층 불일치 리다이렉트 3계정, 로그아웃, 브리핑 상세) 5개 테스트를 추가하고, "계층 매칭 없음"을 전제로 작성됐던 기존 탭 내비게이션 테스트 1개를 새 동작에 맞게 수정 — 총 21개 테스트 통과.

## 부수 작업

Phase 번호가 붙지 않는 문서화·툴링 작업 기록 (`docs/roadmap.md`의 Phase 항목과 1:1 대응하지 않음).

### 네이밍 사전 작성
`src/` 전체(45개 `.ts`/`.tsx` 파일)를 스캔해 `docs/naming-glossary.md` 작성 — 파일 단위 요약 표 + 파일별 export 심볼(컴포넌트/함수/훅/타입)의 physical(영문):logical(한글):역할 상세표. `features/executive`의 `CumulativeRiskKpi`/`SavingsSimulation` 컴포넌트가 `api/types.ts`의 동명 타입과 이름이 겹치는 점을 문서에 경고로 남김.

### CI 자동화 (Playwright e2e + GitHub Actions)
그동안 스크래치패드에 임시 설치해 수동으로 돌리던 Playwright 검증(3계정 로그인, RequireAuth 가드, 탭 내비게이션, PENDING 플로우, 홈 링크)을 정식 devDependency(`@playwright/test`) + `e2e/` 테스트 5개 파일(총 14개 테스트)로 전환. `playwright.config.ts`(빌드된 `dist/`를 `vite preview`로 서빙), `tsconfig.e2e.json` 추가 및 루트 `tsconfig.json` 참조 연결, `package.json`에 `typecheck`/`test:e2e` 스크립트 추가, `.github/workflows/ci.yml`(install → typecheck → lint → build → e2e) 작성.
**버그**: `pending-approval.spec.ts`의 `getByText('관리자 승인 대기 중입니다')`가 제목(h1)과 본문(마침표 포함 p) 두 곳에 매칭되어 Playwright strict mode 위반 발생 → `getByRole('heading', ...)`로 특정해 수정.

### README.md 전면 재작성
기존 Vite 기본 영문 템플릿 내용을 "## 부록: Vite 템플릿 기본 안내"로 이관하고, 프로젝트 개요/서비스 플로우 이미지(`docs-ref/service-flow/`)/기술 스택/폴더 구조/실행 방법/화면·라우트 표/참고 문서 링크/API 명세 안내/ERD 범위 안내를 담아 한국어로 전면 재작성.

## 진행 중 발생한 운영 이슈
- `.claude/settings.json` 문법 오류(주석 오삽입)로 설정 미적용 — 수정
- `AskUserQuestion` 위젯이 CLAUDE.md 지시에도 계속 노출됨 — 근본 원인(CLAUDE.md는 약한 우선순위) 확인 후 `permissions.deny`로 도구 자체 차단
- VS Code 창 닫힘 — 실제 파일 미생성 지점이라 재개 시 손실 없음
- `npm run dev:live` 종료 시 Ctrl+C→Y로도 자식 node.exe(vite 서버)가 완전히 안 죽고 남는 경우 발견(2026-07-27) — 원인 미상(정상적으로 Ctrl+C→Y를 눌렀는지 추적 불가), 다음 실행 시 5173이 아닌 5174/5175로 밀려나 CORS 불일치(`Failed to fetch`)로 뒤늦게 발견됨. `strictPort: true` 추가로 재발 시 조용히 다른 포트로 밀리는 대신 즉시 에러로 드러나도록 조치(commit 99fe4f7). 완전 예방은 아니므로 종료 후 `netstat -ano | findstr :5173`으로 실제로 비었는지 확인하는 습관 권장.

## Phase 7 — 예정
git remote 연결 및 첫 커밋 (미착수)

## Phase 8.5 — 발견된 UX/일관성 오류 수정
`docs/qa-checklist.md` 신설 계기가 된 버그(공용 컴포넌트 변경 시 일부 화면이 누락되는 패턴) 수정. `PublicDashboardPage`가 `Header`를 쓰지 않고 자체 `<header>`를 구현하고 있었고, 로그인 여부와 무관하게 "로그인/회원가입" 링크를 무조건 렌더링하고 있었음 — `Header`로 교체하고, `Header` 자체에도 `orgTier`가 없을 때의 로그인 버튼 폴백을 추가해 양방향 대칭을 맞춤. `Header`에 브랜드 텍스트 링크와 별개로 인라인 SVG 홈 아이콘 링크 추가(qa-checklist D). `RequireAuth`의 계층 불일치 처리를 무음 리다이렉트에서 확인 모달(`components/ui/ConfirmModal` 신규)로 변경 — "취소"가 기본 포커스+주 버튼(홈으로 이동), "내 화면으로 이동"이 보조 버튼(자기 계층 대시보드로 이동). `TIER_LABEL`을 `Header.tsx`에서 `lib/tierLabels.ts`로 분리해 `Header`/`RequireAuth` 양쪽에서 공유.
**재현·검증**: 로그인 상태에서 `/auth`에 SPA로 재진입할 때 `AuthPage`의 기존 `useEffect` 기반 리다이렉트가 실제로 동작하는지, 수정 전 코드로 임시 롤백(`git stash`) 후 Playwright로 실제 브라우저에서 재현 — 정상 작동 확인(버그 아님). 이 코드 경로는 1번 수정으로 로그인 상태일 때 `/auth` 링크 자체가 사라지므로 이후 UI에서 도달 불가능해짐.
**e2e**: `tab-navigation.spec.ts`/`tier-access.spec.ts`를 무음 리다이렉트 기대에서 모달 상호작용(등장 확인 → 버튼 클릭 → 결과 확인) 검증으로 수정하고, Header 로그인 상태 표시(공개 대시보드 포함) 신규 케이스 3개 추가 — 총 24개 테스트 통과.

## Phase 9.1 — GlobalRiskBoard 인터랙티브 지도 이식
`risk_event.market_context`에 `country_code`/`country_name`/`coordinates`(optional) 스키마 확장 — mock 6건 중 국가를 텍스트 근거로 특정할 수 없던 1건(코발트 "최대 생산국")은 프로젝트 기획 정의서 근거(DRC가 세계 최대 코발트 생산국)로 사용자 확인 후 채움. `docs/naming-glossary.md`에 "동일 물리 필드명은 동일 한글 표기, 의미가 다르면 수식어+병기, export 인터페이스 필드 누락 금지" 규칙을 신설하고 기존 결함(email/label 표기 불일치, risk_event_id·business_unit·period 등 첫 필드 누락) 전수 스캔 후 정정 — `CLAUDE.md`에도 "대표 사례 발견 시 전수 스캔 후 보고" 원칙 추가. `features/public/` 전체에 대해 Phase 8.5/9 반영 누락 여부 문서 감사 수행 — Header 조건부 표시·확인 모달 변경이 `CLAUDE.md`/`docs/roadmap.md`에 반영 안 된 지점, `product-overview.md`의 "실시간 스트리밍" 제외 항목과 "실시간 뉴스 속보" 화면명 간 표현 긴장을 찾아 정정.

`GlobalRiskBoard.tsx`를 리스트형 요약에서 `react-leaflet`+`world-atlas`(GeoJSON 국경)+`topojson-client` 기반 실제 인터랙티브 세계지도로 재구현(surin 브랜치 구현 참고, 데이터는 dev-김영진 risk_event 스키마만 사용). "이벤트뷰"(개별 좌표 마커)/"국가뷰"(country_code 기준 집계, 대표 이벤트=최고 심각도 등급·동률 시 배열 순서, 건수 배지) 토글 구현, country_code 없는 이벤트는 마커 제외, 마커 클릭 시 컴포넌트 내부 상세 패널에 해당 국가/이벤트의 risk_event 리스트 표시(`RiskGradeBadge`/`ConfidenceBadge` 재사용). Leaflet SVG 렌더러가 CSS 커스텀 프로퍼티를 해석하지 못해 리스크 등급 색상을 `tokens.css`와 동일한 hex로 리터럴 미러링 — `docs/design-tokens.md`에 각주로 근거 남김. `naming-glossary.md`/`docs/roadmap.md`(Phase 9.1 완료 표시) 등 관련 문서 동기화.

## Phase 9 요약 (9.1~9.6)

> 9.1은 위 절에 상세 기록(재작성하지 않음). 9.2~9.6을 시간순으로 요약한다.

- **9.1 GlobalRiskBoard 인터랙티브 지도** — 완료. 위 "Phase 9.1" 절 참고(`3bfe905`/`f6a6b6d`/`c6b2815`).
- **9.2 로그인/회원가입 surin 비주얼 이식** — **보류 결정**(2026-07-22, `0d8c7e4`). 기존 dev-김영진 화면 유지, 코드 변경 없음.
- **9.3 원자재 가격 추이(부분 완료)** — 전체보기/상세보기 토글 도입 후 상세보기 단독 유지 결정, 자재 드롭다운 실제 필터링, `ScrollCard` 공용 컴포넌트 최초 도입(공개 대시보드 4개 카드 교체 포함), 차트 진입 애니메이션/스크롤 예외(`scrollable={false}`) 처리(2026-07-22~23, `d5ae9e3`/`bf68bb8`/`b508c24`/`104c174`/`a670542`/`1938156`/`726b69f`/`0e09f6c`). 원 항목명에 포함된 "2·3계층 차트 surin 스타일 이식" 부분은 **미착수**(`ComparisonChart`/`CumulativeRiskKpi` 등은 Phase 6/8 이후 수정 이력 없음, `docs/roadmap.md` 9.3 각주 참고).
- **9.4 구매팀 대시보드 UX-01-DB 데모 구조 반영** — 완료(2026-07-24, `5c4a812` 데모 구조+ScrollCard 통일, `c8873f3` SideNav 접기/펼치기). 5칸 리스크 게이지 그리드/지도 재사용/도넛+가격추이 2단 요약 영역 신설, 기존 4개 패널 ScrollCard 전환, `GlobalRiskBoard`/`MaterialPriceDetail`을 `components/widgets/`로 승격.
- **9.5(후보) 리스크 유형별 분포 차트** — **미착수**. `risk_event` 스키마에 "유형" 필드 자체가 없어 신규 필드 설계 선행 필요 — 미결 사항은 `docs/roadmap-candidates.md` "C1"(2026-07-24, `9a9cd06`) 참고.
- **9.6(후보) ERP 영향 분석 화면 신설** — **미착수**. surin에는 있으나 `requirements-frontend.md`에 대응 Seq 항목 없음 — 미결 사항은 `docs/roadmap-candidates.md` "C2"(2026-07-24, `42fbb71`) 참고.

## Phase 10 — 스크롤/오버플로/내비게이션 UX 개선 (소급 번호 매김, 2026-07-26)

> `docs/roadmap.md` Phase 10 하위 항목(10.1~10.9, 전체 반응형 대응 자체는 미완료)과 번호를 맞춰 기록한다. 원래 Phase로 계획된 작업이 아니라, 세션 중 실측으로 발견한 문제를 그때그때 수정하며 쌓인 항목들을 이번에 소급 정리한 것이다.

- **10.1 공개 대시보드 좁은 화면 브레이크포인트 + ScrollHint** — 실험적 도입(2026-07-23, `5e4f119`). 760px 미만에서 2x2→1열 4행 전환 + IntersectionObserver 기반 하단 콘텐츠 힌트. 이후 10.7에서 컷오프 기법으로 대체.
- **10.2 스켈레톤 UI** — **미착수**. `VITE_MOCK_DELAY_MS` 기반 의도적 로딩 지연 자체는 있으나(CLAUDE.md "환경 단계" 원칙), 스켈레톤 화면 컴포넌트 구현은 아직 없음.
- **10.3 GlobalRiskBoard 지도 스크롤휠 확대/축소 활성화** — `scrollWheelZoom` false→true(2026-07-25, `b0485d0`). `zoomControl`/`doubleClickZoom` 충돌 없음 사전 확인.
- **10.4 원자재 리스크 게이지 요약 + 더보기(Disclosure)** — `MaterialRiskSummaryCard`(자재별 grade+changeLabel 미니 리스트) 신설 + `MaterialRiskOverviewSection`이 기존 5칸 상세 그리드(`MaterialRiskOverviewRow`)를 CSS `max-height`+`opacity` transition으로 접기/펼치기(2026-07-25, `b98b222`). 기본 펼침 상태 유지(요약 카드 도입 전 UX와 동일).
- **10.5 GlobalRiskBoard 정보 패널 접기/펼치기** — 지도 마커 클릭 시 나오는 상세 패널을 헤더(항상 노출)+본문(Disclosure)으로 분리(2026-07-25, `b98b222`, 10.4와 동일 커밋). 마커 선택 시 자동으로 펼쳐짐.
- **10.6 ScrollCard 카드 내부 오버플로 힌트 + maxBodyHeight** — `.body`의 scroll/resize 이벤트 + `ResizeObserver`로 실제 오버플로·스크롤 위치를 감지해 하단 그라데이션+화살표 힌트 자동 표시(2026-07-25, `8080101`, `design-tokens.md` "카드 레이아웃·스크롤 규칙" a~d 신설). 이후 원자재 공급사 리스크 현황/ERP 영향/구매 대응 우선순위 3개 패널이 mock 6건에도 실제로 오버플로가 발생하지 않던 문제(페이지가 무제약으로 늘어나는 구조)를 실측(Playwright)으로 발견해 `maxBodyHeight` prop을 신설하고 실측 높이(440/360/368px)로 적용(2026-07-25, `588fe73`).
- **10.7 페이지 섹션 도트 인디케이터 + 독립 스크롤 + 컷오프 기법** — 3개 커밋으로 진행:
  - `components/ui/PageSectionDots` 신규 — 섹션 heading을 `IntersectionObserver`로 다중 관찰해 도트 활성 표시, 클릭 시 `scrollIntoView`, 상하단 이동 리모컨(목록 버튼은 placeholder). 구매팀 대시보드에 8개 섹션 적용(2026-07-26, `c73b654`). 검증 중 `.body{gap:40px}`가 SideNavToggleButton/SideNav 사이에도 번지는 부작용을 발견해 `main{margin-right:40px}`로 대체.
  - SideNav/AlertsPanel을 `position:sticky`+독립 스크롤로 전환, `ScrollCard`의 하단 전용 오버플로 감지 로직을 `useScrollOverflowHint` 공용 훅으로 일반화(상/하단)해 재사용(2026-07-26, `dd3e07a`). 검증 중 sticky Header(56px)와 겹치는 문제를 발견해 `--header-height` 토큰 신설.
  - 공개 대시보드의 `ScrollHint` 사용을 제거하고, `.page`를 `height:100vh; overflow-y:auto`로, 그리드 행을 `minmax(320px, 1fr)`→`minmax(320px, auto)`로 바꿔 다음 카드/행이 하단에 자연스럽게 일부만 보이는 컷오프 효과로 대체(2026-07-26, `37e011d`). 1fr 사용 시 카드 내부에 억지 빈 여백이 생기는 부작용을 실측으로 발견해 auto로 교체.
  - 이후 별도 확인을 거쳐 `ScrollHint` 컴포넌트 자체(소비처 0건 재확인)를 완전히 삭제하고, `design-tokens.md` a) 절을 3갈래 체계(페이지 레벨 내비게이션/페이지 레벨 콘텐츠 신호/카드 레벨 오버플로 신호) 표로 재작성(2026-07-26, `71d8787`).
- **10.9(후보) SideNav 실기능 연결** — **미착수**. 상세는 `docs/roadmap-candidates.md` "C3" 참고.

## 문서 정정: Phase 9.1 정리 시점(99번 줄) 서술 오류 발견, 2026-07-27

"`VITE_MOCK_DELAY_MS` 기반 의도적 로딩 지연 자체는 있으나"라는 서술은 부정확했다. 실제로는
Phase 10.2(스켈레톤 UI)가 착수 전 상태라 이 환경변수를 읽는 코드가 존재하지 않는다
(2026-07-27 전수 확인). CLAUDE.md/README.md의 `VITE_MOCK_DELAY_MS` 언급은 설계 시점에 미리
정해둔 인터페이스일 뿐, 10.2 착수 시 실제로 구현된다.

## 오류 및 기능 미흡 1차 라운드 (버그 헌팅) — #5/#4/#2 수정, #6 재분류 정정 (2026-07-27)

구매팀 대시보드 실측 중 사용자가 제기한 4건(#2/#4/#5/#6)을 조사·수정한 라운드. 조사(읽기 전용) 후
수정을 분리해 진행했다.

- **#6 자재 카드 가로 스크롤 — 재분류 정정**: 최초 구현(2fcc1ef)에서 SideNav/AlertsPanel과 같은
  "스크롤바 숨김+힌트" 패턴을 그대로 가져다 썼으나, 이는 페이지 전환과 무관하게 항상 같은 자리를
  차지하는 앱 뼈대(chrome)용 패턴이지 본문 콘텐츠에 맞지 않는다고 재판단해 네이티브 스크롤바 노출
  + 마우스 드래그(grab-to-scroll)로 정정(2026-07-27, `ee87b13`). 이 재분류가 계기가 되어
  `design-tokens.md`에 "스크롤 UI 노출 원칙"(앱 뼈대 vs 본문 콘텐츠, 본문 콘텐츠 내에서도
  카드 내부 리스트형/형제 카드 캐러셀형 구분)을 신설했다.
- **#5 상위 요약 행(3장) SideNav 폭 변화에 줄바꿈** — `MaterialRiskOverviewSection`의 `.row`가
  `auto-fit` grid라 SideNav를 펼치면 `.main`이 좁아져 2줄로 줄바꿈됨을 실측 재현. #6과 동일한
  "형제 카드 캐러셀형" 원칙을 적용해 `display:flex`+`nowrap`+`overflow-x:auto`로 전환하고,
  드래그 로직을 `src/lib/useHorizontalDragScroll.ts` 공용 훅으로 추출해 재사용 가능하게
  분리했다(2026-07-27, `60cd14e`). 구현 중 `flex-shrink`를 실수로 1로 지정해 카드가 짓눌리는
  회귀가 있었으나 Playwright 실측으로 즉시 발견·수정.
- **#4 SideNav 토글 버튼이 스크롤 안 따라옴** — `SideNavToggleButton`에 `position:sticky`가
  누락돼 있어 SideNav 본체와 달리 페이지 스크롤 시 사라지던 문제를 SideNav와 동일한
  `position:sticky;top:var(--header-height)` 추가로 수정(2026-07-27, `6d1ebec`).
- **#2 도트 활성/클릭 이동 싱크** — `PageSectionDots`의 `IntersectionObserver`에 헤더 높이만큼
  보정된 `rootMargin`(`-{header-height}px 0px -60% 0px`, 통상적 스크롤스파이 기법)을 추가하고,
  `ScrollCard`의 heading에 `scroll-margin-top: var(--header-height)`를 줘 `scrollIntoView`도
  함께 보정했다(2026-07-27, `36d0fa6`). 단, 페이지 최하단 섹션 부근(약 936px 구간)에는 이
  조정만으로 해소되지 않는 사각지대가 실측으로 확인돼 미해소 상태로 남았다 — 후속 라운드 과제,
  `docs/roadmap-candidates.md` "C7" 참고.
