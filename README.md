# 배터리 원자재 공급망 리스크 관제 AI 에이전트 — Frontend

2차전지(배터리) 제조사의 구매팀을 대상으로, 리튬·코발트·니켈 등 핵심 원자재의 가격 변동과 지정학적 리스크를 상시 감지하고 사내 계약 조건·ERP 실적 데이터와 자동으로 대조해 구매 담당자와 의사결정자가 신속히 판단할 수 있도록 돕는 AI 기반 의사결정 지원 플랫폼의 React 대시보드입니다.

사용자는 3계층으로 나뉩니다: 리스크가 실제로 탐지·대응되는 **구매팀(1계층, 실무)**, 이를 집계해 전사 관점 패턴을 보는 **경영기획팀(2계층)**, 압축된 핵심 지표로 최종 의사결정을 내리는 **경영진(3계층)**. 백엔드 레포와 분리된 별도 레포로 운영되며, 이 레포만으로 프론트엔드 개발·리뷰가 완결됩니다.

핵심 원칙(화면 전반에 적용):
- **비예측 원칙** — 미래 가격·리스크를 예측하지 않는다(경영진 대시보드의 "예상 절감액"은 시뮬레이션임을 명시하는 예외).
- **하이브리드 신뢰도 표시** — 모든 리스크 판단에 확정/참고/경고 라벨을 표시한다.
- **병기 원칙** — ERP 관점과 RAG(계약) 관점 결과를 하나로 합치지 않고 나란히 제시한다.
- **내부 참고자료 한정** — 산출물은 대외 발송 문서가 아니라 내부 참고 자료다.

## 서비스 플로우

![서비스 플로우](docs-ref/service-flow/빅프로젝트_서비스_플로우.png)

비로그인 공용 대시보드(증시/환율, 글로벌 리스크 맵, AI 권고, 원자재 가격 추이, 뉴스 속보)에서 로그인하면 구매팀(1계층)/경영기획팀(2계층)/경영진(3계층)으로 권한이 분리되고, 계층마다 서로 다른 화면 구성이 제공됩니다.

## 기술 스택

- **React 19 + TypeScript + Vite**
- **react-router-dom** — 클라이언트 라우팅
- **서버 상태**: TanStack Query — `App.tsx`에 `QueryClientProvider` 등록, 경영기획(2계층) 대시보드 훅(`features/planning/hooks/usePlanningQueries.ts`)에서 폴링·윈도우 포커스 리페치에 사용
- **UI 상태**: React 기본 `useState`/`Context` — 별도 상태관리 라이브러리 미도입
- **스타일**: CSS Modules (`*.module.css`), 디자인 토큰은 `src/styles/tokens.css`로 전역 관리
- **차트**: Recharts
- **e2e 테스트**: Playwright

## 폴더 구조

```
src/
  api/                  # 백엔드 연동 — 실 fetch 구현(응답 타입 api/types.ts). VITE_API_BASE_URL 미설정 시 mock 폴백
  app/                  # 최상위 라우트 정의(routes.tsx) + 로그인 가드
  assets/               # 정적 리소스
  components/
    layout/             # 공통 레이아웃: Header, Footer, SideNav, Breadcrumb, SkipLink
    ui/                 # 공통 UI 요소: ConfidenceBadge, RiskGradeBadge
    widgets/            # 화면 공유 위젯: GlobalRiskBoard(글로벌 리스크 맵) 등
  features/             # 화면 단위 경계 — 폴더별로 독립적으로 작업 가능
    admin/                # 관리자 — 회원가입 승인 관리
    auth/                 # 로그인/회원가입/승인대기 락 화면
    executive/            # 3계층 경영진 대시보드
    planning/             # 2계층 경영기획팀 대시보드
    public/               # 비로그인 공개 대시보드
    purchasing/           # 1계층 구매팀 대시보드
  lib/                  # 공용 유틸(risk_event_id 파싱 등), 인증 상태(Context)
  styles/               # 디자인 토큰(tokens.css) 등 전역 스타일
e2e/                    # Playwright e2e 테스트
docs/                   # 기획·요구사항·스키마·로드맵·타임라인 문서
docs-ref/               # Figma, 서비스 플로우, UI 데모 이미지 등 참고 자료(미확정)
.github/workflows/      # CI(GitHub Actions)
```

