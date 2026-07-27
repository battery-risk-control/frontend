# 로드맵 후보 — 갭/버그/미결정 설계 이슈

이 문서는 "아직 만들지 않은 기능/화면 갭" 또는 "발견된 버그·미결정 설계 이슈"를 기록한다.
`docs/design-candidates.md`와는 다르다 — 그쪽은 "고려했으나 채택하지 않은 디자인 대안"만 다룬다.

## C1 — 리스크 유형별 분포 차트 (별도 Phase, 착수 전, 2026-07-24)

product-overview.md "MVP 범위"에 "유형별 분포 차트"가 필수 항목으로 명시돼 있으나(Seq
번호 없음 — `요구사항_정의서.xlsx`/`docs/requirements-frontend.md` 쪽에는 이 항목 자체가
없음, 별도 출처인 "프로젝트_기획_정의서 v2"에만 등장), 착수 전 확인이 필요한 미결 사항을
기록해 둔다. 아직 구현 착수하지 않았다.

- **스키마 공백**: `risk_event`(CLAUDE.md 원본 스키마) 최상위 8개 필드 및 `market_context`
  하위 필드를 전수 확인한 결과 "유형"/"category"/"event_type"/"issue" 계열 필드가 전혀 없다
  (`src/api/types.ts`의 `RiskEvent`도 CLAUDE.md 스키마와 정확히 일치, 동일하게 없음). "리스크
  유형" 개념 자체가 mock 데이터에 아직 존재하지 않으므로, 착수 시 신규 필드 설계가 선행돼야
  한다.
- **카테고리 출처 후보 2가지(확정 아님)**:
  - (a) GDELT 이벤트유형 기반 — 기획정의서에 "예: 수출제한/광산사고/관세/재고소진"이 언급되나
    이는 예시일 뿐 확정된 값 목록이 아니다.
  - (b) 데모 이미지의 "주요 리스크 드라이버" 고정 4종(수출규제/광산차질/정책변화/물류지연) —
    단, 이 요소는 데모상 대시보드(1, `UX-01-DB`) 화면이 아니라 **"외부 리스크 모니터링"
    (2, `UX-02-RM`) 화면 소속**이다. 우리 레포의 `PurchasingDashboardPage`(1계층 구매팀
    대시보드)와 화면 성격이 다를 수 있음에 유의.
- **배치 화면 미결**: 현재 작업 중인 `PurchasingDashboardPage`에 넣을지, 아니면 데모처럼
  별도 화면(외부 리스크 모니터링에 해당하는 신규 페이지/라우트, 현재 레포엔 존재하지 않음)을
  신설해야 할지 확인이 필요하다.

## C2 — "ERP 영향 분석" 화면 부재 (별도 Phase, 착수 전, 2026-07-24)

surin에는 `pages/ErpImpact.tsx`(`/erp-impact` 라우트, 네비 라벨 "ERP 영향 분석")로 존재하고
데모 이미지(`ChatGPT Image 2026년 7월 9일 오전 10_50_58 (3).png`)에도 등장하는 화면이지만,
`docs/requirements-frontend.md`(Seq 1~36 체계)에는 이 화면에 대응하는 Seq 항목이 없고
우리 레포에도 구현이 없다. 착수 전 확인이 필요한 갭만 기록해 둔다. 아직 구현 착수하지 않았다.

- 이 화면의 "자재 영향도 분포" 도넛(영향도 점수 구간 높음 80~100=14건/주의 50~79=20건/
  보통 20~49=10건/낮음 0~19=4건)은 **C1(리스크 유형별 분포 차트)과는 다른 축**이다 — C1은
  "리스크 유형"(아직 스키마에 없는 개념) 기준 분포, 이건 "ERP 영향도 점수 구간" 기준 분포다.
  따라서 C1 해결책(리스크 유형별 분포 차트 구현)으로 이 화면의 부재를 대신 해소할 수 없다.
- 착수 여부·우선순위는 미결정 상태로 남긴다.

## C3 — SideNav 내비게이션 항목 미기능(placeholder) 및 개념 불일치 (미결정, 2026-07-24)

`SideNav`(Purchasing/BriefingDetail/Planning 3개 페이지)의 하위 항목이 실제로는 기능하지
않는 placeholder라는 사실과, 이를 둘러싼 여러 미결정 설계 이슈를 기록한다.

- **원래부터 placeholder였음**: `SIDE_NAV_ITEMS`(Purchasing/BriefingDetail:
  "리스크 현황판"/"브리핑 자료", Planning: "노출도 비교"/"협력사 이력")는 Phase 4부터
  `href="#..."` 형태의 순수 placeholder였다. `docs/timeline.md` Phase 4 기록 원문:
  > **버그**: `SideNav` 두 항목이 동일한 `href="#"`를 사용해 React key 중복 경고 발생 →
  > 항목별 고유 해시(`#risk-board`, `#briefing`)로 수정.

  즉 원래 목적이 "React key 중복 경고 회피"였을 뿐, 기능적 내비게이션을 의도한 것이 아니었다.

