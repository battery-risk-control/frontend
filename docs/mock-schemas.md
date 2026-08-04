# Mock API 스키마 — 2계층/3계층/인증/공개 대시보드 (제안)

> 1계층 `risk_event` 스키마(CLAUDE.md 참고)를 원천으로 하되, 계층별 목적에 맞게 집계·가공한 형태다.
> **이 문서는 데모용 제안이며, 프로젝트 진행 중 실제 BE 계약이 나오면 계속 바뀐다.** 필드 추가/삭제가 쉽도록 각 객체를 평탄하지 않게(중첩 객체 단위로) 설계했다.
>
> **2026-07-27부터**: 실 백엔드와 검증 완료된 계약은 이 문서에서 `docs/backend-api-contracts.md`로
> 이동한다(현재 인증, 공개 지도 2건) — 이 문서에는 이동했다는 안내 한 줄만 남긴다. 아직 여기
> 남아있는 나머지 섹션은 전부 제안 단계다.

## 1. 2계층 — 경영기획팀 대시보드

> **2026-08-03부터**: 이 절의 7개 엔드포인트(전략 대시보드/자재 위험/수입 의존도/공급사
> 분석/계약 현황/AI 브리핑/데이터 품질) + 드릴다운 상세 2개(AI 브리핑/계약, 아래 1-7/1-8)
> 총 9개가 실 백엔드(`PlanningDashboardController`)에 연결됐다 — 연결 검증 상세는
> `docs/backend-api-contracts.md` "3. 2계층 경영기획팀 대시보드" 참고. 응답 필드 스키마
> 자체는 이 문서에 있는 그대로 변경 없이 유지된다. 아래 mock 파생 로직 설명은
> `VITE_API_BASE_URL` 미설정 시(①단계) 폴백 동작으로 계속 유효하다.

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

### 1-1. 자재 위험 탭 (`fetchMaterialRiskDashboard()`)

```json
{
  "kpi_summary": [
    { "label": "평가 자재", "value": 3, "unit": "종" },
    { "label": "심각 자재", "value": 1, "unit": "건" },
    { "label": "평균 재고일수", "value": 34, "unit": "일" },
    { "label": "최고 위험 점수", "value": 70, "unit": "점" }
  ],
  "ranking": [
    { "material": "코발트", "score": 70, "rank": 1, "grade": "심각" }
  ],
  "top_material_unit_exposure": [
    { "business_unit": "양극재사업부", "exposure_score": 70 }
  ],
  "quarter_change_label": "지난 분기 대비 위험 점수 상승"
}
```
- `ranking`/`score`는 `risk_exposure_by_unit`과 동일한 GRADE_SEVERITY×24 환산을 자재 단위로
  재계산한 것 — 같은 산식을 두 축(사업부/자재)에 재사용해 숫자 체계를 통일했다.
- `평균 재고일수`/`quarter_change_label`은 `risk_event`에 대응 필드가 없어 예시값 —
  mock 임시값, 후속 검증 필요.

### 1-2. 수입 의존도 탭 (`fetchImportDependencyDashboard()`)

```json
{
  "kpi_summary": [
    { "label": "전체 수입 의존도", "value": 82.3, "unit": "%" },
    { "label": "단일국가 과의존", "value": 0, "unit": "건" },
    { "label": "대체 후보", "value": 1, "unit": "곳" },
    { "label": "다변화 진행률", "value": 40, "unit": "%" }
  ],
  "by_country": [{ "country": "중국", "share_ratio": 54.1 }],
  "by_unit": [{ "business_unit": "배터리셀사업부", "country": "중국", "share_ratio": 84 }],
  "alternative_suppliers": [
    { "id": "SUP-0101", "primary": "공급사A", "secondary": "전환 시 의존도 개선 추정", "badge": { "label": "APPROVED", "tone": "success" } }
  ]
}
```
- `by_country`는 1계층 `fetchImportDependency()`(`purchasing.api.ts`)의 국가별 breakdown을
  그대로 재사용한 실제 파생값이다. `by_unit`/`다변화 진행률`은 사업부×국가 실측 데이터가
  없어 상위 2개 사업부만 고정값으로 채운 mock 임시값 — 후속 검증 필요.

