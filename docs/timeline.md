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

## vite.config.ts strictPort — dev/dev:live 동시 구동 불가 버그 수정 (2026-07-27)

`server.strictPort: true`가 mode 분기 없이 `npm run dev`(①mock)/`npm run dev:live`(②실
백엔드) 양쪽에 공통 적용돼 있어, 둘 중 하나가 5173을 점유한 상태에서 나머지 하나를 실행하면
포트가 자동으로 밀리지 않고 즉시 `Error: Port 5173 is already in use`로 죽는 것을 Playwright가
아닌 실제 `npm run dev`/`npm run dev:live` 프로세스 재현으로 확인했다. 원래 의도는 "live만 포트
고정, mock은 자유롭게 밀려서 두 화면을 동시에 띄워 비교 시연 가능"이었으므로, `vite.config.ts`를
`defineConfig(({ mode }) => ({ server: { strictPort: mode === 'live' } }))` 형태로 분기해
mock 쪽 strictPort를 해제했다. 수정 후 `dev:live`(5173) 먼저 띄우고 `dev`를 추가로 띄우면
`Port 5173 is in use, trying another one...` 메시지와 함께 5174에서 정상 기동, 두 서버 동시
응답(curl 200/200)까지 확인. `docs/backend-integration-guide.md`(dev:live 섹션에 동시 구동
안내 추가)와 CLAUDE.md(환경 3단계 섹션에 strictPort 비대칭 의도 명시)도 함께 갱신했다.

## 오류 및 기능 미흡 2차 라운드 — C7 최하단 사각지대 해소 + 도트 hover 2단계 툴팁 (2026-07-27)

