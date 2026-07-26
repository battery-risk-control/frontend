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
- [x] Phase 6.5 — 페이지 간 내비게이션 + 최소 접근 제어: 공개 대시보드 상단 탭은 미로그인 시 /auth로 유도, 로그인 시 해당 계층 화면 접근 가능. 테스트 계정 3종(mock, 배포 전 삭제 대상으로 명시). 인증/각 대시보드에서 홈으로 돌아가는 경로 추가 (Phase 8.5에서 계층 불일치 시 무음 리다이렉트 대신 확인 모달 "내 화면으로 이동/취소"로 변경됨)
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
  - 9.3 원자재 가격 추이 / 2·3계층 차트: surin 차트 스타일 이식
  - [x] 9.4 구매팀 대시보드 UX-01-DB 데모 구조 반영 + ScrollCard 통일 + SideNav 접기: 5칸 리스크 게이지 그리드(`MaterialRiskOverviewRow`, surin `RiskStepGauge` 이식) → 지도(승격된 `GlobalRiskBoard` 재사용) → 도넛+가격추이 2단(`ImportDependencyRow`, surin `DonutChart` 이식) 요약 영역 신설, 기존 4개 패널 전체를 `ScrollCard`로 전환, `GlobalRiskBoard`/`MaterialPriceDetail`을 `components/widgets/`로 승격(공개 대시보드와 구매팀 대시보드가 공유), `SideNav` 접기/펼치기(Context 전역 상태) 추가
  - [ ] 9.5(후보) — 리스크 유형별 분포 차트: **미착수**. product-overview.md MVP 필수 항목이나 Seq 번호 없음, `risk_event` 스키마에 "유형" 관련 필드 자체가 없어 신규 필드 설계 선행 필요. 카테고리 출처·배치 화면 등 미결 사항은 `docs/roadmap-candidates.md` "C1" 참고
  - [ ] 9.6(후보) — ERP 영향 분석 화면 신설: **미착수**. surin `pages/ErpImpact.tsx`(`/erp-impact`)·데모 이미지에는 있으나 `docs/requirements-frontend.md`에 대응 Seq 항목이 없고 우리 레포엔 미구현. 상세는 `docs/roadmap-candidates.md` "C2" 참고

- [ ] Phase 10(후보) — 전체 앱 반응형 대응 — 이미 합의된 사항, 아직 착수 전. 공개 대시보드(Seq 23)에 760px 미만 브레이크포인트(2x2 → 1열 4행) + 하단 콘텐츠 힌트(ScrollHint)를 실험적으로 먼저 도입(2026-07-23)했으나, 구매팀/기획팀/경영진 대시보드를 포함한 전체 화면의 반응형 대응은 이 Phase에서 별도로 다룬다. **(2026-07-26 갱신)** ScrollHint는 이후 컷오프 기법(그리드 행 auto 크기 + `.page` 자체 스크롤)으로 대체됐다 — 상세는 `docs/design-candidates.md` "공개 대시보드 좁은 화면 콘텐츠 신호" 참고.
  - [ ] 10.9(후보) — SideNav 실기능 연결: **미착수**. `SIDE_NAV_ITEMS`가 Phase 4부터 `href="#..."` 순수 placeholder였고(원 목적: React key 중복 경고 회피), Phase 8에서 "실제 라우트로 교체"했다는 기록과 달리 실제로는 여전히 미기능 상태임을 Playwright 6개 시나리오로 실측 확인(2026-07-24). 앵커 스크롤/신규 페이지 분리/surin `Briefing.tsx` 이식 등 착수 방향 전부 미결정. 상세는 `docs/roadmap-candidates.md` "C3" 참고

## 재사용 규칙 (Phase 3에서 결정되는 인터페이스는 이후 Phase가 그대로 따른다)
- `ConfidenceBadge`/`RiskGradeBadge`의 props 타입은 이후 모든 화면에서 동일하게 재사용한다 — 화면별로 별도 배지를 새로 만들지 않는다.
- `Header`/`Footer`/`SideNav`는 `components/layout/`에서 한 번만 구현하고, `features/*`는 이를 import해서 쓰기만 한다.