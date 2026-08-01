# 백엔드 API 확정 계약

이 문서는 **실 백엔드와 검증 완료된 확정 계약만** 다룬다. `docs/mock-schemas.md`(제안
단계, 계속 변경 가능)와는 다르다 — 어떤 API가 여기 있다는 것은 코드(백엔드 컨트롤러/DTO
직접 확인) 또는 실측(curl/Playwright/e2e)으로 프론트엔드와 실제로 맞물려 동작함을
확인했다는 뜻이다. 새로운 API가 실측 확정될 때마다 이 문서에 추가한다.

응답은 전부 Spring 공통 봉투(`{success: true, data: {...}, timestamp}` 성공 /
`{success: false, error: {code, message, details}, timestamp}` 실패)로 감싸여 오며,
`src/api/http.ts`의 `fetchJson`이 이 봉투를 벗겨 아래 스키마(= `data`의 내용, 실패 시
`{error: code, message}`)를 프론트엔드에 그대로 넘긴다. 아래 예시는 전부 **봉투를 벗긴
이후** 모양이다 — curl로 직접 호출하면 한 단계 더 감싸여 있다.

## 1. 인증

`backend` 레포 `spring-backend/.../controller/AuthController.java` 기준, 2026-07-27
실 백엔드 연동 시연(로그인/틀린 비밀번호/회원가입 PENDING/PENDING 로그인 락 화면 4개
시나리오)과 Playwright e2e 24/24(`e2e/auth-login.spec.ts`/`pending-approval.spec.ts`)로
실측 검증됨.

**회원가입** `POST /api/v1/auth/signup`
```json
{
  "name": "홍길동",
  "email": "user@company.com",
  "password": "********",
  "org_tier": "purchasing",   // purchasing | planning | executive
  "org_name": "OO배터리"
}
```
응답:
```json
{ "user_id": "USR-0001", "status": "PENDING", "org_tier": "purchasing" }
```

- `name`(임직원 성명)은 Figma 회원가입 와이어프레임에 입력 필드로 존재해 확장 원칙에
  따라 추가된 필드.
- `org_name`은 반대로 Figma 와이어프레임에는 입력 필드가 없다. 소속 회사 선택 UI가
  추가되기 전까지 FE는 고정값(`OO배터리`)을 채워 보낸다.
- **정정(2026-07-27, mock-schemas.md에서 이동하며 발견)**: 원래 mock 제안 스키마는
  응답에 `message` 필드가 있는 것으로 돼 있었으나, 실제 백엔드 응답에는 `message`가
  없고 대신 `org_tier`가 내려온다 — FE(`src/api/auth.api.ts`의 `SIGNUP_PENDING_MESSAGE`)
  가 승인 대기 안내 문구를 직접 합성해서 쓴다. URL도 `/api/auth/signup`이 아니라
  `/api/v1/auth/signup`(버전 접두사)이 맞다.
- 이메일 중복 등 실패 시(`DUPLICATE_USERNAME` 등) `{error: "DUPLICATE_USERNAME", message: "..."}`
  형태로 오고, FE는 이를 `throw`해 `AuthPage`가 `authError`로 표시한다(mock에는 없던
  실패 케이스라 `SignupResponse` 타입에 슬롯이 없음 — 코드 확인).

**로그인** `POST /api/v1/auth/login`
```json
{ "email": "user@company.com", "password": "********" }
```
성공 응답:
```json
{ "access_token": "실제 JWT", "org_tier": "purchasing", "status": "APPROVED" }
```
승인 대기 중 로그인 시도:
```json
{ "error": "PENDING_APPROVAL", "message": "관리자 승인 대기 중입니다." }
```
→ FE는 이 응답을 받으면 Seq 35의 보안 락 화면으로 라우팅한다.

비밀번호 불일치 등 그 외 실패 시(`INVALID_CREDENTIALS` 등) `{error: "...", message: "..."}`
형태로 오고, FE는 이를 `throw`해 `AuthPage`가 `authError`로 표시한다(마찬가지로 mock에는
없던 실패 케이스).

