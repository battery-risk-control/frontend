# 개발 로드맵

> 이 문서는 전체 그림 참고용이다. **각 작업 요청은 해당 시점의 Phase 범위로만 한정한다** — 뒤 Phase를 미리 구현하지 않는다. 명시적으로 다음 Phase를 요청받기 전까지는 그 범위를 건드리지 않는다.

- [x] Phase 1 — 프로젝트 스캐폴딩 (Vite+React19+TS, 폴더 구조, 의존성, tokens.css, 폰트)
- [x] Phase 2 — 육안 검증 (배경색·폰트 렌더링 확인)
- [x] Phase 3 — 공통 컴포넌트: `components/layout/*`(Header, Footer, SideNav, Breadcrumb, SkipLink), `components/ui/*`(ConfidenceBadge, RiskGradeBadge)
- [x] Phase 4 — 1계층 구매팀 대시보드 (MVP): `api/purchasing.api.ts` mock, KpiSummaryPanel/MaterialRiskStatusPanel/ErpImpactPanel/PurchasePriorityPanel/AlertsPanel
- [x] Phase 5 — 인증 플로우: 로그인/회원가입(스플릿스크린+탭 토글) + 승인대기 락 화면
- [x] Phase 5.5 — 라우팅 연결: react-router-dom 실제 연결, `/`(비로그인 공개 대시보드 자리, 아직 미구현), `/auth`, `/purchasing` 라우트 분리. App.tsx의 임시 단일 렌더링 제거
- [x] Phase 5.6 — 비로그인 공개 대시보드 (Seq 23): `features/public/` — 글로벌 리스크 관제 맵 / AI 기반 권고 조치 리스트 / 원자재 가격 추이 / 실시간 뉴스 속보 (2x2, 상단 탭+로그인 버튼). `/` 라우트를 여기로 연결하고 `/auth` 강제 리다이렉트 제거
- [x] Phase 6 — 2계층·3계층 대시보드
- [ ] Phase 6.5 — 페이지 간 내비게이션 + 최소 접근 제어: 공개 대시보드 상단 탭은 미로그인 시 /auth로 유도, 로그인 시 해당 계층 화면 접근 가능. 테스트 계정 3종(mock, 배포 전 삭제 대상으로 명시). 인증/각 대시보드에서 홈으로 돌아가는 경로 추가
- [ ] Phase 7 — git remote 연결 및 첫 커밋

## 재사용 규칙 (Phase 3에서 결정되는 인터페이스는 이후 Phase가 그대로 따른다)
- `ConfidenceBadge`/`RiskGradeBadge`의 props 타입은 이후 모든 화면에서 동일하게 재사용한다 — 화면별로 별도 배지를 새로 만들지 않는다.
- `Header`/`Footer`/`SideNav`는 `components/layout/`에서 한 번만 구현하고, `features/*`는 이를 import해서 쓰기만 한다.