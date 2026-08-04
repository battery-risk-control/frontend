# Mock API 스키마 — 2계층/3계층/인증/공개 대시보드 (제안)

> 1계층 `risk_event` 스키마(CLAUDE.md 참고)를 원천으로 하되, 계층별 목적에 맞게 집계·가공한 형태다.
> **이 문서는 데모용 제안이며, 프로젝트 진행 중 실제 BE 계약이 나오면 계속 바뀐다.** 필드 추가/삭제가 쉽도록 각 객체를 평탄하지 않게(중첩 객체 단위로) 설계했다.
>
> **2026-07-27부터**: 실 백엔드와 검증 완료된 계약은 이 문서에서 `docs/backend-api-contracts.md`로
> 이동한다(현재 인증, 공개 지도 2건) — 이 문서에는 이동했다는 안내 한 줄만 남긴다. 아직 여기
> 남아있는 나머지 섹션은 전부 제안 단계다.

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

> **2026-08-03 갱신**: `fetchMaterialPriceTrends()`(동기 mock)는 그대로 유지하되, 화면
> (`PublicDashboardPage.tsx`)은 이제 `fetchPublicPriceTrends(days?)`(비동기, `public.api.ts`)를
> 통해 조회한다 — ①단계에서는 이 함수가 내부적으로 `fetchMaterialPriceTrends()`를 그대로
> 반환한다(로직 변경 없음). `MaterialPriceSeries`에 `base_date?`/`countries?`(⇒ `SourcingCountry`)
> 필드가 추가됐으나 mock에는 없을 수 있는 선택 필드다(아래 "임시 mock 값" 표 참고, minji 이식).

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

## 7. 비로그인 공개 대시보드 확장 — 환율 밴드/컴팩트 가격 카드/수입 의존도 (minji 이식, 2026-08-03)

`origin/minji` 브랜치(구매팀 담당자 별도 진행분)에서 비로그인 담당 범위에 해당하는 부분만
이식했다(`git merge`가 아니라 파일 단위 이식) — `api/public.api.ts`의
`fetchPublicExchangeRates()`/`fetchPublicImportDependency()`/`fetchPublicPriceTrends()`가
공통으로 쓰는 신규 mock 함수 `fetchExchangeRates()`.

```json
// fetchExchangeRates() — ExchangeRateBoard
{
  "rate_date": "2026-07-31",
  "base_currency": "KRW",
  "rates": [
    { "currency_code": "USD", "currency_name": "미국 달러", "unit_multiplier": 1, "label": "USD/KRW", "rate": 1441.1, "change_amount": -9.0, "change_rate": -0.62, "change_label": "▼ 0.62%", "rate_source": "KOREAEXIM", "cross_rate": false },
    { "currency_code": "CLP", "currency_name": "칠레 페소", "unit_multiplier": 100, "label": "CLP(100)/KRW", "rate": 154.3906, "change_amount": null, "change_rate": null, "change_label": "—", "rate_source": "CROSS_USD", "cross_rate": true }
  ]
}
```

- `ExchangeRateItem`/`ExchangeRateBoard` 타입(`api/types.ts`) 신규 — 기존 `NewsExchangeTicker`용
  `ExchangeRateItem`(Phase 11, `youngjin/2nd-demo-layout` 브랜치 계열)과는 **이름은 같지만 이
  브랜치엔 존재하지 않는 별개 타입**이다. 이 브랜치(`feat/public-tier`)는 Phase 11 이전
  시점에서 갈라져 그 타입이 없는 상태이므로 이번 이식이 신규 추가이며 충돌이 없다 — 다만 향후
  두 브랜치를 합칠 때는 두 `ExchangeRateItem` 스키마(필드 구성이 다름)를 어느 쪽으로 통일할지
  별도 조율이 필요하다(사전 조사에서 이미 확인된 충돌 지점).
- `ImportDependencyBreakdownItem.color`가 필수 → 선택(`?`)으로 완화되고 `country_code?`가
  추가됐다(실 API는 색을 안 내려주고 화면이 팔레트에서 채운다). `ImportDependencyData`에
  `base_date?`(원화 환산 기준 고시일) 추가. 기존 mock(6번 섹션의 `fetchImportDependency()`)은
  두 필드 다 없어도 되므로(선택 필드) 그대로 유지된다.
- `ImportDependencyPanel`(구매팀 대시보드와 공유하는 기존 컴포넌트)에 `blurred?: boolean` prop
  추가 — 비로그인 화면에서 값을 흐리게 가리는 시각적 장치일 뿐 보안 장치는 아니다(현재
  `PublicDashboardPage.tsx`는 검증 편의상 `blurred`를 꺼둔 상태).
- `MaterialPriceTrendCard`(신규 컴포넌트, `features/public/components/`) — 공개 대시보드
  전용 축약형 가격 카드. 구매팀 화면의 `MaterialPriceDetail`(필터·요약카드 포함)과 달리 조작
  요소가 없다. 표시 자재는 `TREND_CARD_MATERIAL`(코발트) 고정, 데이터에 없으면 첫 자재로
  대체한다.

> **정정(2026-08-03, 9번 섹션 작업 중 발견)**: 위 `MaterialPriceTrendCard`와 `ExchangeRateBand`
> 컴포넌트는 **삭제됐다**(잘못된 브랜치 `origin/minji` 기준으로 만들어진 산출물 — 아래 9번
> 섹션 참고). `ExchangeRateItem`/`ExchangeRateBoard` 타입과 `fetchExchangeRates()`/
> `fetchPublicExchangeRates()` 함수 자체는 계속 쓰인다(tier1 `PurchasingDashboardHeader`의
> 기준일 표시, `LiveNewsMarquee`의 환율 칩이 대신 소비). `ImportDependencyPanel`의
> `blurred?`/`base_date?` 확장, `ImportDependencyBreakdownItem.color` 선택화는 그대로 유효하다
> (9번 섹션의 `ImportDependencyRow`가 여전히 재사용).

