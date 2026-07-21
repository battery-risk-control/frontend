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

## Phase 7 — 예정
git remote 연결 및 첫 커밋 (미착수)