각 `features/{screen}`은 화면 단위 경계로 설계되어, 여러 사람이 동시에 작업해도 서로 다른 폴더만 건드리면 충돌이 없습니다. `components/`(공통 UI)와 `api/`(백엔드 연동)는 여러 화면이 공유하므로 수정 시 영향 범위를 먼저 확인해야 합니다.

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 — mock 모드 (기본 http://localhost:5173, 백엔드 없이 목업 데이터)
npm run dev

# 개발 서버 — 실 백엔드 연결 (실제 결과 확인용; 백엔드가 localhost:8080에 떠 있어야 함)
npm run dev:live

# 타입 체크
npm run typecheck

# 린트
npm run lint

# 프로덕션 빌드 (dist/ 생성)
npm run build

# 빌드 결과 미리보기
npm run preview

# e2e 테스트 (Playwright) — 먼저 build로 dist/를 만든 뒤 실행 (vite preview로 서빙)
npm run build
npm run test:e2e
```

> ⚠️ **`npm run dev`는 mock 모드입니다** — 백엔드 없이 목업 데이터가 떠서 **실제 데이터·동작을 확인할 수 없습니다.** 제대로 된 결과를 보려면 **백엔드를 먼저 띄운 뒤 `npm run dev:live`로 실행**하세요.

- `npm run dev` — mock 모드(기본). `.env` 없이도 동작하며 목업 데이터 + 의도적 로딩 지연을 씁니다.
- `npm run dev:live` — 실 백엔드 연결 모드(`vite --mode live` → `.env.live`의 `VITE_API_BASE_URL=http://localhost:8080`). Spring 백엔드가 8080에 떠 있어야 합니다.

```bash
# 실제 결과 확인 (권장) — 백엔드 기동 후 실행
npm run dev:live

# mock 단독 모드(기본) — 백엔드 없이 목업 + 로딩 지연
npm run dev

# mock 로딩 지연만 끄기
VITE_MOCK_DELAY_MS=0 npm run dev
```

## 화면 / 라우트 목록

| 경로 | 설명 | 접근 조건 |
|---|---|---|
| `/` | 비로그인 공개 대시보드(Seq 23) — 글로벌 리스크 관제 맵 / AI 기반 권고 조치 리스트 / 원자재 가격 추이 / 실시간 뉴스 속보 | 누구나 |
| `/auth` | 로그인 / 회원가입(스플릿스크린 + 탭 토글). 승인 대기 상태(PENDING)면 같은 화면 안에서 보안 락 화면으로 전환 | 누구나 |
| `/purchasing` | 1계층 구매팀 대시보드(Seq 24, MVP) | 로그인 필요 |
| `/planning` | 2계층 경영기획팀 대시보드 | 로그인 필요 |
| `/executive` | 3계층 경영진 대시보드 | 로그인 필요 |

각 계층 대시보드는 세부 하위 라우트를 가집니다(예: 경영기획팀의 자재 위험·수입 의존도·공급사·계약·AI 브리핑·데이터 품질 탭). 정확한 경로 정의는 `app/routes.tsx`가 기준입니다.

"로그인 필요" 라우트는 `app/routes.tsx`의 `RequireAuth`가 지키고 있으나, 이는 메모리 상의 인증 상태(`orgTier`) 유무만 확인하는 **클라이언트 UX 수준 가드**입니다. 새로고침하면 상태가 사라지고, 실제 보안 경계(토큰 검증)는 백엔드가 담당합니다. 현재는 계층 간 접근 제한도 하지 않습니다(예: 구매팀으로 로그인해도 `/planning` 접근 가능).

## 참고 문서

| 문서 | 내용 |
|---|---|
| [docs/product-overview.md](docs/product-overview.md) | 프로젝트 개요, 목표 고객, 핵심 원칙, MVP 범위 |
| [docs/architecture.md](docs/architecture.md) | 시스템 아키텍처 (⚠️ 일부 미확정 — 문서 내 명시) |
| [docs/requirements-frontend.md](docs/requirements-frontend.md) | 화면별 요구사항(Seq ID 매핑) |
| [docs/mock-schemas.md](docs/mock-schemas.md) | API mock 스키마(잠정 계약 — 아래 "API 명세" 참고) |
| [docs/backend-api-contracts.md](docs/backend-api-contracts.md) | 실 백엔드와 검증 완료된 확정 API 계약(2026-07-27 신설) |
| [docs/design-tokens.md](docs/design-tokens.md) | 색상·타이포·spacing 디자인 토큰과 근거 |
| [docs/roadmap.md](docs/roadmap.md) | 개발 로드맵(Phase 계획) |
| [docs/frontend-demo-guide.md](docs/frontend-demo-guide.md) | mock 단독(①단계) 전체 화면 시연 절차(2026-07-27 신설) |
| [docs/timeline.md](docs/timeline.md) | 실제 개발 이력(Phase별 진행 기록, append-only) |

## API 명세

프론트엔드는 **실 백엔드(Spring, `/api/v1`)와 연동 완료** 상태입니다. `src/api/*.api.ts`가 실제 fetch를 호출하고, 응답 타입은 `src/api/types.ts`에 정의돼 있습니다. `VITE_API_BASE_URL`이 설정되면 실 백엔드로, 미설정이면 **mock 폴백**으로 동작합니다(단독 데모·스켈레톤 검증용). 확정된 계약은 [docs/backend-api-contracts.md](docs/backend-api-contracts.md), 초기 잠정 스키마는 [docs/mock-schemas.md](docs/mock-schemas.md)를 참고하세요.

현재 프론트엔드는 세 가지 실행 단계를 구분합니다:
1. **프론트엔드 단독** — mock 데이터 + 의도적 로딩 지연(스켈레톤 UI 검증·단독 시연용).
   이 지연은 임시 디버그 코드가 아니라 이 모드의 정식 기능이며, 이 단계를 쓰는 한 계속 유지됩니다.
2. **서비스 테스트** — 실제 백엔드 연결(QA 목적, 일시적). 지연 로직은 비활성화됩니다.
3. **실제 배포** — 실제 백엔드. mock 데이터·테스트 계정·의도적 로딩 지연 로직 전부 제거됩니다.

단계 전환 방법은 아래 "실행 방법"을 참고하세요.

mock 단독(①단계)으로 전체 화면을 순서대로 시연하는 절차는 [docs/frontend-demo-guide.md](docs/frontend-demo-guide.md) 참고. 백엔드를 실제로 연결해 시연/테스트하는 방법(②단계)은 [docs/backend-integration-guide.md](docs/backend-integration-guide.md) 참고 — 둘은 서로 다른 절차라 문서가 분리돼 있습니다.

## ERD

데이터베이스 설계(ERD)는 이 레포(프론트엔드) 범위 밖이며, 백엔드 레포에서 관리합니다.