### 1-3. 공급사 분석 탭 (`fetchSupplierAnalysisDashboard()`)

```json
{
  "kpi_summary": [
    { "label": "전체 공급사", "value": 6, "unit": "곳" },
    { "label": "REVIEW 상태", "value": 3, "unit": "곳" },
    { "label": "90일 이벤트", "value": 7, "unit": "건" },
    { "label": "대체 검토 진행", "value": 2, "unit": "/3" }
  ],
  "ranking": [
    { "vendor_id": "SUP-0101", "vendor_name": "공급사A", "risk_count_90d": 2, "approved_status": "REVIEW", "linked_units": ["배터리셀사업부"] }
  ],
  "recommended": [
    { "id": "SUP-0103", "primary": "공급사C", "secondary": "최근 90일 이력 1건", "badge": { "label": "APPROVED", "tone": "success" } }
  ]
}
```
- `ranking`은 위 §1의 `vendor_risk_history`를 이력 건수 내림차순으로 재정렬 + `approved_status`/
  `linked_units` 필드를 확장한 것 — 최신 등급이 '심각'이면 REVIEW로 파생한다.
  `linked_units`는 공급사-사업부 연결 실측 데이터가 없어 고정값 — mock 임시값, 후속 검증 필요.

### 1-4. 계약 현황 탭 (`fetchContractStatusDashboard()`)

```json
{
  "kpi_summary": [
    { "label": "ACTIVE", "value": 24, "unit": "건" },
    { "label": "만료 임박", "value": 3, "unit": "건" },
    { "label": "문서 적재", "value": 28, "unit": "건" },
    { "label": "RAG 검색 가능", "value": 28, "unit": "건" }
  ],
  "coverage_by_unit": [{ "business_unit": "배터리셀사업부", "contract_count": 14 }],
  "expiring": [
    { "id": "BA-2025-0014", "primary": "BA-2025-0014", "secondary": "양극재사업부", "badge": { "label": "D-12", "tone": "warning" } }
  ]
}
```
- risk_event/ERP 어느 쪽에도 계약-사업부 매핑이 없어 **전 필드 mock 임시값** — 아래
  "임시 mock 값" 표에 등재.

### 1-5. AI 브리핑 탭 (`fetchAiBriefingSummaryDashboard()`)

```json
{
  "kpi_summary": [
    { "label": "이번 분기 브리핑", "value": 32, "unit": "건" },
    { "label": "CRITICAL 비중", "value": 33.3, "unit": "%" },
    { "label": "평균 대응 소요", "value": 2.3, "unit": "일" },
    { "label": "임원 보고 지정", "value": 4, "unit": "건" }
  ],
  "by_unit": [{ "name": "배터리셀사업부", "value": 2, "tone": "neutral" }],
  "recent": [
    { "risk_event_id": "RISK-2026-0721-001", "material": "니켈", "grade": "심각", "headline": "인도네시아 니켈 수출 관세 인상 발표로 현물가 18% 급등", "business_unit": "배터리셀사업부" }
  ]
}
```
- `by_unit`/`recent`는 `risk_event` mock을 사업부·최신순으로 취합한 실제 파생값.
  "이번 분기 브리핑"/"임원 보고 지정"은 표본(7건)이 작아 예시값 — mock 임시값, 후속 검증 필요.

### 1-6. 데이터 품질 탭 (`fetchDataQualityStatus()`)

```json
{
  "erp_sync_status": "정상",
  "rag_index_status": "정상",
  "material_coverage_count": 3,
  "material_coverage_total": 8,
  "last_updated_label": "10분 전",
  "confidence_distribution": [
    { "label": "확정", "ratio": 42 },
    { "label": "참고", "ratio": 41 },
    { "label": "경고", "ratio": 17 }
  ]
}
```
- **전 필드 mock 임시값** — 실제 파이프라인 모니터링 연동 전. 아래 "임시 mock 값" 표에 등재.