## 8. 비로그인 — 구매팀 1계층 사이드바 하위 화면 4개 이식 (minji 이식, 2026-08-03)

`origin/minji`의 `RiskMonitoringPage`/`MaterialRiskPage`/`ContractRagPage`/`AiBriefingPage`
(구매팀 1계층, `accessToken` 필수·mock 폴백 없음)를 `/public/*` 프리픽스로 이식하며 **방향을
바꿨다** — 사용자 결정(2026-08-03, AskUserQuestion): "완전 공개 + mock 폴백 신규 작성".
minji 원본은 로그인이 없으면 화면이 비어 있었지만(의도적 설계 — "지어낸 데이터를 못 보여준다"),
이 4개 화면(`Public` 접두 컴포넌트, `src/features/public/pages/`)은 `publicRiskMonitoring.api.ts`/
`publicMaterialRisk.api.ts`/`publicContractRag.api.ts`/`publicAiBriefing.api.ts`(신규, `src/api/`)가
①단계(mock)에서 로그인 여부와 무관하게 항상 데이터를 반환하도록 만들어 로그인 게이트
(`RequireAuth`) 없이 라우팅했다.

각 API 파일의 공통 분기 규칙:
- `!API_BASE_URL`(①단계): 항상 mock 반환.
- `API_BASE_URL` 있고 `accessToken` 없음(②/③단계, 비로그인 방문자): 이 4개 화면은 minji
  쪽에도 공개(비인증) 백엔드 엔드포인트가 없어(모두 `accessToken` 필수 컨트롤러) 실제로
  호출해도 401만 받는다 — 호출 자체를 생략하고 `LOGIN_REQUIRED_MESSAGE`("로그인 후 이용
  가능합니다.")를 던진다. 각 페이지의 기존 `listError`/`detailError` 표시 경로에 그대로
  나타난다(별도 UI 분기 추가하지 않음).
- `API_BASE_URL` 있고 `accessToken` 있음: minji 원본과 동일하게 `fetchWithAuth` 호출.

```json
// publicRiskMonitoring.api.ts — RiskMonitoringEvent 목록 mock 5건(요약)
// Figma "04 구매팀 · 리스크 이벤트"(2026-08-02) 그대로
[
  { "event_id": 1, "grade": "심각", "confidence_label": "확정", "material": "코발트", "country_name": "콩고민주공화국" },
  { "event_id": 2, "grade": "주의", "confidence_label": "참고", "material": "니켈", "country_name": "인도네시아" }
]
```

- `publicMaterialRisk.api.ts` — mock 자재 6종(Cobalt/Nickel/Lithium/Graphite/Manganese/Copper),
  Figma "05 구매팀 · 원자재 위험" 표 그대로. `MOCK_OVERVIEW.summary`의 `assessed_material_count:
  11`/`critical_count: 3`/`average_inventory_days: 15.8`도 Figma 예시 수치를 그대로 썼다 —
  실제 6종 mock 배열과 KPI 숫자가 정합하지 않는다(Figma 자체가 "11개 평가 자재 중 일부만
  화면에 나열"하는 전제라 우리도 동일하게 옮김).
- `publicContractRag.api.ts` — 계약 1건(CTR-010, Cobalt Sulfate Supply Agreement)과 조항
  검색 결과 3건(제7조/제4조/제5조), Figma "06 구매팀 · 계약 RAG" 그대로. 업로드
  (`uploadContractDocument`)·재처리(`reprocessContractDocuments`)는 mock 모드에서 실제 파일
  처리를 하지 않고 "계약서 업로드는 준비 중입니다." 에러를 던진다(CLAUDE.md placeholder 원칙,
  Seq 31 정식 업로드 UI와 별개 범위).
- `publicAiBriefing.api.ts` — 브리핑 상세 1건(`BRIEF-0001`, 코발트 공급사 납기 지연), Figma
  "07 구매팀 · AI 브리핑"(파일명은 "브리핑 상세 figma 2026-08-02.png"이나 내용은 "07 AI
  브리핑" — 파일명 표기 오류를 1단계 조사에서 발견, 별도 보고) 그대로.
- 신규 타입(`RiskMonitoringEvent`/`RiskMonitoringDetail`/`RiskExternalSignal`/
  `ProcurementRiskAssessment`, `MaterialRiskSummary`/`MaterialRiskItem`/`MaterialRiskDetail`/
  `MaterialPrimarySupplier`/`MaterialLinkedContract`/`MaterialRiskComponents`/
  `MaterialContractQuestion`, `ContractEvidenceItem`/`ContractEvidence`, `ContractSummary`/
  `ContractClauseHit`/`ContractClauseSearchResult`/`ContractDocument`/`ContractDetail`/
  `ContractUploadResult`/`ContractReprocessResult`/`ContractEvidenceRef`,
  `AiBriefingSource`/`AiBriefingContext`/`AiBriefingErpEvidence`/`AiBriefingStep`/
  `AiBriefingEvidenceChain`/`AiBriefingVerification`/`AiBriefingDetail`/`AiBriefingListItem`)는
  전부 minji 원본을 그대로 이식했다 — 순수 타입 정의라 이식 리스크가 낮다.
- `src/lib/publicNav.ts`(신규) — `PUBLIC_SIDE_NAV_ITEMS`. minji의 `purchasingNav.ts`
  (`/purchasing/*` 대상, 이 브랜치엔 없음)와 같은 패턴이나 `/public/*` 경로를 가리키고, 첫
  항목("대시보드")이 비로그인 공개 대시보드(`/`)로 돌아가는 링크라는 점이 다르다.
- **요구사항 매핑**: 이 4개 화면은 `docs/requirements-frontend.md`의 Seq 24(구매팀 1계층
  대시보드) 확장 화면이 비로그인에도 반영된 것이라, Seq 23(비로그인 공개 대시보드)의 직접
  대응 항목은 아니다 — `docs/requirements-frontend.md`에 각주로 남겨둔다.

> **정정 및 갱신(2026-08-03, 9번 섹션 작업)**: 위 4개 화면의 origin이 `origin/minji`(구버전)
> 였음이 밝혀져 `origin/minji-tier1-dashboard`(최신) 기준으로 다시 동기화했다. 추가 반영된
> 기능: `PublicRiskMonitoringPage`는 `?eventId=` URL 상태 복원 + `returnTo` 왕복 + 동적 버튼
> 라벨(`resolveAction`, 4가지 상태) + `hasSignalInputs` 예외 처리 + 자재별 세부 breakdown
> (`material_assessments`, 신규 타입 `MaterialAssessment`). `PublicMaterialRiskPage`는
> `forceRefresh` 새로고침 + `hasErpContext()` 정밀 판정 + ERP 경고 목록 + 계약 검토 필요 강조
> 스타일. `PublicContractRagPage`는 계약 선택 드롭다운이 상세 패널을 직접 여는 동작 +
> 파일 확장자/크기 검증(`stageFile`) — 그리고 tier1이 의도적으로 제거한 "근거로 사용하기"
> (evidence 담기, 판정에 반영되지 않는 오도 소지 기능)를 이 화면에서도 함께 뺐다. 이 화면의
> 업로드 UI(드롭존+"문서 재처리" 버튼)는 이제 `accessToken`이 있을 때만 노출하고, 없으면
> `LOGIN_REQUIRED_MESSAGE` 안내로 대체한다(검색·조회·상세는 비로그인도 그대로). 4개 화면
> 전부 `GlobalRiskBoardItem`에 `source_url?`/`collected_at?`, `NewsFeedItem`/`SelectedArticle`에
> `event_id?`, `AiBriefingListItem`에 `source_ref`, `AiBriefingContext`에 `latest_briefing_id`
> 필드가 새로 추가됐다(tier1 자체가 이 작업 진행 중에도 계속 갱신되고 있어 발견 시점에 함께
> 반영). 상세는 9번 섹션 참고.

## 9. 비로그인 대시보드 본문 12섹션 + 우측 DashboardSidePanel (tier1 이식, 2026-08-03)

`origin/minji-tier1-dashboard`의 구매팀 1계층 `PurchasingDashboardPage.tsx`(본문 12섹션 +
우측 `DashboardSidePanel`)를 비로그인 대시보드(`/`, `PublicDashboardPage.tsx`)에 그대로
복제했다 — 지난 `5bfd7db`(비로그인 4패널 2x2 그리드 + `ExchangeRateBand`/
`MaterialPriceTrendCard`)가 잘못된 브랜치(`origin/minji`, 구버전) 기준이었던 것을 대체한다.
`ExchangeRateBand`/`MaterialPriceTrendCard` 컴포넌트는 삭제했다(위 7번 섹션 정정 참고).

**본문 12섹션(순서 고정)**: `PurchasingDashboardHeader`(기준일) → `PurchasingKpiRow`(KPI
5칸) → `LiveNewsMarquee`(실시간 헤드라인+환율 칩) → `GlobalRiskBoard`(재사용, `onSelectItem`
콜백 신규 추가) → `LatestNewsPanel`(최신 뉴스 페이징) → `ImportDependencyRow`(재사용) →
`MaterialRiskSummaryTable`(원자재 7종 최종 합성 점수) → `MaterialRiskGaugeGrid`(신규, 게이지
7장 접기/펼치기) → `PublicMaterialRiskStatusPanel`/`PublicErpImpactPanel`/
`PublicPurchasePriorityPanel`(신규, 아래 참고) → `SupplierOverviewPanel`(공급사 현황).
> **정정(2026-08-04, 10번 섹션 1차 배치)**: 이 문단이 최초 작성될 당시엔
> `MaterialRiskOverviewSection`(게이지 3장+점수 카드 2장, 기존 재사용)이었으나, tier1이
> `309bd1c` 이후 이 컴포넌트를 완전히 삭제하고 `MaterialRiskGaugeGrid`(게이지 7장, 위 표와
> 같은 배열을 다르게 읽는 형태)로 대체했다 — 10번 섹션 참고. `MaterialRiskOverviewSection`
> 자체는 삭제하지 않고 그대로 남아있다(`/purchasing` 쪽 `PurchasingDashboardPage.tsx`의
> 유일한 소비처).

**데이터 원천 2갈래**:
- **공개 API 6종**(`public.api.ts`, 이미 존재) — `fetchPublicNewsFeed()`가 `limit`/`offset`
  파라미터를 받도록 확장됐고(마퀴 5건 + 페이징 목록 분리), `fetchPublicNewsFeedCount()`가
  신규 추가됐다(마지막 페이지 판정용).
- **인증 API**(신규 `src/api/publicPurchasingDashboard.api.ts` + 기존 `publicMaterialRisk`/
  `publicRiskMonitoring`/`publicAiBriefing.api.ts`) — KPI 요약·원자재별 리스크 점수·공급사
  현황 3종. tier1 원저자는 "이 화면 숫자는 우리 ERP·평가 결과라서 mock을 지어내면 안 된다"는
  원칙으로 mock 폴백을 두지 않았으나, 사용자 결정(2026-08-03)에 따라 `/public/*` 전체 원칙인
  "완전 공개 + mock 폴백"을 그대로 적용했다 — `publicPurchasingDashboard.api.ts`도 다른
  `/public/*` API와 동일한 3단계 분기(mock/로그인 필요/실 API)를 쓴다.

```json
// fetchPurchasingKpiSummary() — 완전 공개+mock, mock 임시값
{
  "assessed_category_count": 7, "critical_count": 2, "warning_count": 3, "normal_count": 2,
  "erp_exposure_score_avg": 58, "external_signal_score_avg": 52, "verified_briefing_count": 4,
  "latest_assessed_at": "2026-08-03T01:20:00Z",
  "critical_count_24h": 1, "warning_count_24h": 2,
  "erp_exposure_score_avg_24h": 55, "external_signal_score_avg_24h": 49, "mock": true
}

// fetchMaterialRiskSummary() — 7종 고정, mock 임시값(요약)
[
  { "material_category": "COBALT", "material_name": "코발트", "risk_score": 70, "risk_level": "CRITICAL", "top_news": [] },
  { "material_category": "GRAPHITE", "material_name": "흑연", "risk_score": null, "risk_level": null, "top_news": [] }
]

// fetchSupplierOverview() — mock 임시값
{
  "current": { "supplier_code": "SUP-0142", "supplier_name": "공급사A", "dependency_ratio": 62.3, "...": "..." },
  "alternatives": [{ "rank_position": 1, "supplier_code": "SUP-0201", "supplier_name": "공급사B", "...": "..." }]
}
```

**신규 컴포넌트(그대로 이식, `features/public/components/`)**: `PurchasingDashboardHeader`/
`PurchasingKpiRow`/`LiveNewsMarquee`/`LatestNewsPanel`/`MaterialRiskSummaryTable`/
`SupplierOverviewPanel`/`DashboardSidePanel`.

**Public 접두 신규 컴포넌트 3종**(`PublicMaterialRiskStatusPanel`/`PublicErpImpactPanel`/
`PublicPurchasePriorityPanel`) — tier1의 `MaterialRiskStatusPanel`/`ErpImpactPanel`/
`PurchasePriorityPanel`(`materials: MaterialRiskItem[]` prop 기반)을 이식했으나, 이 브랜치의
`features/purchasing/components/`에 **같은 이름·다른 prop**(`events` 배열 기반, Phase 4 MVP)
컴포넌트가 이미 있어 이름이 충돌한다 — 사용자 결정(2026-08-03)에 따라 `Public` 접두 신규
컴포넌트로 분리했다. 기존 `/purchasing` 쪽 컴포넌트·`PurchasingDashboardPage.tsx`는 건드리지
않았다.

**재사용(당시 기준, 수정 없음)**: `ImportDependencyRow`(단, 아래 breaking-change 흡수 참고).
> **정정(2026-08-04)**: `MaterialRiskOverviewSection`(tier1의 `toMaterialRiskGauges()`/
> `toScoreCards()` 출력 타입이 당시 기존 `MaterialRiskGaugeItem[]`/`ScoreCardItem[]`과 동일해
> "재사용, 수정 없음"으로 적었던 항목)은 10번 섹션 1차 배치에서 `MaterialRiskGaugeGrid`로
> 교체됐다 — 더 이상 이 화면의 재사용 대상이 아니다.

**`ImportDependencyRow.tsx`(기존 파일) 수정** — 계획 단계에서는 "수정 불필요"로 잘못 판단했으나
(0단계 조사 오류), tier1이 `period`/`onPeriodChange`를 필수 외부 prop으로 요구해 구현 중 발견해
수정했다. 두 prop을 **선택적**으로 바꾸고, 넘기지 않으면 기존처럼 내부 `useState`로 스스로
채운다(비제어형, 기존 `/purchasing` 호출부 무수정 유지) — 넘기면 페이지가 소유한 상태를
그대로 쓴다(제어형, 이 화면). `ScoreCardItem.grade`도 tier1 기준으로 필수→선택 완화했고,
이를 렌더하는 `ScoreCardPanel.tsx`도 `grade`가 없을 때 배지를 생략하도록 조건부 렌더로
바꿨다(`/planning`·`/executive` 등 다른 소비처에 영향 없음, 기존 mock은 `grade`를 계속 채워
보낸다). **이 단락(`ScoreCardItem`/`ScoreCardPanel.tsx` 부분)도 10번 섹션 1차 배치 시점엔
이미 이 화면의 소비 경로에서 빠졌다** — `ScoreCardPanel.tsx`/`ScoreCardItem` 타입 자체는
`/purchasing`이 계속 쓰므로 삭제하지 않고 남아있다.

**`GlobalRiskBoard.tsx`(공유 위젯) 수정** — `onSelectItem?: (item: GlobalRiskBoardItem) => void`
선택적 prop 신규 추가. 넘기면 마커 클릭 시 카드 내부 상세 패널이 자동으로 펼쳐지지 않고
콜백만 호출한다(우측 `DashboardSidePanel`의 "뉴스 상세" 탭이 대신 그 이벤트를 보여주기
위함) — 넘기지 않는 기존 소비처(공개 대시보드가 쓰던 이전 로직, `/purchasing`의 향후 사용
등)는 카드 내부 패널이 그대로 열린다. tier1 자체는 지도 마커 클러스터링·`detailPlacement`
등을 포함한 더 큰 폭의 리뉴얼(359→451줄)을 거쳤으나, 이번 작업 범위는 `onSelectItem` 배선만
최소 반영했다 — 나머지 리뉴얼은 별도 검토 대상(문서화하지 않은 남은 격차).

**lib 헬퍼 4종(신규, tier1 그대로 이식)**: `dashboardAlerts.ts`(`buildDashboardAlerts` — 뉴스
심각·주의 + 가격 변동성 정보를 우측 "주요 알림"으로 병합), `selectedArticle.ts`
(`fromNewsFeedItem`/`fromRiskBoardItem` — 뉴스·지도 마커를 공통 `SelectedArticle`로 변환),
`newsEventRef.ts`(`toNewsEventRef` — `event_id`→`RAW-{id}`→분석 UUID 순으로 브리핑 `ref` 생성),
`formatCollectedAt.ts`(수집 시각 `MM-DD HH:mm` 24시간 표기).

## 10. 구매팀 대시보드 tier1 재동기화 1차 배치 — 게이지·로딩 자리표시자 (2026-08-04)

9번 섹션 이식 기준점(`origin/minji-tier1-dashboard` `309bd1c`) 이후 그 브랜치에 27개 커밋이
추가로 쌓였다(`git fetch` 확인, HEAD `c2dbe67`). 이 27개 커밋을 A~I로 분류해 여러 배치로
나눠 반영하기로 했고(사용자 결정, 2026-08-04), 이번은 그중 1차 배치(A+B+C+E, 소규모
prop patch + 게이지 컴포넌트 교체 + 신규 `Skeleton` 공용 컴포넌트 + 로딩 상태 배선)다.

**B. `MaterialRiskGaugeGrid` 신규 이식** — tier1이 `309bd1c` 이후 `MaterialRiskOverviewSection`/
`MaterialRiskOverviewRow`/`MaterialRiskSummaryCard`/`ScoreCardPanel`을 완전히 삭제하고
`MaterialRiskGaugeGrid`(위 `MaterialRiskSummaryTable`과 **같은 배열**을 받아 7종을 게이지로
다시 그리는 컴포넌트, 기본 접힘)로 대체했다 — tier1 주석: "게이지가 ERP 자재 단위라 대분류
단위인 표와 자재 구성이 어긋났고, 상위 3개만 보여줘 나머지는 사라졌으며, 하드코딩
placeholder 6종이 실데이터와 섞여 있었다." **이 저장소에서는 해당 4개 파일을 삭제하지
않았다** — `grep` 확인 결과 `/purchasing`(구매팀 담당자 별도 진행 범위)의
`PurchasingDashboardPage.tsx`가 여전히 `MaterialRiskOverviewSection`을 import·사용 중이라,
tier1처럼 삭제하면 그 화면이 깨진다. 대신 이 비로그인 대시보드(`PublicDashboardPage.tsx`)
만 `MaterialRiskGaugeGrid`(신규, `features/public/components/`)로 전환하고
기존 4개 파일(`MaterialRiskOverviewSection`/`MaterialRiskOverviewRow`/
`MaterialRiskSummaryCard`/`ScoreCardPanel`, 전부 `features/purchasing/components/`)은
그대로 남겨 `/purchasing`이 계속 쓰게 했다 — Phase 12부터 유지해 온 "`/purchasing` 쪽 파일은
건드리지 않는다" 경계와 일관. `publicPurchasingDashboard.api.ts`의 `toMaterialRiskGauges`/
`toScoreCards`(이 화면 전용 API 파일)는 다른 소비처가 없어 함께 제거했다 — `/purchasing`이
쓰는 동명 함수는 별도 파일(`purchasingDashboard.api.ts`)이라 무관하다.

**A. 소규모 patch(prop 추가, 7개 컴포넌트)** — `PurchasingKpiRow`(`isLoading` prop + 라벨
"심각"/"주의"→"심각 원자재"/"주의 원자재" 정정, 24시간 줄 단위 분리 `종`↔`건`),
`LatestNewsPanel`(`isLoading`), `MaterialRiskSummaryTable`(`isLoading`),
`SupplierOverviewPanel`(`isLoading`), `ImportDependencyRow`+`MaterialPriceDetail`(공유 위젯,
`isPriceLoading`/`isLoading` — 둘 다 선택적 prop이라 `/purchasing` 호출부는 무수정),
`PublicErpImpactPanel`(데이터 품질 라벨·색 등급을 신규 공용 모듈 `lib/dataQuality.ts`로
추출 — 원자재 위험 화면과 같은 코드를 같은 말로 부르기 위함, tier1의 `9ff7e02` 대응),
`PublicPurchasePriorityPanel`(`isLoading` + **평가 불가 자재를 순위에서 빼고 목록 아래 별도
영역으로**, tier1 `2d4f431` 대응 — `toPurchasePriority()`가 `MaterialRiskItem[]`이 아니라
`{ ranked, unavailable }`를 돌려주도록 반환 타입이 바뀌었다. 예전에는 평가 불가를 심각과
주의 사이(2.5)에 끼워 순위표에 함께 나열했는데, 그러면 "2위"라는 숫자가 "두 번째로
위험하다"와 "확인이 안 됐다" 두 뜻을 갖게 돼 오독 소지가 있었다).

**C. `Skeleton`/`SkeletonText` 신규 공용 컴포넌트**(`components/ui/Skeleton/`) — 위 A의
`isLoading` prop들이 공통으로 쓰는 로딩 자리표시자. tier1 그대로 이식. `AcknowledgedPanel`/
`SidePanelToggleButton`(tier1 27커밋 중 다른 항목이 쓰는 신규 컴포넌트)은 이번 배치에서
같이 가져오지 않았다 — 아직 배선할 소비처가 없는 상태로 미리 만들어두면 diff 추적이
흐려진다는 판단(사용자 결정), 각각 후속 배치(F/D)에서 이식 예정.

**E. `PublicDashboardPage.tsx` 로딩 상태 배선** — tier1과 같은 패턴: 패널마다 별도
`useState`(`newsLoading`/`priceLoading`/`kpiLoading`/`materialRiskLoading`/`supplierLoading`/
`materialsLoading`)를 두고, 재조회를 트리거하는 effect 시작 시점에 해당 로딩을 다시
`true`로 켠 뒤(재조회 시에도 자리표시자가 다시 뜨도록) 조회가 끝나면 `.finally`로 끈다.
전역 로딩 플래그 하나로 묶지 않는 이유는 조회가 서로 다른 시점에 끝나기 때문 — 이미 도착한
패널까지 가장 느린 응답을 기다리며 자리표시자로 붙잡아 두지 않기 위함이다. 알림(모니터링
이벤트)·브리핑 로딩은 우측 `DashboardSidePanel` 탭 스켈레톤과 함께 다음 배치(D)에서 배선한다.

**아직 반영하지 않은 나머지 커밋(F/G/H, 후속 배치)**: "완료 처리 항목" 되돌리기
`AcknowledgedPanel`(F), `AiBriefingPage`/`ContractRagPage`/`MaterialRiskPage`/
`RiskMonitoringPage`의 필터·페이징·PDF 다운로드 등 추가 기능(H, `fetchRecentAiBriefings`
페이징 계약 브레이킹 체인지 포함), 데이터 관리 화면(`DataManagementPage`) 신규 이식(G,
`PublicDataManagementPage`로 포함 예정). D는 아래 참고.

### D. 알림 패널/사이드패널 갱신 — 2차 배치 (2026-08-04)

`AlertsBellButton`을 "토글"에서 "열기 전용"으로 바꾸고, 접기/펼치기를 패널 가장자리의
신규 `SidePanelToggleButton`으로 분리하는 tier1 UX 변경을 반영했다.

- **`AlertsBellButton`(공유, `components/layout/`) — tier1과 달리 두 모드를 동시 지원**.
  tier1은 `expanded`/`onToggle`을 완전히 제거하고 `onOpenAlerts`로 교체했지만, `grep` 확인
  결과 `/purchasing`의 `PurchasingDashboardPage.tsx`(75·119·122번째 줄)가 지금도 옛
  `expanded`/`onToggle` 계약으로 이 컴포넌트를 쓰고 있어 그대로 옮기면 컴파일이 깨진다.
  대신 `onOpenAlerts?`를 선택적으로 추가하고, 있으면 열기 전용(tier1 스타일 `aria-label`,
  `aria-expanded` 미부여), 없으면 기존 토글 동작(기존 `aria-label`/`aria-expanded`)으로
  내부 분기했다 — `ImportDependencyRow`/`MaterialPriceDetail`/`GlobalRiskBoard`(1차 배치·
  Phase 12)와 같은 "선택적 prop으로 두 소비처 동시 지원" 패턴.
- **`AlertsPanelContext.ts`/`AlertsPanelProvider.tsx` — tier1 그대로(순수 additive)**.
  `open: () => void`(접혀 있으면 펴고, 이미 펴져 있으면 아무 일도 안 함) 추가. `toggle`은
  그대로 남아있어 `/purchasing`은 무수정.
- **`SidePanelToggleButton`(신규, `components/layout/`)** — 좌측 `SideNavToggleButton`과
  같은 위치 성격이나 배치 방식은 다름(`position: fixed`로 패널 위에 얹어 페이지 섹션 점과
  패널이 예전처럼 맞붙게 함). `useAlertsPanelState()`의 `expanded`/`toggle`만 쓰므로
  `/purchasing`과 무관하게 독립 동작.
- **`tokens.css`** — `--side-panel-width: 320px` 신규 토큰. `DashboardSidePanel.module.css`의
  두 `320px` 리터럴을 이 토큰으로 교체해 `SidePanelToggleButton`이 패널 펼침 상태에서
  가장자리를 따라가게 함.
- **`DashboardSidePanel.tsx`** — `isNewsLoading?`/`isAlertsLoading?`/`isBriefingsLoading?`
  prop 추가(탭별 `Skeleton`/`SkeletonText` 자리표시자, 뉴스 상세는 `isNewsLoading &&
  !selectedNews`일 때만), `focusAlertsToken?: number`(벨 클릭마다 증가, 오르면 "주요 알림"
  탭으로 전환), `selectedNews` 참조 변경 시 "뉴스 상세" 탭 자동 복귀 effect. `UploadCard`는
  손대지 않았다 — 이미 Phase 12부터 "RAG는 `/public/contract-rag`, ERP는 비활성
  placeholder" 상태였고 tier1의 `data-management` 통합 링크로 바뀐 적이 없어 되돌릴 것도
  없었다(G 배치에서 데이터 관리 화면이 생기면 그때 전환).
- **`PublicDashboardPage.tsx`** — `useAlertsPanelState()`의 `toggle`→`open` 전환,
  `handleOpenAlerts`(패널 열기+`alertsFocusToken` 증가+미리보기 닫기)와
  `handleSelectArticle`(기사 선택+패널 열기, `GlobalRiskBoard`/`LatestNewsPanel`의
  `onSelect`가 호출) 신규, `<SidePanelToggleButton />` 배치, `alertsLoading`/
  `briefingsLoading` state 신규 추가(1차 배치에서 이연했던 부분, 같은 재점화+`.finally`
  패턴)해 `DashboardSidePanel`에 배선.
- `DashboardSidePanel.tsx`의 신규 `useEffect` 2건에서도 1차 배치와 동일하게
  `react-hooks/set-state-in-effect` 2건이 걸려 `eslint-disable-next-line`으로 처리했다 —
  tier1 원본(`DashboardSidePanel.tsx:292`·`:305`, `origin/minji-tier1-dashboard` 기준)에도
  같은 패턴이 있고 로컬 재현으로 동일하게 lint 에러가 남을 확인했다(1차 배치 조사 때와
  같은 결론).

### F. "완료 처리 항목" 되돌리기 — 3차 배치 (2026-08-04)

`MaterialRiskSummaryTable`에서 "대응 완료"로 내린 평가를 되돌릴 수 있는 `AcknowledgedPanel`을
배선했다.

- **`api/types.ts`**: `AcknowledgedItem` 신규(tier1 그대로) — `assessment_id`/
  `material_category`/`material_name`/`procurement_risk_level`/`procurement_risk_score`/
  `subject_title: string | null`/`acknowledged_by_name: string | null`/`acknowledged_at`.
- **`publicPurchasingDashboard.api.ts` — tier1과 달리 3분기를 새로 설계**: tier1의
  `acknowledgeAssessment`/`unacknowledgeAssessment`/`fetchAcknowledgedAssessments`는
  `accessToken: string`(nullable 아님)만 받고 mock/비로그인 분기가 아예 없다(로그인 필수
  화면이라 그럴 필요가 없었음). `unacknowledgeAssessment`는 이미 이 파일에 있던
  `acknowledgeAssessment`(①단계 무동작 반환/②비로그인 `LOGIN_REQUIRED_MESSAGE`/②로그인
  `fetchWithAuth`)와 대칭으로 같은 3분기를 새로 설계해 적용했다 — 확인 모달이 없는 tier1
  UX(버튼 클릭 시 즉시 실행, "되돌리는 중…" 표시만 있고 별도 대화상자 없음, 코드 확인
  완료)라 클라이언트 쪽에 새 UI를 추가하지 않았다. `fetchAcknowledgedAssessments`(읽기
  액션)는 다른 5개 API 파일과 같은 표준 3분기를 따르되, **①단계 mock은 빈 배열
  `MOCK_ACKNOWLEDGED = []`**로 정했다 — `acknowledgeAssessment`의 ①단계가 애초에 아무
  것도 하지 않아 mock 모드에서는 어떤 평가도 실제로 "완료 처리"되지 않으므로, 되돌릴
  목업 항목을 지어내면 "누른 적 없는데 이미 완료 처리된 항목이 있다"는 앞뒤가 안 맞는
  상태가 된다.
- **`AcknowledgedPanel.tsx`(+`.module.css`, 신규, `features/public/components/`)**: tier1
  그대로 이식. `ScrollCard`+`SkeletonText`(둘 다 기존 재사용) 기반.
- **`PublicDashboardPage.tsx`**: `acknowledged`/`acknowledgedLoading` state 신규, 기존
  KPI/원자재리스크/공급사/자재 조회 effect(`[accessToken, reloadKey]`, 1차 배치 E가 만든 것)에
  `fetchAcknowledgedAssessments` 호출을 합류시켰다 — tier1도 같은 effect 안에 나란히 두고
  같은 `reloadKey`로 함께 다시 부르므로 **별도 트리거를 새로 만들지 않았다**.
  `handleUndoAcknowledge`(tier1 그대로: `unacknowledgeAssessment` 호출 성공 시
  `setReloadKey` 증가, 기존 `handleAcknowledge`("대응 완료")가 쓰는 `pendingAssessmentId`
  state를 그대로 공유) 신규, `<MaterialRiskGaugeGrid>` 바로 아래에 `<AcknowledgedPanel>`
  배치(tier1과 같은 위치). `SECTION_DOTS_SECTIONS`는 tier1도 이 패널을 별도 도트 섹션으로
  두지 않아 무수정.
- **`AcknowledgedPanel`의 `/purchasing` 사용 여부**: 없음(`grep` 0건) — "대응 완료" 개념
  자체가 tier1발 신규 기능이라 옛 `/purchasing` 화면에는 애초에 대응되는 기능이 없었다.
  B/D 배치와 달리 하위호환 충돌 여지가 구조적으로 없다.
- 검증: `npm run typecheck`/`lint`/`build` 통과, Playwright 9/9 PASS(mock 모드에서 항상
  빈 목록 안내 표시, "대응 완료" 클릭 후에도 mock의 `acknowledgeAssessment` 자체가 무동작
  이라 계속 비어있음, `/purchasing`엔 이 패널이 없음), `git diff --stat --
  src/features/purchasing/` 완전히 빈 결과.

**여전히 반영하지 않은 것**: G(데이터 관리 화면)/H(4화면 추가 기능).

## 임시 mock 값 (후속 정리 필요)

Phase 9.3(원자재 가격 추이 "상세보기", surin `RiskMonitoring.tsx` 시각 이식)에서 시각 구성을 우선하기 위해 실제 계산 로직 없이 하드코딩한 필드 목록. 각 필드는 코드에도 `// mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요` 주석이 달려 있다. 앞으로도 실제 계산 로직 없이 mock 값으로 구현하는 필드가 생기면, 이 섹션에 반드시 등재하고 코드에도 `// mock 임시값 — 실제 계산 로직 미구현, 후속 검증 필요` 주석을 남긴다.

| 필드 | 위치 | 쓰이는 곳 | 왜 임시값인가 |
|---|---|---|---|
| `MaterialPriceSummary.change_label` | `api/types.ts`, `api/purchasing.api.ts`의 `fetchMaterialPriceSummaries()`(Phase 9.4에서 `public.api.ts`→`purchasing.api.ts`로 이동, `public.api.ts`는 재수출만) | `components/widgets/MaterialPriceDetail.tsx`(Phase 9.4에서 `features/public/components/`→`components/widgets/`로 승격) 요약 카드 | `MaterialPriceSeries`의 실제 등락률을 계산하지 않고 surin 화면과 비슷한 톤의 값을 직접 지정했다. 가격(`price_index`)만 `MaterialPriceSeries` 마지막 포인트에서 실제로 유도해 항상 일치한다 — 등락률은 그 값과 무관하다. |
| `MaterialPriceSummary.risk_score` | 〃 | 〃 | `risk_event`의 등급·신뢰도와 연결된 계산이 아니라 surin `monitoringPrices`의 점수를 참고해 임의로 지정한 값이다. |
| `MaterialPriceSummary.grade` | 〃 | 〃 | 같은 자재의 실제 `risk_event.grade` 집계(예: 최고 심각도)가 아니라 화면 구성을 위해 직접 지정했다. `RiskGradeBadge` 표시 자체는 기존 컴포넌트를 그대로 재사용한다. |
| 필터 드롭다운 선택값(원자재/국가·지역) | `MaterialPriceDetail.tsx` 내부 `useState` | 〃 | **(2026-08-03 갱신)** minji 이식으로 `MaterialPriceDetail`의 국가·지역 필터가 실동작(`countries` 응답 기반 AND 필터)으로 바뀌었다 — 단 구매팀 대시보드(`ImportDependencyRow.tsx`)가 넘기는 `purchasing.api.ts`의 mock `MaterialPriceSeries`에는 `countries` 필드가 없어 옵션이 "전체" 하나뿐이고 사실상 표시 전용으로 남는다. 반대로 비로그인 대시보드(`PublicDashboardPage.tsx`)는 ①단계에서도 GlobalRiskBoard mock 유래 5개국이 `countries`로 채워져 실제로 필터링된다(아래 `MaterialRiskGaugeItem` 행과 같은 "화면마다 다른 데이터 소스" 패턴). |
| 기간 버튼(1주/1개월/3개월/6개월/사용자 설정) | 〃 | 〃 | **(2026-08-03 갱신)** `period`/`onPeriodChange`가 필수 prop이 되며 minji 이식으로 실동작화됐다 — 비로그인 대시보드는 탭 클릭 시 `fetchPublicPriceTrends(days)`를 실제로 재조회한다. 구매팀 대시보드(`ImportDependencyRow.tsx`)는 여전히 `purchasing.api.ts`의 mock이 짧은 고정 시계열(7일치)뿐이라 탭 선택 상태만 바뀌고 데이터는 그대로다(재조회할 실 API가 없음, `ImportDependencyRow.tsx` 코드 주석 참고). |
| `MaterialRiskGaugeItem`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchMaterialRiskGauges()`(Phase 9.4, surin `materialRiskGauges` 이식) | `features/purchasing/components/MaterialRiskOverviewRow.tsx` 게이지 카드 3장 | surin 값을 그대로 가져왔다. 자재 구성이 리튬/니켈/**흑연**인데, 같은 페이지의 `risk_event` mock 6건(다른 패널이 쓰는 원천 데이터)에는 흑연이 없고 코발트가 있어 — 이 5칸 그리드만 다른 패널과 자재 구성이 어긋난다. `grade`도 surin 4단계를 3단계 `RiskGrade`로 매핑(경고→심각)한 값이라 실제 계산 로직은 없다. |
| `ScoreCardItem`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchScoreCards()`(Phase 9.4, surin `summaryScores` 이식) | `features/purchasing/components/MaterialRiskOverviewRow.tsx` 점수 카드 2장 | surin `summaryScores`(외부 리스크 종합 점수 72/ERP 영향 점수 65)를 그대로 가져왔다. `grade`도 surin 원본 문구("높음"/"주의")를 3단계 `RiskGrade`로 매핑(높음→심각)한 값이라 실제 계산 로직은 없다. |
| `ImportDependencyData`(전체 필드) | `api/types.ts`, `api/purchasing.api.ts`의 `fetchImportDependency()`(Phase 9.4, surin `importDependency` 이식) | `features/purchasing/components/ImportDependencyPanel.tsx` 도넛차트+범례 | `risk_event` 스키마에는 없는 개념(국가별 수입 비중)이라 surin 값을 그대로 가져왔다. 국가별 `color`(hex)도 surin 원본을 그대로 썼다. |
| `fetchExchangeRates()`(전체 필드) | `api/public.api.ts`(minji 이식, 2026-08-03) | `features/public/components/ExchangeRateBand.tsx` | 실 API(한국수출입은행 고시환율 + ExchangeRate-API 재정환율) 연동 전 mock. USD/EUR/CNH/CLP/JPY 5개 통화를 하드코딩했고 등락 수치도 임의값이다. |
| `publicRiskMonitoring.api.ts`의 `MOCK_EVENTS`/`MOCK_DETAILS`(전체 필드) | `api/publicRiskMonitoring.api.ts`(신규, 2026-08-03) | `features/public/pages/PublicRiskMonitoringPage.tsx` | Figma "04 구매팀 · 리스크 이벤트" 화면 예시 5건을 그대로 옮겼다. `external_signal`/`procurement_risk`는 event_id 1(코발트)에만 채웠고 나머지는 미분석 상태로 둔다. |
| `publicMaterialRisk.api.ts`의 `MOCK_MATERIALS`/`MOCK_OVERVIEW`/`MOCK_DETAILS`/`MOCK_CONTRACT_EVIDENCE`(전체 필드) | `api/publicMaterialRisk.api.ts`(신규, 2026-08-03) | `features/public/pages/PublicMaterialRiskPage.tsx` | Figma "05 구매팀 · 원자재 위험" 표 6종을 그대로 옮겼다. `MOCK_OVERVIEW.summary`의 KPI 4개(평가 자재 11/심각 3/평균 재고일수 15.8/VALID)는 Figma 예시 수치이며 실제 mock 배열(6종)과 집계가 맞지 않는다(위 8번 섹션 서술 참고). |
| `publicContractRag.api.ts`의 `MOCK_CONTRACT`/`MOCK_CONTRACT_DETAIL`/`MOCK_CLAUSE_HITS`(전체 필드) | `api/publicContractRag.api.ts`(신규, 2026-08-03) | `features/public/pages/PublicContractRagPage.tsx` | Figma "06 구매팀 · 계약 RAG" 화면 값을 그대로 옮겼다. 계약 1건(CTR-010)만 존재하는 닫힌 세계라, 검색창에 다른 문장을 넣어도 같은 3개 조항이 그대로 반환된다(실제 임베딩 유사도 계산 없음). |
| `publicAiBriefing.api.ts`의 `MOCK_DETAIL_BASE`/`MOCK_LIST_ITEM`(전체 필드) | `api/publicAiBriefing.api.ts`(신규, 2026-08-03) | `features/public/pages/PublicAiBriefingPage.tsx` | Figma "07 구매팀 · AI 브리핑" 화면 값을 그대로 옮겼다. `source`/`ref` 쿼리스트링이 달라도(NEWS/MATERIAL/CONTRACT 어느 경로든) 같은 브리핑 본문을 반환한다 — 실제 멀티에이전트 판단이 아니다. |
| `publicPurchasingDashboard.api.ts`의 `MOCK_KPI_SUMMARY`/`MOCK_MATERIAL_RISK_SUMMARY`/`MOCK_SUPPLIER_OVERVIEW`(전체 필드) | `api/publicPurchasingDashboard.api.ts`(신규, 2026-08-03, 9번 섹션) | `features/public/pages/PublicDashboardPage.tsx`(`PurchasingKpiRow`/`MaterialRiskSummaryTable`/`SupplierOverviewPanel`) | tier1 원저자는 이 3종 API를 "우리 ERP·평가 결과라서 mock 금지" 원칙으로 mock 폴백 없이 설계했으나, 사용자 결정(2026-08-03)에 따라 `/public/*` 공통 원칙("완전 공개 + mock 폴백")을 그대로 적용해 임의 mock 값을 새로 작성했다 — Figma 근거 없이 구성한 값이다. |

## 확장 원칙
- 새 화면·지표가 추가되면 기존 필드를 변경하지 말고 옆에 새 필드를 추가한다 (breaking change 최소화).
- 계층 간 동일 개념(리스크 등급, 신뢰도 라벨, 사업부명)은 항상 동일한 값 집합·필드명을 재사용한다.
