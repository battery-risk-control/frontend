# Mock API 스키마 — 2계층/3계층/인증/공개 대시보드 (제안)

> 1계층 `risk_event` 스키마(CLAUDE.md 참고)를 원천으로 하되, 계층별 목적에 맞게 집계·가공한 형태다.
> **이 문서는 데모용 제안이며, 프로젝트 진행 중 실제 BE 계약이 나오면 계속 바뀐다.** 필드 추가/삭제가 쉽도록 각 객체를 평탄하지 않게(중첩 객체 단위로) 설계했다.

## 1. 2계층 — 경영기획팀 대시보드

`GET /api/planning/dashboard?business_unit={id}&period={yyyyQn}`

```json
{
  "business_unit": "배터리셀사업부",
  "period": "2026Q3",
  "kpi_summary": [
    { "label": "탐지된 리스크", "value": 32, "unit": "건" },
    { "label": "심각 등급 비중", "value": 18.5, "unit": "%" },
    { "label": "평균 대응 소요", "value": 2.3, "unit": "일" }
  ],
  "risk_exposure_by_unit": [
    { "business_unit": "배터리셀사업부", "exposure_score": 72 },
    { "business_unit": "양극재사업부", "exposure_score": 45 }
  ],
  "vendor_risk_history": [
    {
      "vendor_id": "SUP-0142",
      "vendor_name": "공급사A",
      "risk_count_90d": 5,
      "latest_grade": "주의",
      "confidence_label": "참고"
    }
  ]
}
```

- `kpi_summary`는 배열 — 카드 개수가 바뀌어도 프론트 컴포넌트 수정 없이 대응 가능하도록 설계.
- `vendor_risk_history[].confidence_label`은 1계층 `risk_event.confidence_label`과 동일한 값 집합(확정/참고/경고) 사용 — 신뢰도 라벨 규칙(Seq 20)을 전 계층에 일관 적용.
- FE 구현 시 이 응답을 1계층 `risk_event` mock 배열에서 실제로 파생시켰다. `risk_exposure_by_unit`은 `risk_event`에 없는 사업부(business_unit) 개념이 필요해 자재(니켈/리튬→배터리셀사업부, 코발트→양극재사업부) → 사업부 매핑을 임시로 가정했고, `exposure_score`는 사업부별 평균 등급(정상=1/주의=2/심각=3)을 72점 만점으로 환산해 계산한다. `vendor_risk_history`는 `risk_event.erp_view.alt_sourcing_candidates`에 등장하는 공급사명을 집계(`risk_count_90d`)하고 최신 이벤트의 등급·신뢰도를 가져와 채운다 — `vendor_id`만 데모용 고정 매핑(`SUP-01xx`)이다. `kpi_summary`의 "탐지된 리스크"·"평균 대응 소요"는 `risk_event` mock 7건으로 대표하기엔 규모가 작아(실제 "이번 분기" 규모를 표현할 수 없음) 이 문서의 예시값을 그대로 사용했고, "심각 등급 비중"만 `risk_event` 배열에서 직접 계산한다.

## 2. 3계층 — 경영진 대시보드

`GET /api/executive/dashboard?period={yyyyQn}`

```json
{
  "period": "2026Q3",
  "cumulative_risk_kpi": {
    "detected_count": 118,
    "responded_count": 94,
    "response_rate": 79.7,
    "critical_count": 5,
    "avg_response_days": 2.3
  },
  "savings_simulation": {
    "is_simulation": true,
    "estimated_saving_krw": 320000000,
    "baseline_assumption": "조기 대응 없이 최초 감지가로 구매 지속 가정"
  },
  "enterprise_risk_summary": [
    { "business_unit": "배터리셀사업부", "exposure_score": 72, "trend": "상승" },
    { "business_unit": "양극재사업부", "exposure_score": 45, "trend": "유지" }
  ]
}
```