**테스트 계정**: `AUTH_TEST_SEED_ENABLED=true`(백엔드 환경변수, 기본 `false` — 운영
비활성)일 때 `purchasing`/`planning`/`executive@test.local`(비번 `test1234!`, APPROVED)과
`pending@company.com`(비번 `anything`, PENDING) 4개 계정이 실 DB에 자동 시드된다.
로컬에서 실 백엔드 대상으로 시연/e2e를 돌릴 때 필요 — 상세 절차는
`docs/backend-integration-guide.md` 참고.

## 2. 비로그인 공개 대시보드 — 글로벌 리스크 관제 지도

`backend` 레포 `spring-backend/.../controller/PublicController.java`,
`dto/RiskEventDto.java`(`RiskBoardItem`), `service/RiskEventService.java`(`b8d44b9`) 코드
직접 확인 + curl + Playwright(`dev:live` 대상 마커 4개 렌더링 실측)로 검증됨(2026-07-27).

`GET /api/v1/public/risk-board` (`SecurityConfig`에서 `permitAll` — 토큰 불필요)
```json
[
  {
    "risk_event_id": "RISK-2026-0721-001",
    "material": "니켈",
    "grade": "심각",
    "confidence_label": "확정",
    "event_summary": "인도네시아 니켈 수출 관세 인상 발표로 현물가 18% 급등",
    "country_code": "ID",
    "country_name": "인도네시아",
    "coordinates": { "lat": -6.2088, "lng": 106.8456 }
  }
]
```

- CLAUDE.md `risk_event` 스키마 전체가 아니라, **공개용으로 의도적으로 축약된 별도 구조**
  (`RiskBoardItem`)다 — `erp_view`/`quality_check`/`rag_view`는 백엔드가 명시적으로 제외한다
  (컨트롤러 주석: "ERP 내부 상세를 제외한 공개 안전 subset").
- `api/types.ts`의 `GlobalRiskBoardItem`과 **필드가 1:1로 정확히 일치**한다(백엔드 DTO
  주석에도 "프론트 GlobalRiskBoardItem 계약과 1:1"로 명시) — 변환 로직 없이 응답 배열을
  그대로 `GlobalRiskBoardItem[]`로 쓸 수 있다.
- **데이터 내용은 아직 placeholder다** — 백엔드 컨트롤러 주석: "데이터 내용은 F3/F4
  모델·뉴스 파이프라인 배선 전까지 결정론적 placeholder다(리스크 이벤트 원본과 동일)."
  응답에 이를 나타내는 별도 플래그 필드는 없다(경영진 대시보드의 `savings_simulation.
  is_simulation`과 다름) — FE도 별도 placeholder 표시 UI를 추가하지 않는다(공개
  대시보드의 다른 3개 패널도 mock 기반이나 표시가 없는 기존 관례와 일관 유지).
- FE 연동: `src/api/public.api.ts`의 `fetchPublicRiskBoard()`가 `VITE_API_BASE_URL` 설정
  시 이 엔드포인트를, 미설정 시(①단계) `purchasing.api.ts`의 `fetchGlobalRiskBoard()`(mock)
  를 그대로 반환한다. 구매팀 대시보드가 쓰는 `fetchGlobalRiskBoard()`는 이 계약과 무관하게
  mock 그대로 유지된다(의도된 분리).

## 3. 1계층 구매팀 대시보드 — 구매 리스크 KPI 요약 (멀티에이전트)

`backend` 레포 `spring-backend/.../controller/DashboardController.java`,
`dto/DashboardDto.java`(`ProcurementRiskSummary`),
`repository/DashboardRepository.java`(`loadProcurementRiskSummary`) 코드 직접 작성 +
`C:\backend-review` Docker(`docker compose up -d --build spring`)로 실제 curl 검증됨
(2026-08-01).

