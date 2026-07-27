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

## 아직 이동하지 않은 것들 (참고)

백엔드에는 이 문서에 없는 컨트롤러도 이미 존재한다(`DashboardController`/
`BriefingController`/`ErpController`/`RagController`/`SeverityController`/
`RealtimeAlertController`/`DocumentController` 등) — 다만 이번 세션에서 실제로 코드 대조나
실측 검증을 거치지 않았으므로 옮기지 않았다. `docs/mock-schemas.md`의 2계층/3계층/브리핑/
구매팀 확장 섹션은 여전히 "제안 단계"로 남아있다 — 실측 검증되는 대로 이 문서로 옮긴다.