- **Playwright 6개 시나리오 실측 확인 결과**(2026-07-24):
  1. Purchasing 대시보드에서 "리스크 현황판" 클릭 → URL만 `/purchasing`→`/purchasing#risk-board`로 변경, `<h1>`은 "구매팀 대시보드"로 불변.
  2. Purchasing 대시보드에서 "브리핑 자료" 클릭 → URL만 `/purchasing#briefing`으로 변경, `<h1>` 불변.
  3. BriefingDetailPage(`/purchasing/briefing/RISK-2026-0721-001`, `<h1>`="니켈 브리핑 자료")에서 "리스크 현황판" 클릭 → `/purchasing#risk-board`로 실제 이동(pathname이 달라 라우트 전환 발생), `<h1>`이 "구매팀 대시보드"로 바뀜.
  4. 같은 페이지에서 "브리핑 자료" 클릭 → 위와 동일하게 `/purchasing#briefing`으로 이동, `<h1>`도 동일하게 "구매팀 대시보드" — **"리스크 현황판"과 결과가 구분되지 않음**.
  5. Planning 대시보드에서 "노출도 비교" 클릭 → URL만 `/planning#exposure`로 변경, `<h1>`="경영기획팀 대시보드" 불변.
  6. Planning 대시보드에서 "협력사 이력" 클릭 → URL만 `/planning#vendor-history`로 변경, `<h1>` 불변.

  `src` 전체에서 `id="risk-board"`/`id="briefing"`/`id="exposure"`/`id="vendor-history"` grep도
  0건 — 스크롤 대상 앵커 요소 자체가 없다.

- **문서-코드 drift**: `docs/roadmap.md`(Phase 8)과 `docs/timeline.md`(Phase 8)는 모두
  "SideNav 플레이스홀더 해시(`#briefing` 등)를 실제 라우트로 교체(연결)"라고 기록하고 있으나,
  실제 코드(`git blame` 커밋 `5c623308`)는 href에 `/purchasing` 경로 접두사를 붙였을 뿐 여전히
  해시 기반 placeholder다 — "실제 라우트로 교체"라는 문서 서술은 실제로 달성된 것보다 앞서 나간
  표현이다.

- **surin과의 개념 불일치 발견**: surin의 "브리핑 & 의사결정 지원"(`/briefing`,
  `Briefing.tsx`)은 특정 리스크 이벤트에 종속되지 않는 **이벤트 비종속 종합 브리핑**
  (Executive Summary, 주요 리스크 Top 3, 권장 대응 조치, 시나리오 비교, 문서 미리보기 등 —
  당일 전체 현황을 AI가 요약)인 반면, 우리 `BriefingDetailPage`는 `riskEventId`가 **필수 파라미터인
  개별 이벤트 브리핑**(특정 `risk_event`의 `rag_view`/`output_artifacts`만 추출)이다. 이름은
  비슷해 보이지만 서로 다른 개념의 화면이다.
- **"리스크 현황판" 관련 미결정**: surin에는 "리스크 현황판"에 정확히 대응하는 별도 화면이
  없다(가장 가까운 것은 `Dashboard.tsx` 자체이거나 `RiskMonitoring.tsx`인데 둘 다 이름이 다름).
  `docs/requirements-frontend.md` Seq 24 원문("협력사별 리스크 등급·근거 정리 현황판(**상세**)")의
  "(상세)"라는 단어가 정확히 무엇을 가리키는지도 불명확하다 — 현재 `PurchasingDashboardPage`
  자체를 "(상세)"로 보는지, 아니면 그보다 더 깊은 별도의 상세 화면을 의미하는지 확인되지 않았다.
- **착수 방향 미결정**: 다음 세 방향 모두 검토되지 않은 상태로 남겨둔다 —
  (1) 앵커 스크롤 구현(대상 섹션에 실제 `id` 부여 + 클릭 시 스크롤),
  (2) 신규 페이지 분리(현재 `PurchasingDashboardPage`의 특정 섹션을 별도 라우트로 분리),
  (3) surin `Briefing.tsx` 이식(종합 브리핑 개념 자체를 새로 도입).
  세 방향의 장단점 비교, 우선순위, `BriefingDetailPage`와의 관계 정리 모두 미결정.

## C4 — 2·3계층 차트 surin 스타일 이식 (Phase 9.3 잔여분, 착수 전, 2026-07-25)