- `savings_simulation.is_simulation: true`를 항상 고정 — product-overview.md의 "비예측 원칙"에 따라 화면에도 반드시 "시뮬레이션" 표기를 강제하기 위한 필드.
- `enterprise_risk_summary`는 2계층 `risk_exposure_by_unit`을 그대로 압축 인용 — 같은 데이터 소스에서 파생됨을 필드명 유사성으로 유지. FE 구현 시 실제로 2계층 mock 함수의 반환값을 그대로 가져와 압축했고, `trend`는 `exposure_score`가 데모 임계값(50) 이상이면 "상승", 아니면 "유지"로 계산했다 — "하락"은 값 집합에는 있지만 현재 mock 데이터로는 나타나지 않는다.
- `cumulative_risk_kpi.critical_count`/`avg_response_days`는 최초 제안 스키마에는 없었으나 Figma "경영진 대시보드" 프레임의 KPI 박스(이번 분기 탐지 건수/심각 등급 건수/평균 대응 소요)와 그 화면 설명 예시("이번 분기 리스크 탐지 32건, 그 중 심각 등급 5건, 평균 대응 소요 시간 2.3일")에 맞춰 확장 원칙에 따라 추가했다. `detected_count`/`critical_count`/`avg_response_days`는 이 예시 수치를 그대로 사용한다 — `risk_event` mock 7건은 "이번 분기" 규모를 대표하기엔 표본이 작아 파생하지 않았다. 기존 `responded_count`/`response_rate`는 필드는 유지하되 현재 3계층 화면(CumulativeRiskKpi 컴포넌트)에서는 사용하지 않는다.

## 3. 인증

**회원가입** `POST /api/auth/signup`
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
{ "user_id": "USR-0001", "status": "PENDING", "message": "관리자 승인 대기 중입니다." }
```

- `name`(임직원 성명)은 최초 제안 스키마에는 없었으나 Figma 회원가입 와이어프레임에 입력 필드로 존재해 확장 원칙에 따라 추가.
- `org_name`은 반대로 Figma 와이어프레임에는 입력 필드가 없다. 소속 회사 선택 UI가 추가되기 전까지 FE는 고정값(`OO배터리`)을 채워 보낸다 — 실제 입력 UI가 생기면 이 필드만 폼 값으로 교체하면 된다.

**로그인** `POST /api/auth/login`
```json
{ "email": "user@company.com", "password": "********" }
```
성공 응답:
```json
{ "access_token": "mock.jwt.token", "org_tier": "purchasing", "status": "APPROVED" }
```
승인 대기 중 로그인 시도:
```json
{ "error": "PENDING_APPROVAL", "message": "관리자 승인 대기 중입니다." }
```
→ FE는 이 응답을 받으면 Seq 35의 보안 락 화면으로 라우팅한다.

## 4. 비로그인 공개 대시보드 — 원자재 가격 추이

`GET /api/public/material-price-trend`
```json
[
  {
    "material": "니켈",
    "unit": "지수(기준일=100)",
    "points": [
      { "date": "2026-07-15", "price_index": 100 },
      { "date": "2026-07-21", "price_index": 118 }
    ]
  }
]
```

- `risk_event` 스키마에는 가격 필드가 없다. 대상 자재 목록만 `risk_event.market_context.material`에서 가져오고, `price_index` 값 자체는 데모 화면 확인용으로 합성한 것이며 실제 시황 데이터가 아니다.
- 실제 원자재 가격 피드/API 계약이 정해지기 전까지는 이 엔드포인트를 실 데이터처럼 취급하면 안 된다 — 계약이 나오면 이 스키마 전체(특히 `price_index`)를 교체해야 한다.
- 통화 단위 절대값 대신 "기준일=100" 상대 지수를 쓰는 이유: 근거 없는 절대 가격 수치를 문서에 확정값처럼 남기지 않기 위함.

## 확장 원칙
- 새 화면·지표가 추가되면 기존 필드를 변경하지 말고 옆에 새 필드를 추가한다 (breaking change 최소화).
- 계층 간 동일 개념(리스크 등급, 신뢰도 라벨, 사업부명)은 항상 동일한 값 집합·필드명을 재사용한다.