### 1-7. AI 브리핑 드릴다운 상세 (`fetchAiBriefingDetail()`, 2026-08-03 신규)

`GET /api/v1/planning/ai-briefing/{analysisId}`

```json
{
  "analysis_id": "RISK-2026-0721-001",
  "material": "니켈",
  "business_unit": "배터리셀사업부",
  "grade": "심각",
  "headline": "인도네시아 니켈 수출 관세 인상 발표로 현물가 18% 급등",
  "event_content": "인도네시아 니켈 수출 관세 인상 발표로 현물가 18% 급등",
  "briefing": "LLM이 생성한 브리핑 본문",
  "recommended_actions": ["대체 공급사 컨택 검토", "안전재고 확대 검토"],
  "contract_findings": [],
  "warnings": [],
  "assessed_at": null
}
```

- 실 백엔드는 `procurement_risk_assessments`의 LLM 브리핑 본문·근거를 반환하지만(1-5 §AI
  브리핑 탭 `recent` 목록엔 없는 상세 필드), mock은 그런 상세 필드가 없어 화면 확인용으로
  1-5의 `recent` 목록에서 `risk_event_id`로 찾아 `briefing`/`recommended_actions`(고정
  문구)를 합성한다 — 목록에 없는 id는 "찾을 수 없음" 오류로 처리(§5 `BriefingDetailPage`와
  동일 관례). `contract_findings`/`warnings`는 항상 빈 배열 — mock 임시값, 아래 "임시 mock
  값" 표에 등재.

### 1-8. 계약 상세 드릴다운 (`fetchContractDetail()`, 2026-08-03 신규)

`GET /api/v1/planning/contracts/{contractNumber}`

```json
{
  "contract_number": "BA-2025-0014",
  "contract_name": "BA-2025-0014 공급 계약",
  "supplier_name": "공급사A",
  "material_name": null,
  "business_unit": "양극재사업부",
  "status": "ACTIVE",
  "start_date": null,
  "end_date": null,
  "documents": []
}
```

- 실 백엔드는 `contracts`⨝`suppliers`⨝`materials`⨝`business_units` 조인 + 별도 문서 목록
  조회(`contract_documents`)로 실제 공급사·자재·적재 문서를 반환하지만, mock은 1-4의
  `expiring` 목록에서 `id`로 찾아 `contract_name`/`supplier_name`(고정값 "공급사A")을
  합성한다 — 목록에 없는 id는 "찾을 수 없음" 오류로 처리. `material_name`/`start_date`/
  `end_date`/`documents`는 1-4 목록에 대응 필드가 없어 항상 `null`/빈 배열 — mock 임시값,
  아래 "임시 mock 값" 표에 등재.

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

→ **확정됨.** `docs/backend-api-contracts.md` "1. 인증" 참고(2026-07-27, 실 백엔드 연동
시연 4개 시나리오 + Playwright e2e 24/24로 검증 — 이동하며 URL 버전 접두사(`/api/v1/`)와
회원가입 응답 필드(`message`→`org_tier`) 오류도 함께 정정됨).

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
- **①②단계**에서는 이 엔드포인트를 실 데이터처럼 취급하면 안 된다 — **③단계** 진입(계약 확정) 시 이 스키마 전체(특히 `price_index`)를 교체해야 한다.
- 통화 단위 절대값 대신 "기준일=100" 상대 지수를 쓰는 이유: 근거 없는 절대 가격 수치를 문서에 확정값처럼 남기지 않기 위함.

## 4-1. 비로그인 공개 대시보드 — 글로벌 리스크 관제 지도

→ **확정됨.** `docs/backend-api-contracts.md` "2. 비로그인 공개 대시보드 — 글로벌 리스크
관제 지도" 참고(2026-07-27, 백엔드 코드 직접 확인 + curl + Playwright 실측 검증).

## 5. 1계층 — 브리핑 자료 열람 (Seq 24)