1차 라운드(#2/#4/#5/#6) 후속 — C7(도트 인디케이터 최하단 섹션 사각지대)을 해소하고,
`PageSectionDots`에 도트 hover 시 섹션 제목을 보여주는 2단계 툴팁을 신규 추가한 라운드.
조사(읽기 전용) 후 수정을 분리해 진행했다.

- **C7 해소**: Playwright로 마지막 섹션(`구매 대응 우선순위`) 도트가 문서 맨 끝까지
  스크롤해도 활성화되지 않는 현상을 재현·정확한 원인을 특정 — rootMargin 기반
  IntersectionObserver가 요구하는 스크롤 위치(`scrollY ≥ 2088.98px`, 1400px 뷰포트 기준)가
  문서의 실제 최대 스크롤(`1976px`)보다 약 113px 더 필요해 구조적으로 도달 불가능했음.
  rootMargin 예외값 대신 "문서 하단 도달"을 별도 감지(`scrollY + innerHeight ≥ scrollHeight
  - 2px`)해 근접 시 마지막 섹션 id를 강제로 active에 포함시키는 방식(개발자 확정안)으로
  해소(9c69569). 조사 중 함께 발견된 원인이 다른 사각지대 2곳(섹션 전환 구간의 통상적
  스크롤스파이 아티팩트)은 손대지 않고 `docs/roadmap-candidates.md` C8로 별도 기록.
- **도트 hover 2단계 툴팁(#1)**: 도트에 마우스를 올리면 1단계(같은 높이에 섹션 제목 알약
  1개) → 그 알약 위로 마우스가 이동하면 2단계(8개 섹션 평면 리스트로 확장, 현재 활성 섹션
  강조)로 열리는 hover 툴팁을 신규 구현. 배지 텍스트는 기존 `SECTION_DOTS_SECTIONS`의
  `section.id`를 그대로 재사용(heading textContent 별도 조회 불필요). WCAG 1.4.13
  (hoverable/dismissible/persistent) 충족을 위해 순수 CSS `:hover` 대신 상태로 관리하는
  `useHoverDisclosure` 훅을 신설(`src/lib/`) — 트리거+콘텐츠를 하나의 `<ul>`로 감싸고
  그 `<ul>`에만 `onMouseLeave`를 걸어 트리거→팝오버 이동 중엔 안 닫히게 했고, `Escape`로도
  닫히게 했다. 애니메이션은 1단계 등장/퇴장에 opacity+transform, 2단계 확장(1개→8개
  리스트)에 기존 disclosure 패턴과 동일한 max-height+opacity를 적용(모두 `--transition-fast`).
  구현 중 발견/수정: 최초 구현은 패널을 `top:50%`+`transform:translateY(-50%)`로 도트에
  퍼센트 기반 세로 중앙 정렬했는데, 이 경우 2단계로 확장(max-height 40px→500px)되면 늘어난
  높이의 절반만큼 위로도 커져 목록 맨 위쪽 도트(첫 섹션)에서는 그 절반이 sticky Header
  뒤로 가려짐을 스크린샷으로 발견 — `top`을 li 상단 기준 고정 px 오프셋(`-8px`)으로 바꿔
  확장이 항상 아래쪽으로만 일어나게 해 해결.
  이 hover 상태 관리 로직(`useHoverDisclosure`)은 재사용을 염두에 두고 컴포넌트 밖으로
  분리했다 — 다음 순서(#3, GlobalRiskBoard 마커 hover 툴팁)도 같은 종류의 hoverable/
  dismissible 요구사항이라 재사용 후보로 판단했으나, 실제 재사용 여부는 #3 구현 시점에
  마커 트리거의 이벤트 배선 방식에 따라 확정된다.

검증: 각 커밋 tsc/eslint/build 통과. Playwright로 (1) C7 — 최대 스크롤 지점에서 마지막
도트 active, 그 지점에서 500px 위로 이동 시 강제 active 해제, 기존 도트 클릭 이동 회귀
없음, (2) hover 툴팁 — 호버 전 완전히 숨김(opacity 0/pointer-events none) → 도트 호버 시
1단계(알약 1개, max-height 40px) → 배지 호버 시 2단계(8개 리스트, max-height 500px) →
완전히 벗어나면 닫힘 → 재호버 후 Escape로도 닫힘, 2단계 리스트에서 현재 활성 섹션(스크롤
위치 기준, 마지막 섹션 강제 active 케이스 포함) 강조 표시 전부 재현 확인. 스크린샷으로
헤더 비겹침·강조 표시 육안 확인 완료.

## 오류 및 기능 미흡 3차 라운드 — hover 툴팁 버그 2건 + scroll-margin-top 타겟 오류 수정 (2026-07-27)

2차 라운드(C7+#1) 직후 사용자 재검증에서 발견된 hover 툴팁 버그 2건과, 스크롤 싱크의
근본 원인(카드 padding 미고려)을 조사(읽기 전용) 후 수정한 라운드.

- **expanded 리셋 누락**: `useHoverDisclosure`가 `PageSectionDots` 전체에서 단일 인스턴스로
  호출되고 있어(도트마다 개별 인스턴스가 아님), 도트A에서 2단계까지 확장한 뒤 도트라인을
  벗어나지 않고 도트B로 이동하면 `hovered`만 바뀌고 `expanded`는 `true`로 남아 도트B도
  곧바로 8개 리스트로 뜨는 버그를 실측 확인. `openHover` 호출 시(대상이 바뀌든 같은 대상으로
  재진입하든) `expanded`를 함께 `false`로 리셋하도록 수정.
- **배지 위치가 호버 중인 도트에 뭉침**: 2단계 리스트가 "현재 호버 중인 도트 하나"에
  앵커링된 단일 `<div>` 안에 8개 항목을 통째로 렌더링하는 구조라, 배지 y좌표(실측
  107/135/163...)가 실제 도트 y좌표(93.8/120.8/149...)와 전혀 매칭되지 않고 항상 그 순간
  호버 중인 도트 근처에 뭉쳐 보임을 실측·스크린샷으로 확인. 8개를 한 리스트로 묶는 구조를
  버리고 각 `<li>`가 자기 자신의 배지 1개만 렌더링하도록 재구성 — 같은 `<ul>`, 같은 `gap`을
  쓰는 같은 li 기반이라 배지 간격이 도트 실제 간격을 별도 계산 없이 그대로 물려받는다.
  1단계는 호버 중인 도트의 배지만, 2단계(expanded)는 모든 배지가 동시에 나타나는 방식으로
  바뀌어, 개별 배지 높이가 고정이라 `max-height` 트랜지션이 더 이상 필요 없어졌다(opacity+
  transform만 사용). 이 재구성 과정에서 `onMouseEnter`(`openHover`)를 `<li>`가 아니라 실제
  도트(`<button>`)에만 걸도록 함께 변경 — `<li>`에 걸려 있으면 2단계로 확장된 뒤 배지
  영역(다른 도트들의 배지)을 마우스로 훑기만 해도 그 도트의 `onMouseEnter`가 불려 방금 고친
  리셋 로직 때문에 즉시 1단계로 닫혀버리는 새로운 문제가 생기기 때문(구현 중 발견, 도트
  버튼에만 걸어 해결 — "다른 도트로 실제 이동"할 때만 리셋되고 이미 열린 목록을 훑어보는
  동안엔 안 닫힘).
- **scroll-margin-top 타겟 오류**: 2차 라운드에서 `ScrollCard.module.css`의 `.title`(heading
  자체)에 걸었던 `scroll-margin-top`이 실제로는 heading만 헤더 아래 정확히 오게 할 뿐, 그
  위 `.panel`의 `padding: var(--space-4)`(16px)만큼 카드 테두리·배경은 헤더 뒤로 말려들어가는
  것을 실측(`sectionTop: 38.98` vs `headerHeight: 56`) 및 스크린샷으로 확인. `scroll-margin-top`
  을 `.title`에서 `.panel`(section 컨테이너) 자체로 옮기고, `PageSectionDots`의 `scrollToSection`
  도 `document.getElementById(headingId)`가 아니라 그 `closest('section')`을 `scrollIntoView`
  대상으로 삼도록 변경(CSS만 옮기면 실제 스크롤 대상이 여전히 heading이라 효과가 없어 함께
  변경 필요 — 사전 조사로 확인). 수정 후 `sectionTop: 55.98` ≈ `headerHeight: 56`으로 일치
  확인. `docs/naming-glossary.md`에 같은 서술(당초 "design-tokens.md에 있다"는 전제였으나
  실제로는 naming-glossary.md에 2곳 있었음 — 조사 중 발견해 정정)이 있던 두 곳도 함께 정정.

검증: 각 수정 tsc/eslint/build 통과. Playwright로 (1) 도트A 확장→도트B 이동 시 도트B가
1단계(배지 1개)로 시작·도트A는 완전히 꺼짐, (2) 서로 다른 도트를 확장 트리거로 써도 8개
배지의 y좌표가 완전히 동일(호버 대상 무관 고정 위치), 확장 중 배지 영역을 마우스로 훑어도
8개 모두 유지(닫히지 않음), (3) 클릭 이동 후 `section.top ≈ header-height` 일치, 기존 클릭
이동 회귀 없음 전부 재현 확인. 스크린샷으로 배지 정렬·카드 상단 비겹침 육안 확인.

## 오류 및 기능 미흡 4차 라운드 — hover 배지-도트 세로 정렬 버그 수정 (2026-07-27)

3차 라운드 직후 재검증에서 "배지 세로 위치가 도트와 미묘하게 어긋나 보인다"는 문제 제기를
받아 조사(읽기 전용) 후 수정한 라운드.

- **근본 원인**: `.dot`(`<button>`)의 기본 `display:inline-block`이 인라인 서식 문맥을
  만들어, 부모 `<li>`의 렌더링 높이가 버튼 자체의 8px이 아니라 상속된 line-height(16px
  폰트 기준 약 19px)로 부풀려지고, 버튼도 그 안에서 기본 `vertical-align:baseline`으로
  배치돼 li 중앙과도 어긋남을 Playwright 8개 도트 전수 실측으로 확인 — 활성/비활성 도트
  무관하게 항상 배지 중앙이 도트 중앙보다 정확히 7px 위(`diff:-7`)였다. `.hoverPanel`의
  `top:-8px` 고정 오프셋(e80922c에서 도입, 5566491의 "8개 개별 배치" 리팩터링 때도 값이
  그대로 남아있었음을 확인)이 li의 실제(부풀려진) 높이를 기준으로 계산돼 있었을 뿐, li
  높이 자체가 이미 도트와 어긋나 있었다는 게 진짜 원인.
- **수정**: 값 미세조정이 아니라 계산 기준 자체를 바꿈 — `.dot`에 `display:block`을 줘
  인라인 서식 문맥을 없애 li 높이가 정확히 도트 자체의 8px과 같아지게 하고, `.hoverPanel`도
  고정 px 오프셋 대신 `top:50%; transform:translateY(-50%)`(li 중앙 기준 퍼센트 정렬)로
  되돌려 "li 중앙 = 도트 중앙"이 구조적으로 보장되게 했다. 이전에 퍼센트 중앙 정렬을
  포기했던 이유(배지가 500px까지 확장되며 그 절반만큼 위로도 자라 Header를 침범하던 문제,
  2차 라운드 참고)는 지금은 배지 높이가 24px 고정(리스트 전체가 아니라 배지 1개만
  렌더링, 5566491)이라 재발하지 않음을 실측으로 확인.
- 이번 정렬 기준은 도트 컬럼(`PageSectionDots`) 내부에 한정되며, 다음 작업(#3
  `GlobalRiskBoard` 마커 hover 툴팁, Leaflet 좌표 기반 앵커링)에 그대로 재사용 가능하다고
  가정하지 않는다 — 사용자 확인 사항.

검증: tsc/eslint/build 통과. Playwright로 8개 도트 전수 배지-도트 중앙 좌표 차이가 수정
전 전부 `diff:-7`이었던 것이 수정 후 전부 `diff:0`(서브픽셀 오차 없이 완전 일치)임을
재확인. 배지 범위(y=80~216) 전체를 2px 단위로 정밀 스윕해도 마지막 경계(패널을 완전히
벗어나는 지점, 정상 동작) 외엔 8개 전부 유지돼 회귀 없음 확인. 스크린샷으로 배지-도트
정렬 육안 확인.

## scroll-margin-top 조사 보고 오류 정정 (2026-07-27)

0-3 조사 단계에서 "design-tokens.md 서술과 코드 일치(drift 없음)"로 보고했으나, 실제로는
design-tokens.md에 scroll-margin-top 관련 서술 자체가 없었음(grep 0건). 해당 서술은
docs/naming-glossary.md에만 있었음. 검토하지 않은 사실을 검토한 것처럼 보고한 사례 —
5566491 커밋에서 grep 재확인 후 정정.

## GlobalRiskBoard 마커 hover 툴팁 — confidence_label 노출 (#3, 2026-07-27)

`PageSectionDots` 도트 hover(#1) 직후 같은 종류로 예정돼 있던 `GlobalRiskBoard` 마커 hover
작업. 조사(읽기 전용) → 설계 확정 → 구현 순으로 진행했다.

- **조사 결과**: 마커 클릭 시 열리는 상세 패널이 이미 `material`/`grade`/`confidence_label`/
  `event_summary`를 보여주고, 마커 색상은 이미 `grade`를 반영(`GRADE_COLOR` 미러링), permanent
  Tooltip도 이미 국가명+자재명(이벤트뷰) 또는 국가명+등급+건수(국가뷰)를 상시 표시 중이라,
  클릭 전까지 어디에도 안 보이는 필드는 `confidence_label`뿐임을 확인. react-leaflet의
  `<Tooltip>`은 `permanent`를 빼면 Leaflet이 hover 자동 처리를 하지만, 국가뷰가 이미 겪은
  제약(레이어 하나에 Tooltip 두 개 못 붙임, `bindTooltip`이 마지막 호출만 유지)이 여기도
  적용됨을 확인.
- **설계 확정(개발자 승인)**: 내용은 `confidence_label`만(가장 간결, 클릭 패널과 중복 없음,
  Seq 20 신뢰도 라벨 상시 표시 원칙과 부합). 구현 방식은 네이티브 `<Tooltip>` —
  `useHoverDisclosure`/좌표 기반 커스텀 오버레이는 채택 안 함(근거를
  `docs/roadmap-candidates.md` C9에 기록, 후속 재질문 방지 목적).
- **구현**: 위 제약 때문에 별도 hover 전용 Tooltip을 새로 붙이지 못해, 기존 permanent
  Tooltip 안에 `hoveredKey` state(`CircleMarker`의 `eventHandlers.mouseover`/`mouseout`로
  갱신)로 `ConfidenceBadge`를 조건부 렌더링하는 방식으로 구현 — "완전히 Leaflet 자동 처리에만
  맡기는" 애초 구상보다는 최소한의 커스텀 state가 필요했다. 국가뷰는 여러 `risk_event`를
  대표(`representative`, 최고 심각도)로 집계하는 기존 방식과 일관되게 대표 이벤트의
  `confidence_label`을 그대로 씀(새 집계 규칙 없음, 이벤트뷰와 다른 처리 불필요).
  `.markerLabelConfidence`는 `display:block`으로 부모 `.markerLabel`의 `white-space:nowrap`과
  무관하게 새 줄에 배지가 오도록 함.

검증: tsc/eslint/build 통과. Playwright로 이벤트뷰/국가뷰 각각 마커 hover 시 툴팁 텍스트에
신뢰도 라벨("확정" 등)이 추가되고 hover 해제 시 사라짐, 클릭 시 기존 상세 패널이 정상적으로
열림(회귀 없음) 전부 재현 확인. 스크린샷으로 배지가 permanent 라벨 아래 새 줄에 올바르게
표시되는 것 육안 확인.

## PageSectionDots 도트 간격 회귀 수정 (0dd37cd의 부수 효과, 2026-07-27)

`0dd37cd`(li 중앙=도트 중앙 정렬 수정 — `.dot`을 `display:inline-block`→`display:block`으로
변경)의 **부수 효과로 도트 간격이 27px→16px로 축소**되고, 그 결과 2단계 hover 시 24px
고정 높이 배지 8개가 서로 8px씩 겹치는 회귀가 발생했음을 사용자 재검토로 발견 → 조사 →
`f23f019`에서 수정.

- **인과관계**: `.dot`의 `display:block` 전환은 li 자체 높이를 인라인 서식 문맥의
  line-height 부풀림(약 19px)에서 버튼 실제 크기(8px)로 정확히 맞추는 게 목적이었다(정렬
  버그 근본 수정, `0dd37cd`). 그런데 `.dots`의 `gap`(`var(--space-2)`, 8px)은 그대로였기
  때문에, "li 높이 + gap"으로 결정되는 실제 도트 간격도 함께 27px(19+8)→16px(8+8)로
  줄어드는 부수 효과가 같이 발생했다 — 이 세션에서 `5566491` 시점 실측치(간격 ~27px)와
  `0dd37cd` 이후 실측치(16px)를 직접 비교해 확정. `0dd37cd` 당시 검증(정렬 diff, 클릭 회귀,
  배지 겹침 스윕)은 "정렬"과 "겹침 스윕"만 확인했을 뿐 "간격 자체가 좁아졌는지"는 별도로
  측정하지 않아 이 부수 효과를 놓쳤었다.
- **수정**: `f23f019`에서 li 높이(=정렬 기준, `0dd37cd`의 목적)는 8px로 그대로 두고,
  `.dots`의 `gap`만 `var(--space-6)`(24px)로 늘려 간격을 32px(8+24)로 복구 — 배지끼리도
  8px(32-24) 여유가 생겨 겹침이 해소됐고, 정렬(`diff:0`)은 그대로 유지된다.

검증: tsc/eslint/build 통과. Playwright로 (a) 인접 배지 8개 전부 겹침 없음(8px 여유) 확인,
(b) `0dd37cd` 정렬 검증 재실행 — 8개 도트 전수 `diff:0` 유지, (c) 700px 좁은 뷰포트에서
도트 컬럼이 리모컨과 안 겹치고 화면 안에 다 들어옴(스크린샷), (d) C7 최하단 강제 active
로직 회귀 없음 전부 재현 확인.

## 백엔드 회신 반영 — CORS 4173 + 테스트 계정 시드 적용, e2e 24/24 확보 (2026-07-27)

백엔드 팀(minji) 회신을 받아 backend 레포(`minji` 브랜치)를 pull하고, 실 백엔드 연동을
재검증한 라운드.

- **backend pull**: `git fetch`/`checkout minji`/`pull`로 7개 커밋 fast-forward.
  `bb9f17a`("프론트 e2e용 테스트 계정 시드 + CORS 4173 허용")에서 `CORS_ALLOWED_ORIGINS`
  (`.env.example`/`docker-compose.yml`/`application.yml`)에 `http://localhost:4173` 추가,
  `AuthTestSeedConfig`(`AUTH_TEST_SEED_ENABLED=true`일 때만 동작, 기본 `false`)로
  `purchasing`/`planning`/`executive@test.local`(비번 `test1234!`, APPROVED)과
  `pending@company.com`(비번 `anything`, PENDING) 4계정을 실 DB에 upsert하는 기능이 추가된
  걸 코드로 확인 — FE e2e/mock의 계정 스펙과 정확히 일치. backend README.md는 이번 pull로는
  안 바뀌었지만, 확인해보니 이미 최신 CORS/AUTH_TEST_SEED 설정과 어긋나 있음을 발견(3000/5173만
  언급, 4173·AUTH_TEST_SEED_ENABLED 안내 없음) — backend 레포 자체의 문서 drift라 FE 쪽에서
  고치지 않고 참고로만 기록.
- **로컬 백엔드 재기동**: `AUTH_TEST_SEED_ENABLED=true`를 backend `.env`(gitignore 대상)에
  설정 후 `docker compose up -d --build postgres fastapi spring`으로 이미지 재빌드+재기동,
  로그에서 "Auth test-seed completed: 4 accounts upserted" 확인.
- **검증**: `.env.live`의 `VITE_API_BASE_URL`이 재기동한 백엔드와 일치 확인. e2e 코드
  (`e2e/utils.ts` 기본 비번 `test1234!`, `pending-approval.spec.ts`의 `'anything'`)가 회신값과
  이미 일치해 수정 불필요. `npm run dev:live`로 로그인/틀린 비밀번호/회원가입 PENDING/PENDING
  로그인 락 화면 4개 시나리오 전부 정상 확인.
- **e2e 24개 실측 — 23/24 → 원인 규명 → 24/24**: `npx vite build --mode live` +
  `npx playwright test`로 실 백엔드 대상 e2e를 처음 돌렸을 때 24개 중 1개 실패
  (`pending-approval.spec.ts`의 "회원가입을 제출하면 항상 승인 대기 화면으로 전환된다").
  원인을 규명한 결과 앱 버그가 아니라 **mock(무상태) vs 실 DB(유니크 제약)의 차이**였다 —
  이 테스트가 고정 이메일 `hong@company.com`을 쓰는데, mock은 상태가 없어 몇 번을 가입해도
  항상 성공하지만 실 백엔드는 영구 DB라 이메일 유니크 제약이 있어 같은 DB에 반복 실행하면
  두 번째 실행부터 중복으로 거부된다(실 DB 조회로 해당 이메일이 이미 `PENDING`으로 존재함을
  확인). FE의 `signupApi`가 이 에러를 정상적으로 `throw`→`authError`로 처리하는 것도 확인돼
  FE 에러 처리 자체는 문제없었다. 이 테스트 1건만 고유 이메일(`` hong-${Date.now()}@company.com
  ``)을 쓰도록 수정(다른 e2e 스펙/테스트 계정은 그대로 유지) → 재실행 결과 24/24 통과 확인.

문서 동기화: `docs/backend-integration-guide.md` "알려진 이슈"에서 "e2e 프리뷰 포트(4173)
CORS 미허용"과 "테스트 계정 3종 미시드" 항목을 해결됨으로 갱신(삭제 대신 취소선+해결
이력 유지), CI에서도 `AUTH_TEST_SEED_ENABLED=true`가 필요하다는 점과 "실 DB 대상 e2e는
고정 이메일 재사용 시 유니크 제약으로 실패할 수 있음" 항목 신규 추가.
`docs/roadmap-candidates.md` C6을 "해결됨(2026-07-27)"으로 갱신(삭제하지 않고 해결 이력
유지). `docs/roadmap.md` Phase 6.5에 백엔드 쪽 테스트 계정 시드 존재를 반영(FE mock 계정의
"배포 전 삭제 대상" 원칙 자체는 그대로 유지). CLAUDE.md "개발 시 참고 원칙"에 "다른 레포
pull 시 README.md도 함께 확인" 신규 원칙 추가(이번에 backend README가 이미 낡아있었던 것을
발견한 계기로).

## 토큰 저장 방식(C5) 논의 경과 — 결론 아님 (2026-07-27)

백엔드 개발자가 인증 토큰 저장 방식(현행 메모리 전용) 재검토를 제안해 논의 진행 중. 아직
결론이 난 사안이 아니라 "논의 경과"로만 기록한다(`docs/roadmap-candidates.md` C5도 같은
취지로 "미착수"에서 "논의 중"으로 갱신).

- 백엔드 제안 → **localStorage는 채택하지 않기로 합의**(XSS 노출 우려, 백엔드도 동의) —
  유일하게 확정된 결론.
- 지금(①단계)은 현행 메모리 전용 그대로 유지, 변경 없음. 데모 중 새로고침 유지가 실제로
  필요해지면 sessionStorage 전환을 1순위 후보로 검토(탭 닫으면 소멸, Phase 8 하드 리다이렉트
  로직과 충돌 적음) — 이 부분도 아직 "필요해지면"이라는 조건부라 착수한 것은 아님.
  sessionStorage 전환이 실제로 필요해지는 시점이 오면 그때 Phase 8 하드 리다이렉트 로직
  재검토를 실제 작업으로 착수한다.
- httpOnly 쿠키 + refresh token 회전으로의 전환은 **방향 자체는 합의**됐으나(백엔드 구현
  사항), **시점이 아직 재조율 중** — 백엔드는 처음에 "배포 단계"로 제안했으나, 실 백엔드
  연결 QA 시점에 미리 구현·검증해두는 게 낫다는 의견을 전달했고 백엔드 확인 대기 중이다.

이번 항목은 코드 변경이 전혀 없는 문서 전용 갱신이다 — 백엔드 회신이 오면 후속 라운드에서
다시 갱신한다.

## C5 최종 갱신 — httpOnly 쿠키 전환 설계 확정 (2026-07-27)

백엔드가 httpOnly 쿠키 전환 가능·설계 확정 회신(Set-Cookie/쿠키에서 읽기/로그아웃 시 삭제/
FE credentials:include), 구현은 FE의 silent refresh 착수 시점에 맞춰 별도 트랙으로 유지하기로
최종 합의. `docs/roadmap-candidates.md` C5를 "논의 중"→"설계 합의 완료, 구현 대기"로 갱신
(직전 항목은 그대로 두고 append만, 수정하지 않음). 코드 변경 없음.

## 공개 지도 엔드포인트 연결 — 최초 실 API 연동 (2026-07-27)

공개 대시보드(비로그인) 글로벌 리스크 관제 지도를 백엔드 `GET /api/v1/public/risk-board`
(`b8d44b9` 신설)에 연결한 라운드. 조사(백엔드 컨트롤러/DTO 코드 직접 확인) → 설계 승인
→ 구현 순으로 진행했다.

- **스키마 확인**: `PublicController.java`/`RiskEventDto.RiskBoardItem` 코드 확인 결과
  `risk_event` 전체가 아니라 공개용으로 의도적으로 축약된 별도 구조였고(erp_view/
  quality_check/rag_view 제외), 백엔드 DTO 주석에 "프론트 GlobalRiskBoardItem 계약과 1:1"
  이라고 명시돼 있어 실제로 필드가 정확히 일치함을 확인 — 변환 로직 불필요.
  `SecurityConfig`에서 `/api/v1/public/**`가 `permitAll` 확인. 데이터는 백엔드 자체가
  "F3/F4 모델·뉴스 파이프라인 배선 전까지 결정론적 placeholder"라고 명시(코드 주석) —
  다만 응답에 이를 나타내는 필드(예: `is_simulation` 같은)는 없어, FE도 별도 placeholder
  표시 UI를 추가하지 않기로 결정(공개 대시보드 다른 3개 패널도 mock 기반이나 표시 없는
  기존 관례와 일관 유지).
- **구조 확인**: `fetchGlobalRiskBoard()`(purchasing.api.ts)를 공개 대시보드와 구매팀
  대시보드가 동일하게 호출하고 있어, mock을 그대로 실 API로 바꾸면 구매팀 대시보드까지
  영향받는 구조였음을 확인 — 분리 설계 필요.
- **구현**: `public.api.ts`에 `fetchPublicRiskBoard()` 신규(`VITE_API_BASE_URL` 설정 시
  실 API `fetchJson` 호출 — 토큰 불필요라 기존 `fetchJson`을 그대로 재사용, 별도 인증
  헬퍼 불필요, 미설정 시 기존 `fetchGlobalRiskBoard()`로 폴백). `purchasing.api.ts`의
  `fetchGlobalRiskBoard()`는 무변경 — 구매팀 대시보드는 여전히 mock. `PublicDashboardPage.tsx`
  만 import 교체, `useState`/`useEffect`로 최소 비동기 처리(코드베이스 최초의 실제 비동기
  API 연동이지만 `useQuery` 도입은 이번엔 보류 — `docs/roadmap-candidates.md` C11에 결정
  기록). 로딩 중엔 최소 텍스트만 표시.

검증: tsc/eslint/build 통과. 백엔드 `git pull`(`f58bea9`→`7f01c2b`, `b8d44b9` 포함) 후
`docker compose up -d --build`로 재기동, `curl`로 엔드포인트 직접 확인(4건 응답, 스키마
일치). Playwright로 (1) `dev:live`(실 API) — 공개 대시보드 마커 4개, 백엔드 응답과 정확히
일치, (2) `dev`(mock) — 공개 대시보드 마커 6개(mock 전체), 실 API와 명확히 구분됨, (3)
`dev`(mock) — 구매팀 대시보드 마커도 동일하게 6개, 회귀 없음 전부 확인. 스크린샷으로
실 API 지도 렌더링 육안 확인.

문서 동기화: `docs/mock-schemas.md` "4-1"(신규, 4번과 구분되는 실제 백엔드 계약 섹션)
추가. `docs/roadmap.md` Phase 10.11로 반영. `docs/naming-glossary.md`
(`fetchPublicRiskBoard`/`PublicDashboardPage`/`public.api.ts` 갱신). `docs/roadmap-candidates.md`
C11에 "QueryClientProvider 도입 안 함" 결정 보강(기존 내용과 어긋나지 않아 신규 생성 없이
추가만).

## 스크롤힌트 클릭 시 페이징 이동 — #6-1 구현 (2026-07-27)

"오류 및 기능 미흡 발견" #6-1("좌우 스크롤카드에 대해서는 스크롤힌트가 클릭 시 스크롤
이동을 수행하도록 규칙 수정. 이동 간격은 현재 보이는 카드가 (1,2,3,4>)였다면
(4,5,6,7>)이 되도록")을 조사(원문이 가리키던 대상이 여전히 존재하는지 확인) → 설계 승인
(적용 범위: `MaterialRiskOverviewRow`(하위섹션)+`MaterialRiskOverviewSection`(상위 섹션)
둘 다) → 구현 순으로 진행했다.

- **조사**: 원문의 "스크롤힌트"는 이미 폐기된 `ScrollHint`(세로축, 공개 대시보드 전용)가
  아니라 지금도 존재하는 `HorizontalScrollHint`(가로축, 2026-07-27 공용화)를 가리킴을
  확인. 코드 직접 확인 결과 `HorizontalScrollHint`는 `aria-hidden="true"` `<div>`로,
  `onClick`이 전혀 없는 순수 시각 힌트였다 — 원문이 가리키던 대상이 없어진 게 아니라
  그 대상은 그대로 있고 클릭 기능만 애초부터 빠져 있었던 상태(재해석 불필요, 그대로 구현
  가능).
- **구현**: `HorizontalScrollHint`에 선택적 `onClickLeft`/`onClickRight` prop 추가 —
  전달되면 `<button aria-label="이전/다음 카드 보기">`로, 없으면 기존과 동일하게
  `<div aria-hidden>`로 렌더링(하위 호환, CSS도 `div.../button...` 선택자로 분기).
  `src/lib/scrollHorizontalByPage.ts` 신규 — `container.clientWidth - 첫 번째 자식 카드의
  실제 렌더링 폭`을 매번 계산해 그만큼 `scrollBy({behavior:'smooth'})`(카드 폭 하드코딩
  없음, 두 컴포넌트의 서로 다른 카드 폭에 그대로 대응). `MaterialRiskOverviewRow`/
  `MaterialRiskOverviewSection` 둘 다에 연결.

검증: tsc/eslint/build 통과. Playwright로 (1) `MaterialRiskOverviewRow`(9장, 고정 180px
카드) — 오른쪽 힌트 클릭 시 계산된 스텝(예: 736px 컨테이너 기준 556px)과 실제 이동량이
정확히 일치, 왼쪽 힌트로 되돌리면 원위치, 스크롤 끝에서 오른쪽 힌트 사라지고 왼쪽 힌트만
남음(회귀 없음) 확인. (2) `MaterialRiskOverviewSection`(3장, 가변 240px 카드) — 좁은
뷰포트(900px)에서는 카드 1장(240px)이 컨테이너(236px)보다 넓어 계산된 스텝이 음수로
클램프돼(`Math.max(...,0)`) 이동 없음(정상, 버그 아님)을 확인했고, 넓은 뷰포트(1400px)
에서는 전체 오버플로 자체가 16px뿐(카드 3장이 컨테이너에 거의 다 들어감)이라 496px 스텝이
브라우저의 `scrollBy` 클램핑으로 자연스럽게 최대치(16px, 끝까지 스크롤)로 수렴함을 확인 —
둘 다 `scrollHorizontalByPage`의 결함이 아니라 스크롤 가능 범위 자체가 짧은 정상 케이스.
좌우 힌트 회귀도 두 컴포넌트 모두 정상.

문서 동기화: `docs/design-tokens.md` "스크롤 UI 노출 원칙" 표에 `HorizontalScrollHint`가
두 소비처 모두에서 클릭 가능해졌다는 점 갱신. `docs/naming-glossary.md`
(`HorizontalScrollHint`/`scrollHorizontalByPage`/`MaterialRiskOverviewRow`/
`MaterialRiskOverviewSection` 갱신).

## AlertsPanel 접기/펼치기 + hover 미리보기+고정 (#7, 2026-07-27)

"오류 및 기능 미흡 발견" #7("알림 섹션에 대해서도 접기 버튼 추가... 계정정보와 로그아웃
사이에 아이콘 배치... 숫자로 알림 개수 표시") 구현. 조사 → 설계 확정 → 상태 관리 방식
정정(로컬 useState→Context) → 추가 조사 → 구현 순으로 진행했다(10.10에서 예정으로
남겨뒀던 3차 라운드의 마지막 항목, #6-1과 짝).

- **조사**: `AlertsPanel`은 `ScrollCard`를 안 쓰는 자체 sticky 패널(SideNav와 동급 "앱
  뼈대")이고, 접기 기능 자체가 전혀 없었으며(신규 기능), 소비처가 `PurchasingDashboardPage`
  하나뿐임을 확인. design-tokens.md d항목("리스트 4개 초과 시 overflow")과 일관되게
  미리보기 개수 N=4로 제안·승인. `useHoverDisclosure`는 "벗어나면 항상 초기화" 모델이라
  "미리보기→클릭 시 고정(pin, 영구)" 요구사항과 안 맞고, 트리거(헤더 벨)-콘텐츠(우측
  sticky 컬럼)가 화면상 떨어져 있어 도트 인디케이터의 DOM 포함 관계 트릭도 그대로는
  안전하지 않아 재사용하지 않기로 결정 — 대신 트리거·콘텐츠 어느 쪽 호버든 유지되고 둘
  다 벗어난 뒤 150ms 디바운스로 닫는 방식 채택.
- **상태 관리 방식 정정**: 최초 설계는 `expanded`를 `PurchasingDashboardPage`의 로컬
  `useState`로 뒀으나, "페이지 이동 시 상태 유지" 요구사항이 확인되며 `SideNavContext`와
  동일한 Context/Provider/hook 3파일 패턴(`AlertsPanelContext`)으로 정정. 추가 조사로
  `SideNavProvider`가 `App.tsx` 최상위(`AppRoutes` 바깥)에서 전 라우트를 커버함을 확인하고,
  Purchasing→브리핑 상세→(`page.goBack()`, React Router 클라이언트 사이드 내비게이션)
  Purchasing 왕복에서 `collapsed` 상태가 실제로 유지되는 걸 실측 재현해 "정상적으로
  유지되는 패턴"을 먼저 확인한 뒤 `AlertsPanelContext`도 같은 위치에 그대로 따라 배치.
  `isPreviewing`(hover 미리보기)은 페이지 이동으로 유지될 필요가 없어 로컬 상태로 유지
  (상태 분리 원칙은 `docs/design-tokens.md` "카드 레이아웃·스크롤 규칙" e항에 일반화해
  기록).
- **구현**: `Header`에 `accountExtra`(선택) prop 신규(계정정보-로그아웃 사이 슬롯, 미전달
  시 무변경) — `AlertsBellButton`(신규, 배지+토글+hover 이벤트 전달)을 그 슬롯에 꽂음.
  `AlertsPanel.tsx`의 필터 로직은 react-refresh 규칙(컴포넌트 파일은 컴포넌트만 export)에
  걸려 `lib/selectAlertEvents.ts`로 분리. `AlertsPanel`은 `expanded`일 때 기존과 동일한
  전체 목록(자체 sticky, `useScrollOverflowHint`), `!expanded`일 때 `.wrapper`가 폭 0(SideNav
  접기와 동일한 width 트랜지션), 그 상태에서 `isPreviewing`이면 상위 4개를 `ScrollCard`로
  감싼 오버레이가 `position:absolute`+opacity/transform으로 떠오름 — 조건부 마운트 대신
  항상 DOM에 렌더링해두고 클래스로만 토글(HorizontalScrollHint와 동일 이유, 등장/퇴장
  transition을 살리기 위함). ESC로도 미리보기 닫힘.

검증: tsc/eslint/build 통과. Playwright로 (1) 기본 펼침 확인, (2) 배지 숫자(`alerts.length`)
일치, (3) 클릭 시 접힘(wrapper 0px), (4) 접힘+벨 호버 시 미리보기(4개 이하, ScrollCard)
등장, (5) 마우스 이탈 150ms 후 정확히 사라짐(100ms 시점엔 opacity 1, 400ms 시점엔 0), (6)
트리거→콘텐츠 이동 시 안 사라짐, (7) 미리보기 중 클릭 시 고정(펼침, wrapper 280px), (8)
재클릭 시 닫힘, (9) ESC 닫힘, (10) **Purchasing→브리핑 상세→뒤로가기 왕복 시 expanded 상태
유지**(신규 검증 항목) 전부 확인. 공개 대시보드·경영진 대시보드(accountExtra 미전달)에
벨 아이콘이 안 나타남(Header 회귀 없음)도 확인. 스크린샷으로 헤더 배지·미리보기 카드
렌더링 육안 확인.

조사 중 함께 발견: `docs/naming-glossary.md`의 `useHoverDisclosure` 항목이 "향후
GlobalRiskBoard 마커 hover 재사용 후보"라고 적혀 있었으나 실제로는 C9에서 재사용하지
않기로 이미 확정됐던 상태(문서가 그 결정을 반영하지 못하고 있었음) — 이번에 함께 정정.

문서 동기화: `docs/design-tokens.md` "카드 레이아웃·스크롤 규칙" e항 신규(트리거-콘텐츠
분리형 hover 프리뷰+고정 패턴, 상태 분리 일반 원칙). `docs/naming-glossary.md`
(`AlertsBellButton`/`Header`/`AlertsPanel`/`AlertsPanelContext`/`AlertsPanelProvider`/
`useAlertsPanelState`/`selectAlertEvents`/`PurchasingDashboardPage`/`App.tsx`/
`useHoverDisclosure` 정정 갱신). `docs/roadmap.md` Phase 10.12로 3차 라운드(#6-1+#7)
완료 반영.

## ImportDependencyRow 반응형 브레이크포인트 신설 (2026-07-27)

`ImportDependencyRow`(수입 의존도+원자재 가격 추이 2단, `340px 1fr` grid)가 좁은 뷰포트에서
잘려 보인다는 문제 제기를 조사(읽기 전용) → 설계 승인 → 구현한 라운드.

- **조사**: `git log --oneline --all`로 이 컴포넌트를 다룬 커밋이 신설 커밋(`5c4a812`,
  Phase 9.4) 단 하나뿐임을 확인 — **회귀가 아니라 애초에 반응형 브레이크포인트가 없던
  미구현**. `340px`가 고정 px 트랙이라 부모가 좁아져도 줄지 않는 게 원인. 공개 대시보드
  Phase 10.1의 `760px` 브레이크포인트는 대칭 2컬럼(`minmax(360px,1fr)` 둘 다 가변)이라
  패턴은 재사용 가능해도 값은 그대로 못 씀. 실측으로 오버플로 경계를 `960px(정상)~
  940px(오버플로 시작)`까지 좁혀 특정.
- **전수 스캔**: `grid-template-columns`/`display:grid` 전체 grep으로 후보 4곳(이 건 포함)을
  찾아 각각 뷰포트 스캔 — `CumulativeRiskKpi`(경영진, `repeat(3,1fr)`)/`ExecutiveDashboardPage
  .bottomRow`(`1fr 1fr`)/`MaterialPriceDetail .summaryGrid`(공개 대시보드에서 단독 확인,
  `repeat(3,1fr)`)는 400~320px까지 전부 오버플로 없음(순수 `1fr`류는 구조적으로 안전함을
  실측 확인) — 같은 문제는 `ImportDependencyRow` 1곳뿐.
- **범위 밖 발견 1(별도 기록)**: 전수 스캔 중 Planning 대시보드에서 460px 이하 필터 pill
  줄바꿈 부재로 인한 오버플로를 우연히 발견 — grid 컬럼 문제가 아니라 별개 원인이라
  `docs/roadmap-candidates.md` C12로 기록만 하고 수정하지 않음.
- **구현**: `.row`에 `@media (max-width: 940px) { grid-template-columns: 1fr; }` 추가.
  카드 순서(수입 의존도→원자재 가격 추이)는 그대로 유지.

검증: tsc/eslint/build 통과. Playwright로 SideNav 펼침/접힘 두 상태 모두 940px 경계 안팎
재확인 — 펼침 상태는 940px에서 정확히 1컬럼 전환되고 700px까지 오버플로 없음, 접힘
상태는 같은 전환 후 500px까지 오버플로 없음, 두 상태 모두 940px 이상에서 기존 2컬럼
배치 유지(회귀 없음) 확인.

**범위 밖 발견 2(사용자 확인 대기, 아직 기록 안 함)**: 검증 중 SideNav **펼침** 상태에서
650px 이하로 좁히면(940px 전환 이후에도) 다시 오버플로가 재현됨을 발견 — 원인은
`ImportDependencyRow`와 무관하게, `SideNav`(220px)+`PageSectionDots` 레일(40px)+
`AlertsPanel`(280px, 기본 펼침 상태)이 전부 `flex-shrink:0`인 비수축 "앱 뼈대" 요소라
좁은 뷰포트에서 `<main>`의 실제 폭이 극단적으로 줄어들고(650px 뷰포트에서 48px까지 관찰),
그 안의 개별 콘텐츠(예: 캐러셀 카드 1장 고정폭)가 그 좁은 `<main>`보다 커서 넘치는
구조적 문제로 추정된다(캐러셀 자체의 `overflow-x:auto`는 정상 작동 확인 — 컨테이너
자체가 아니라 `<main>`이 비정상적으로 좁아지는 게 근본 원인). `ImportDependencyRow`
수정 범위 밖이라 이번엔 손대지 않았고, C12와 마찬가지로 별도 기록(C13 후보) 여부를
사용자에게 확인받는 중 — 승인 시 후속 커밋에서 `docs/roadmap-candidates.md`에 추가한다.

## C13 정식 등재 (2026-07-27)

위 "범위 밖 발견 2"(SideNav 펼침 상태 650px 이하 재오버플로)를 `docs/roadmap-candidates.md`
C13으로 정식 등재. 코드 변경 없음, 문서 전용.

## 문서 재구성 — 확정 계약 분리 + mock 시연 가이드 신설 (2026-07-27)

`docs/mock-schemas.md`가 "제안"과 "실측 검증된 확정 계약"을 구분 없이 한 문서에 섞고
있던 것을 분리하고, mock 단독 시연 절차를 담은 문서를 신설한 라운드.

- **조사**: `docs/mock-schemas.md`의 어떤 섹션이 실제로 백엔드와 검증됐는지 확인 —
  "3. 인증"(실 백엔드 연동 시연 4개 시나리오 + Playwright e2e 24/24)과 "4-1"(공개 지도,
  백엔드 코드 직접 확인+curl+Playwright 실측) 2건만 확정. 나머지(2계층/3계층/브리핑/구매팀
  확장)는 관련 컨트롤러(`DashboardController`/`BriefingController` 등)가 백엔드에 이미
  존재하긴 하지만 이번 세션에서 실측 검증한 적이 없어 이동 대상에서 제외(향후 별도 라운드
  후보로만 기록).
- **이동 중 발견한 불일치(정정)**: "3. 인증" 섹션을 실제 코드(`src/api/auth.api.ts`)와
  대조하다 두 가지 오류 발견 — (1) URL이 `/api/auth/...`로 적혀 있었으나 실제는
  `/api/v1/auth/...`(버전 접두사 누락), (2) 회원가입 응답이 `{user_id, status, message}`로
  적혀 있었으나 실제 백엔드는 `message` 필드가 없고 `org_tier`를 내려주며 FE가 안내
  문구를 직접 합성한다(코드 주석으로 확인). CLAUDE.md 드리프트 수정 원칙에 따라 이동하며
  함께 정정.
- **`docs/backend-api-contracts.md` 신규**: 위 확정 2건(인증, 공개 지도) 이동. 응답 봉투
  (`{success,data,timestamp}`)를 `fetchJson`이 벗겨서 넘긴다는 점, 로그인/회원가입 실패
  케이스(`INVALID_CREDENTIALS`/`DUPLICATE_USERNAME` 등, mock에는 없던 케이스)도 코드
  확인 내용을 추가로 기록. `mock-schemas.md`의 해당 섹션 자리에는 "→ 확정됨, 이동 위치"
  한 줄만 남김(이력 추적용).
- **`docs/frontend-demo-guide.md` 신규**: `npm run dev`(①단계) 기준 전체 화면 시연 순서 —
  공개 대시보드 → 로그인(테스트 계정 표) → 구매팀 대시보드(패널 순서대로) → 브리핑 상세 →
  2/3계층 대시보드. 이번 3차 라운드에서 새로 생긴 기능(도트 2단계 hover, 스크롤힌트
  페이징, 알림 패널 hover-고정, 마커 hover confidence_label)도 각 시연 지점에 간단히
  언급. `docs/backend-integration-guide.md`(②단계 절차)와 책임 분리를 문서 상단에 명시.
- **문서 체계 갱신**: CLAUDE.md "프로젝트 문서" `@import` 목록에 두 신규 문서 추가.
  README.md "참고 문서" 표에 추가하고, "API 명세"/"실행 방법" 문단도 확정 계약 분리
  사실을 반영해 갱신. `docs/naming-glossary.md`는 코드 물리/논리명 사전이라 문서 파일
  자체는 등재 대상이 아니라고 판단해 갱신하지 않음(기존에도 문서를 인용만 함, 별도
  항목 없음).

코드 변경 없음 — 문서 전용 라운드.