`GET /api/v1/dashboard/procurement-risk-summary` (인증 필요 — `/api/v1/**`가 `SecurityConfig`
기본 규칙상 `authenticated()`, `Authorization: Bearer {access_token}` 필요)
```json
{
  "assessed_category_count": 8,
  "critical_count": 3,
  "warning_count": 5,
  "normal_count": 0,
  "erp_exposure_score_avg": 75.0,
  "external_signal_score_avg": 60.0,
  "verified_briefing_count": 8,
  "critical_count_24h": 1,
  "warning_count_24h": 2,
  "erp_exposure_score_avg_24h": 68.0,
  "external_signal_score_avg_24h": 72.0,
  "latest_assessed_at": "2026-08-01T06:42:50.634310Z",
  "mock": true
}
```

- **`*_24h` 4개 필드(2026-08-01 신규)**는 위 스냅샷 필드(`critical_count`/`warning_count`/
  `erp_exposure_score_avg`/`external_signal_score_avg`)와 **완전히 다른 모집단**이다 —
  카테고리로 접지 않은 `procurement_risk_assessments` 원본 행 중 `created_at`이 최근
  24시간 이내인 것만 집계한다("오늘 무슨 일이 있었나"). 미해소 리스크가 24시간이 지나도
  스냅샷 필드에서 사라지면 안 된다는 요구사항 때문에 두 모집단을 절대 섞지 않는다 — FE도
  이 둘을 같은 숫자로 취급하거나 대체 관계로 표시하면 안 되고, 보조 텍스트로만 병기한다
  (`KpiSummaryPanel` 참고).
- `*_24h` 필드는 `C:\backend-review` Docker 실측 완료(2026-08-01) — 실측 중 실제 버그
  1건 발견·수정: Spring 전역 SNAKE_CASE 전략이 문자→숫자 경계(`...Count|24h`)엔 언더스코어를
  안 넣어 `critical_count24h`로 잘못 직렬화되고 있었다(`critical_count_24h`가 아님) — 4개
  필드 전부 `@JsonProperty`로 명시 강제해 수정, 재빌드 후 정정된 키로 응답 확인.

- 멀티에이전트(Chain B, LangGraph)가 `procurement_risk_assessments`에 append-only로 쌓아온
  구매 리스크 평가를, 자재 대분류(8종: LITHIUM/COBALT/NICKEL/GRAPHITE/MANGANESE/COPPER/
  ALUMINUM/RARE_EARTH) 단위로 최신 1건만 남겨(`material_category`, `created_at DESC` 기준)
  집계한 응답이다. `Summary`(`GET /api/v1/dashboard/summary`)가 `severity_assessments`
  기반인 것과 별개 데이터 소스 — 두 응답을 섞어 쓰지 않는다.
- `critical_count`/`warning_count`/`normal_count`는 `procurement_risk_level` 기준(UNKNOWN
  없음, `Summary`의 4단계와 다름). `erp_exposure_score_avg`/`external_signal_score_avg`는
  해당 필드가 NULL인 행을 자동으로 제외한 평균이라(Postgres `AVG` 기본 동작), 분모가
  `assessed_category_count`보다 작을 수 있다.
- `verified_briefing_count`는 최신 1건 기준 `review_passed = TRUE`인 카테고리 수 — 과거
  이력 전체가 아니라 "현재 상태" 스냅샷이다.
- `mock` 필드는 `Summary`와 동일한 기존 관례를 그대로 승계한 상수 `true`(실제 데이터
  진위 여부를 구분하는 필드가 아님 — `DashboardRepository.loadSummary()`도 동일).
- 실측 시점(2026-08-01) 실제 DB에는 테스트로 채운 COBALT/LITHIUM 2개 카테고리만 있어
  `assessed_category_count`가 2였다 — 위 예시 JSON은 프론트 mock(`getMockProcurementRiskKpi`,
  캡처 데모 수치와 동일)과 나란히 보기 좋도록 8개 카테고리 응답 형태로 제시한 것이다.