`GET /api/purchasing/risk-events/{risk_event_id}/briefing`
```json
{
  "risk_event_id": "RISK-2026-0721-001",
  "material": "니켈",
  "grade": "심각",
  "confidence_label": "확정",
  "rag_view": {
    "contract_clause_summary": "기존 계약서 8조(가격 조정) — 원자재가 15% 이상 변동 시 재협상 조항 존재",
    "negotiation_points": ["재협상 조항 발동 요건 충족 여부 확인", "단기 물량 우선 확보 조건 제시"]
  },
  "output_artifacts": { "render_mode": "json", "file_url": null, "fallback_to_json": true }
}
```

- 새 데이터가 아니라 1계층 `risk_event` 스키마(CLAUDE.md 참고)의 `rag_view`/`output_artifacts`만 추출한 상세 조회 응답이다 — `risk_event_id`로 원본 배열에서 찾아 파생한다.
- `material`/`grade`/`confidence_label`은 화면에 RiskGradeBadge/ConfidenceBadge를 표시하기 위해 함께 내려준다 — 신뢰도 라벨 규칙(Seq 20)을 이 화면에도 동일 적용.
- 존재하지 않는 `risk_event_id`로 조회하면 FE는 "해당 리스크 이벤트를 찾을 수 없습니다" 안내로 대체한다.
- Seq 21(산출물 다운로드)과는 범위가 다르다. 이 화면은 Seq 24 "내부 브리핑 자료 열람 화면"이며, `output_artifacts`는 렌더 모드 등 메타 정보만 보여줄 뿐 JSON 렌더링/다운로드 UI 자체는 이 범위에서 구현하지 않는다(Seq 21 별도 범위).

## 6. 1계층 — 구매팀 대시보드 확장(원자재 리스크 개요/수입 의존도, Phase 9.4, surin 이식)

`risk_event` 스키마를 원천으로 하지 않는, 데모(화면ID UX-01-DB) 상단 요약 영역 전용 mock —
`api/purchasing.api.ts`의 `fetchMaterialRiskGauges()`/`fetchScoreCards()`/`fetchImportDependency()`.

```json
// fetchMaterialRiskGauges()
[
  { "name": "리튬", "basis": "(탄산리튬 기준)", "grade": "심각", "changeLabel": "전일 대비 ▲ 4" },
  { "name": "니켈", "basis": "(황산니켈 기준)", "grade": "주의", "changeLabel": "전일 대비 ▼ 2" },
  { "name": "흑연", "basis": "(구형흑연 기준)", "grade": "심각", "changeLabel": "전일 대비 ▲ 6" }
]

// fetchScoreCards()
[
  { "label": "외부 리스크 종합 점수", "score": 72, "grade": "심각", "diffLabel": "전일 대비 ▲ +8p" },
  { "label": "ERP 영향 점수", "score": 65, "grade": "주의", "diffLabel": "전일 대비 ▲ +6p" }
]

// fetchImportDependency()
{
  "total": 82.3,
  "year": "2024년 기준",
  "breakdown": [
    { "label": "중국", "value": 54.1, "color": "#2f5adb" },
    { "label": "인도네시아", "value": 12.8, "color": "#22c55e" },
    { "label": "호주", "value": 8.7, "color": "#a855f7" },
    { "label": "모잠비크", "value": 6.3, "color": "#f59e0b" },
    { "label": "브라질", "value": 5.2, "color": "#38bdf8" },
    { "label": "기타", "value": 12.9, "color": "#cbd5e1" }
  ]
}
```

- `grade`는 surin 원본의 4단계(정상/주의/경고/심각) 대신 기존 3단계 `RiskGrade`(정상/주의/심각)로
  매핑했다 — `ConfidenceLabel`의 "경고"(신뢰도 검증 실패)와 같은 화면에서 동시에 다른 의미로
  노출되는 걸 피하기 위함. 매핑: 리튬(경고→심각), 니켈(주의→주의), 흑연(경고→심각), 외부 리스크
  종합 점수(높음→심각), ERP 영향 점수(주의→주의 그대로).