Phase 9.3 "원자재 가격 추이 / 2·3계층 차트: surin 차트 스타일 이식" 중 "원자재 가격 추이"는
완료됐으나(design-candidates.md 참고), "2·3계층 차트" 부분은 git log 확인 결과 Phase 6/8
이후 Planning/Executive 차트 컴포넌트에 수정 이력이 없어 미착수임을 2026-07-25 timeline.md
정리 작업 중 발견했다. 착수 전 확인 필요 사항만 기록해 둔다.

- 대상: PlanningDashboardPage의 ComparisonChart, ExecutiveDashboardPage의
  SavingsSimulation/EnterpriseRiskSummary 등 Recharts 기반 차트 컴포넌트.
- surin 원본 대응 화면/컴포넌트를 먼저 특정해야 한다(CLAUDE.md 원칙 —
  "surin을 참고 자료로 사용할 때는 어느 파일/어느 화면인지 먼저 특정").
- 아직 착수하지 않았다.

## C5 — 토큰 저장 방식 재검토 후보 (미착수, 2026-07-25)

현재 메모리 전용 유지 결정(Phase 8 로그아웃 경쟁상태 수정 이력과 연동). 추후 "새로고침해도
로그인 유지" 요구가 실제로 생기면, localStorage 전환 시 Phase 8의 하드 리다이렉트 로직을
다시 검토해야 한다는 점을 미리 남겨둠.

## C6 — e2e 프리뷰 포트(4173) CORS 미허용 (백엔드 팀 확인 필요, 2026-07-25)

Playwright e2e는 vite preview(4173)를 대상으로 실행되는데, 백엔드 CORS_ALLOWED_ORIGINS
기본값(5173, 3000)에 4173이 없어 실 백엔드 대상 e2e 실행 시 17/24 테스트가 CORS로
실패했다(FE 에러 처리 자체는 정상 동작 확인됨 — Failed to fetch를 의도대로 처리). 로컬에서는
CORS 목록에 4173을 임시 추가해 우회 확인(22/24 통과, 나머지 2개는 mock 전용
pending@company.com 계정이 실 DB에 없어 발생하는 예상된 실패).

CI 등에서 실 백엔드 대상 e2e를 정기적으로 돌리려면, 백엔드 CORS_ALLOWED_ORIGINS에 4173을
정식으로 추가해야 한다 — 백엔드팀(minji) 확인 필요.

## C7 — 도트 인디케이터 최하단 섹션 사각지대 (해소, 2026-07-27)

PageSectionDots의 rootMargin 보정(36d0fa6) 이후에도 마지막 섹션(`구매 대응 우선순위`) 도트가
문서 맨 끝까지 스크롤해도 전혀 활성화되지 않는 문제가 있었음. Playwright 재현(1400px 뷰포트)으로
정확한 원인을 특정: 마지막 heading이 "뷰포트 상단 40%" 판정 구간(rootMargin `-60%`)에 들어오려면
`scrollY ≥ 2088.98px`가 필요한데, 문서의 실제 최대 스크롤(`scrollHeight - clientHeight`)은
`1976px`뿐이라 약 113px가 구조적으로 부족했음 — 마지막 섹션 아래에 더 스크롤할 콘텐츠가 없어
rootMargin 조건을 만족할 스크롤 위치 자체가 존재하지 않는 경우.

**해소 방식**: rootMargin 예외값 대신, "문서 하단 도달" 자체를 별도 감지(`scroll`/`resize`
리스너로 `window.scrollY + window.innerHeight >= scrollHeight - 2px`)해 근접 시 마지막 섹션
id를 강제로 active에 포함시키는 방식(사용자 확정안 (b))으로 구현. rootMargin 계산에 의존하지
않는 절대 조건이라 콘텐츠/뷰포트 크기가 달라져도 구조적으로 성립. Playwright로 (1) 문서 최대
스크롤 지점에서 마지막 도트 active, (2) 그 지점에서 500px 위로 이동하면 강제 active 해제, (3)
기존 도트 클릭 이동 회귀 없음을 확인. 상세는 `docs/timeline.md` 참고.

## C8 — 도트 인디케이터 섹션 전환 구간 통상적 사각지대 2곳 (미착수, 2026-07-27)

C7 재현 조사 중 함께 발견됐으나 C7(마지막 섹션 전용 구조적 문제)과는 원인이 다른, 별개의
사각지대. 1400px 뷰포트 기준 `y=1020~1080`(원자재 가격 추이 종료~원자재 공급사 리스크 현황
시작 사이), `y=1500~1620`(원자재 공급사 리스크 현황 종료~ERP 영향 시작 사이) 구간에서 활성
도트가 0개가 됨 — 짧은 섹션들 사이 전환 중 발생하는 통상적 스크롤스파이 아티팩트로 추정.
C7 해소 작업 범위에서는 의도적으로 손대지 않았다. 착수 여부·해결 방식(rootMargin 값 자체
조정, 섹션 간 최소 간격 확보 등) 모두 미결정.