- FE 연동: `src/api/purchasing.api.ts`의 `fetchProcurementRiskKpi(accessToken)` —
  `VITE_API_BASE_URL`과 `accessToken`이 모두 있을 때만 이 엔드포인트를, 아니면
  `getMockProcurementRiskKpi()`를 반환한다. `PurchasingDashboardPage`가 로그인 후
  `useAuthState().accessToken`을 넘겨 호출한다.

## 4. 구매 리스크 평가 완료 처리 (acknowledge)

`backend` 레포 `MultiAgentController.acknowledge`/`MultiAgentOrchestrationService.
acknowledgeAssessment`/`ProcurementRiskRepository.acknowledge`/`V20__create_procurement_risk_
acknowledgements.sql` 코드 직접 작성 + `C:\backend-review` Docker(`docker compose up -d
--build spring`)로 실제 curl 검증됨(2026-08-01) — 신규 호출/멱등 재호출/404 3개 시나리오와,
한 카테고리의 이력 전체를 완료 처리하면 `GET /api/v1/dashboard/procurement-risk-summary`에서
실제로 그 카테고리가 빠지는 것(`assessed_category_count`/`warning_count`/
`erp_exposure_score_avg` 변화)까지 확인. **아직 이 엔드포인트를 호출하는 프론트 코드는
없다**(버튼/리스트 UI는 다음 단계로 의도적으로 미룸 — 개별 카테고리 항목을 보여주는 화면
자체가 현재 없어서, 백엔드 API부터 먼저 만든 상태).

`POST /api/v1/multi-agent/assessments/{assessmentId}/acknowledge` (인증 필요)
```json
{
  "assessment_id": "3f9a1c2e-...",
  "acknowledged_by": 1,
  "acknowledged_at": "2026-08-01T12:00:00Z",
  "already_acknowledged": false
}
```

- 대상이 존재하지 않는 `assessmentId`면 404(`PROCUREMENT_RISK_ASSESSMENT_NOT_FOUND`).
- `procurement_risk_assessments`(append-only) 원본 행은 건드리지 않는다 — 별도
  `procurement_risk_acknowledgements` 로그 테이블에만 INSERT한다(`notification_log`와 동일
  구조 원칙). 같은 평가를 두 번 호출해도 안전(멱등) — 두 번째 호출은 `already_acknowledged:
  true`와 함께 최초 처리자 정보를 그대로 돌려준다.
- "완료 처리"된 평가가 그 자재 대분류의 최신 평가였다면, `GET
  /api/v1/dashboard/procurement-risk-summary`의 스냅샷 집계(심각/주의 건수 등)에서 해당
  카테고리가 빠진다. 이후 같은 카테고리에 새 뉴스로 인한 새 평가가 들어오면(새
  `assessment_id`라 이 로그에 없음) 자동으로 다시 집계된다 — 별도 API 호출 없이 이 구조만으로
  보장된다.
- `*_24h` 필드에는 영향을 주지 않는다("오늘 무슨 일이 있었나"는 완료 처리 여부와 무관).

## 아직 이동하지 않은 것들 (참고)

백엔드에는 이 문서에 없는 컨트롤러도 이미 존재한다(`DashboardController`의 나머지 엔드포인트
(`/dashboard/summary`/`/dashboard/materials`/`/dashboard/import-dependency`/`/contracts`)/
`BriefingController`/`ErpController`/`RagController`/`SeverityController`/
`RealtimeAlertController`/`DocumentController`/`MultiAgentController` 등) — 다만 이번
세션에서 실제로 코드 대조나 실측 검증을 거치지 않았으므로 옮기지 않았다.
`docs/mock-schemas.md`의 2계층/3계층/브리핑/구매팀 확장 섹션은 여전히 "제안 단계"로
남아있다 — 실측 검증되는 대로 이 문서로 옮긴다.