- `fetchMaterialRiskGauges()`는 surin 값을 그대로 가져와 자재 구성이 리튬/니켈/**흑연**이지만,
  같은 화면의 다른 패널(`MaterialRiskStatusPanel` 등)이 쓰는 `risk_event` mock 6건에는 흑연이
  없고 대신 **코발트**가 있다 — 두 영역의 자재 구성이 서로 다르다는 뜻이며, 아래 "임시 mock 값"
  표에도 등재해 둔다.

## 7. 1계층 — 구매팀 대시보드 확장(뉴스속보·환율정보 티커, 2차 데모)

`risk_event` 스키마를 원천으로 하지 않는, 2차 데모(UX-01-DB, `NewsExchangeTicker`) 전용
mock — `api/purchasing.api.ts`의 `fetchExchangeRates()`. `NewsExchangeTicker`의 "뉴스속보"
행은 신규 mock이 아니라 기존 `fetchNewsFeed()`를 표현만 다르게(세로 롤링) 재사용한다.

```json
// fetchExchangeRates()
[
  { "currency_code": "USD", "currency_name": "미국 달러", "rate": 1391.5, "change_label": "▲ 0.3%" },
  { "currency_code": "CNY", "currency_name": "중국 위안", "rate": 191.2, "change_label": "▼ 0.1%" },
  { "currency_code": "EUR", "currency_name": "유로", "rate": 1508.7, "change_label": "▲ 0.5%" }
]
```

- `risk_event` 계열과 무관한 완전 신규 개념(환율)이라 원천 데이터에서 파생하지 않고 주요
  통화 3종(USD/CNY/EUR)을 그대로 하드코딩했다 — `rate`/`change_label` 모두 실제 계산
  로직 없는 mock 임시값이다. 필드 구성(`currency_code`/`currency_name`/`rate`/
  `change_label`)은 `api/types.ts`의 `ExchangeRateItem` 타입 정의를 그대로 옮겼다.

## 임시 mock 값 (후속 정리 필요)

Phase 9.3(원자재 가격 추이 "상세보기", surin `RiskMonitoring.tsx` 시각 이식)에서 시각 구성을 우선하기 위해 실제 계산 로직 없이 하드코딩한 필드 목록. 각 필드는 코드에도 `// mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요` 주석이 달려 있다. 앞으로도 실제 계산 로직 없이 mock 값으로 구현하는 필드가 생기면, 이 섹션에 반드시 등재하고 코드에도 `// mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요` 주석을 남긴다.

| 필드 | 위치 | 쓰이는 곳 | 왜 임시값인가 |
|---|---|---|---|
| `MaterialPriceSummary.change_label` | `api/types.ts`, `api/purchasing.api.ts`의 `fetchMaterialPriceSummaries()`(Phase 9.4에서 `public.api.ts`→`purchasing.api.ts`로 이동, `public.api.ts`는 재수출만) | `components/widgets/MaterialPriceDetail.tsx`(Phase 9.4에서 `features/public/components/`→`components/widgets/`로 승격) 요약 카드 | `MaterialPriceSeries`의 실제 등락률을 계산하지 않고 surin 화면과 비슷한 톤의 값을 직접 지정했다. 가격(`price_index`)만 `MaterialPriceSeries` 마지막 포인트에서 실제로 유도해 항상 일치한다 — 등락률은 그 값과 무관하다. |
| `MaterialPriceSummary.risk_score` | 〃 | 〃 | `risk_event`의 등급·신뢰도와 연결된 계산이 아니라 surin `monitoringPrices`의 점수를 참고해 임의로 지정한 값이다. |
| `MaterialPriceSummary.grade` | 〃 | 〃 | 같은 자재의 실제 `risk_event.grade` 집계(예: 최고 심각도)가 아니라 화면 구성을 위해 직접 지정했다. `RiskGradeBadge` 표시 자체는 기존 컴포넌트를 그대로 재사용한다. |
| 필터 드롭다운 선택값(원자재/국가·지역) | `MaterialPriceDetail.tsx` 내부 `useState` | 〃 | 열림/닫힘과 선택된 라벨 표시는 실제로 동작하지만, 선택해도 차트·카드 데이터는 바뀌지 않는다(표시 전용). "국가·지역" 옵션 목록도 실제 자재-국가 연결 데이터가 아니라 `GlobalRiskBoard` mock에 등장하는 5개국을 그대로 나열한 것이다. |
| 기간 버튼(1주/1개월/3개월/6개월/사용자 설정) | 〃 | 〃 | 선택 상태와 활성 스타일은 실제로 전환되지만, mock `MaterialPriceSeries.points`가 짧은 고정 시계열(7일치)뿐이라 기간별로 다른 데이터를 보여주지 못한다. |
| `MaterialRiskGaugeItem`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchMaterialRiskGauges()`(Phase 9.4, surin `materialRiskGauges` 이식) | `features/purchasing/components/MaterialRiskOverviewRow.tsx` 게이지 카드 3장 | surin 값을 그대로 가져왔다. 자재 구성이 리튬/니켈/**흑연**인데, 같은 페이지의 `risk_event` mock 6건(다른 패널이 쓰는 원천 데이터)에는 흑연이 없고 코발트가 있어 — 이 5칸 그리드만 다른 패널과 자재 구성이 어긋난다. `grade`도 surin 4단계를 3단계 `RiskGrade`로 매핑(경고→심각)한 값이라 실제 계산 로직은 없다. |
| `ScoreCardItem`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchScoreCards()`(Phase 9.4, surin `summaryScores` 이식) | `features/purchasing/components/MaterialRiskOverviewRow.tsx` 점수 카드 2장 | surin `summaryScores`(외부 리스크 종합 점수 72/ERP 영향 점수 65)를 그대로 가져왔다. `grade`도 surin 원본 문구("높음"/"주의")를 3단계 `RiskGrade`로 매핑(높음→심각)한 값이라 실제 계산 로직은 없다. |
| `ImportDependencyData`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchImportDependency()`(Phase 9.4, surin `importDependency` 이식) | `features/purchasing/components/ImportDependencyPanel.tsx` 도넛차트+범례 | `risk_event` 스키마에는 없는 개념(국가별 수입 비중)이라 surin 값을 그대로 가져왔다. 국가별 `color`(hex)도 surin 원본을 그대로 썼다. |
| `ExchangeRateItem`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchExchangeRates()`(2차 데모 신규) | `features/purchasing/components/NewsExchangeTicker.tsx` | 실제 환율 API 연동 전 mock — 통화 3종(USD/CNY/EUR)을 하드코딩했다. |
| `NewsFeedItem.publisher` | `api/types.ts`, `api/purchasing.api.ts`의 `fetchNewsFeed()`(`MOCK_NEWS_PUBLISHER_BY_RISK_EVENT_ID`, 2차 데모 신규) | `components/widgets/SupplyNewsFeed.tsx` 카드 상단 뱃지 | "데이터_활용_및_모델_학습_기획정의서" 1단계의 GDELT 메타데이터 `domain` 필드(기사 게재 언론사 도메인)를 반영한 필드이나, 실제 GDELT 연동 전이라 risk_event_id별로 도메인풍 예시값(`reuters.com`/`bloomberg.com`/`mining.com`/`nikkei.com`/`ft.com`/`spglobal.com`)을 하드코딩했다 — 실제 언론사 소속과 무관. 기존 `NewsFeedItem.source`(데이터 출처 계층, `'data_ingestion_layer'`)를 화면에 언론사명처럼 잘못 노출하던 매핑 오류를 발견해 이 필드를 신설, `source`는 의미 불변으로 유지하되 화면에는 더 이상 쓰지 않는다. |
| `MaterialRiskDashboardResponse.평균 재고일수`/`quarter_change_label` | `api/types.ts`, `api/planning.api.ts`의 `fetchMaterialRiskDashboard()`(2계층 자재 위험 탭 신규) | `features/planning/pages/MaterialRiskPage.tsx` | `risk_event`에는 재고일수·분기 추이 필드가 없어 예시값을 직접 지정했다. `ranking`/`score`(GRADE_SEVERITY×24 환산)는 실제 파생값과 동일 산식이라 임시값이 아니다. |
| `ImportDependencyDashboardResponse.by_unit`/`다변화 진행률` | `api/types.ts`, `api/planning.api.ts`의 `fetchImportDependencyDashboard()`(2계층 수입 의존도 탭 신규) | `features/planning/pages/ImportDependencyPage.tsx` | 사업부×국가 실측 데이터가 없어 상위 2개 사업부만 고정값(84%/31%)으로 채웠다. `by_country`는 1계층 `fetchImportDependency()`를 그대로 재사용한 실제 파생값이라 임시값이 아니다. |
| `SupplierRiskRankItem.linked_units` | `api/types.ts`, `api/planning.api.ts`의 `fetchSupplierAnalysisDashboard()`(2계층 공급사 분석 탭 신규) | `features/planning/pages/SupplierAnalysisPage.tsx` | 공급사-사업부 연결 실측 데이터가 없어 전 공급사에 `['배터리셀사업부']` 고정값을 채웠다. `ranking`/`approved_status`는 기존 `vendor_risk_history`를 재정렬·파생한 실제 값이라 임시값이 아니다. |
| `ContractStatusDashboardResponse`(전체 필드) | `api/types.ts`, `api/planning.api.ts`의 `fetchContractStatusDashboard()`(2계층 계약 현황 탭 신규) | `features/planning/pages/ContractStatusPage.tsx` | risk_event/ERP 어느 쪽에도 계약-사업부 매핑이 없어 전 필드를 고정값으로 하드코딩했다. |
| `AiBriefingSummaryDashboardResponse.이번 분기 브리핑`/`임원 보고 지정` | `api/types.ts`, `api/planning.api.ts`의 `fetchAiBriefingSummaryDashboard()`(2계층 AI 브리핑 탭 신규) | `features/planning/pages/AiBriefingSummaryPage.tsx` | `risk_event` 표본(7건)은 "이번 분기" 규모를 대표하기엔 작아 예시값을 사용했다. `by_unit`/`recent`는 `risk_event`를 사업부·최신순으로 취합한 실제 파생값이라 임시값이 아니다. |
| `DataQualityStatus`(전체 필드) | `api/types.ts`, `api/planning.api.ts`의 `fetchDataQualityStatus()`(2계층 데이터 품질 탭 신규) | `features/planning/pages/DataQualityPage.tsx` | 실제 파이프라인 모니터링(ERP 연동 상태/RAG 인덱스 상태/자재 커버리지/신뢰도 라벨 분포) 연동 전이라 전 필드가 고정값이다. |
| `AiBriefingDetailResponse.briefing`/`recommended_actions`/`contract_findings`/`warnings` | `api/types.ts`, `api/planning.api.ts`의 `fetchAiBriefingDetail()`(드릴다운 상세, 2026-08-03 신규) | `features/planning/pages/AiBriefingDetailPage.tsx` | mock은 1-5의 `recent` 목록에 없는 LLM 브리핑 본문·근거 필드를 화면 확인용으로 고정 문구/빈 배열로 합성한다 — 실제 백엔드는 `procurement_risk_assessments`의 실제 값을 반환. |
| `ContractDetailResponse.material_name`/`start_date`/`end_date`/`documents` | `api/types.ts`, `api/planning.api.ts`의 `fetchContractDetail()`(드릴다운 상세, 2026-08-03 신규) | `features/planning/pages/ContractDetailPage.tsx` | mock은 1-4의 `expiring` 목록에 없는 자재/기간/문서 필드를 `null`/빈 배열로 채운다 — 실제 백엔드는 `contracts`⨝`materials`⨝`contract_documents` 조인으로 실측값을 반환. |

## 확장 원칙
- 새 화면·지표가 추가되면 기존 필드를 변경하지 말고 옆에 새 필드를 추가한다 (breaking change 최소화).
- 계층 간 동일 개념(리스크 등급, 신뢰도 라벨, 사업부명)은 항상 동일한 값 집합·필드명을 재사용한다.
