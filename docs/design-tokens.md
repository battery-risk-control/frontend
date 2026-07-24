# 디자인 토큰 (확정 — 근거 기반 추출)

## 근거

1. **색상**: `ui-demo-image` 9장 전체를 colorthief로 대표색 추출(이미지당 상위 5색). 배경(연회색)·네이비·빨강·주황·청록이 9장 모두에서 공통으로 반복됨 — 우연이 아니라 의도된 팔레트로 판단.
2. **폰트**: 첨부된 `UIUX_가이드라인_배포용.pdf` 78페이지 원칙 — "중앙행정기관 사이트에서는 기본 글꼴로 국문과 영문 모두 **Pretendard GOV**를 사용한다." AIVLE 개발권고사항 범위이므로 그대로 채택.
3. **리스크 등급 색상 매핑**: 추출된 빨강/주황/청록 3색을 실무에서 널리 쓰이는 신호등(traffic-light) 관례(정상=녹색계열/주의=주황/심각=빨강)에 맞춰 배정. 데모 이미지의 실제 색상과 방향이 일치함.
4. **spacing/radius**: 데모 이미지에서 픽셀 단위로 정확히 읽어낼 수 없어, 업계에서 흔히 쓰는 4px 배수 스케일을 기본값으로 채택 — 확정 아님, 실제 개발 중 조정 가능.

## `src/styles/tokens.css`

```css
:root {
  /* Brand / Neutral */
  --color-bg: #F1F1F3;              /* 데모 이미지 공통 배경 */
  --color-surface: #FFFFFF;
  --color-primary: #17345C;         /* 데모 이미지 공통 네이비 — 헤더/사이드바/주요 텍스트 */
  --color-primary-alt: #0D4D5D;     /* 네이비 보조안(짙은 틸) — 필요 시 다크 섹션용 */
  --color-text: #1A1A1A;
  --color-text-muted: #6B7280;
  --color-border: #E2E4E8;

  /* 리스크 등급 (Seq 20 신뢰도 라벨과는 별개 — 등급 색상) */
  --color-risk-critical: #D93A3F;   /* 심각 */
  --color-risk-warning: #F0933F;    /* 주의 */
  --color-risk-normal: #2AAE8A;     /* 정상 */

  /* 신뢰도 라벨 (확정/참고/경고) */
  --color-confidence-confirmed: #17345C;  /* 확정 — 브랜드 네이비, 가장 강한 신뢰 */
  --color-confidence-reference: #2AB7C4;  /* 참고 — 청록, 중립적 정보 */
  --color-confidence-warning: #F0933F;    /* 경고 — 주의 색상과 통일 */

  /* Typography */
  --font-family-base: 'Pretendard GOV', 'Pretendard', -apple-system, 'Apple SD Gothic Neo', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;

  /* Spacing (4px 배수, 업계 관례 — 미확정) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;

  /* Motion */
  --transition-fast: 0.2s;
}
```

## 주의
- 신뢰도 라벨 색상(`--color-confidence-*`)과 리스크 등급 색상(`--color-risk-*`)은 서로 다른 축이다. 화면에 함께 쓰일 때 혼동되지 않도록 컴포넌트명도 구분한다 (`ConfidenceBadge` vs `RiskGradeBadge`).
- spacing/radius는 근거 자료가 없어 업계 관례로 채운 값이다. 실제 Figma 고해상도 스타일 가이드 프레임을 열람할 수 있게 되면(Figma 커넥터 연결 시) 가장 먼저 교체해야 한다.
- GlobalRiskBoard 지도 마커(Leaflet SVG 렌더러)는 CSS 변수를 읽지 못해 리스크 등급 색상을 hex로 리터럴 미러링함 — 이 문서의 리스크 색상 토큰이 바뀌면 GlobalRiskBoard.tsx의 하드코딩된 값도 함께 갱신해야 함.

## 카드 레이아웃·스크롤 규칙

각 카드(영역)는 정확히 하나의 스크롤 컨테이너만 갖는다. 그 안의 구조적 하위그룹은 별도 스크롤을 갖지 않고, 개별 요소(리스트 행 등)가 넘칠 때만 "더보기"(`...` 또는 아이콘, 본문을 과도하게 가리지 않는 형태)로 펼친다. 1차 개요에 필요한 정보를 더보기 뒤에 숨기지 않는다(빠른 개요 파악 우선). ScrollCard 공용 컴포넌트가 이 규칙을 구조적으로 보장한다(소급 문서화: 현재 `ScrollCard`가 이 규칙을 구조적으로 보장함 — `.body` 하나에만 `overflow-y:auto`가 걸리고, 그 안의 하위 요소는 별도 스크롤 컨테이너를 갖지 않는다).

### a) ScrollHint vs ScrollCard 내부 오버플로 신호 — 적용 범위 구분

이름이 비슷한 두 컴포넌트가 서로 다른 문제를 다룬다 — 혼동하지 않도록 표로 구분한다.

| | `ScrollHint`(`components/ui/ScrollHint`) | `ScrollCard` 내부 오버플로 신호 |
|---|---|---|
| 대상 | 페이지 레벨 그리드(예: 비로그인 공개 대시보드 2x2→1열) | 카드 레벨(`ScrollCard`의 `.body`) |
| 감지 방식 | `targetId`로 지정한 요소를 `IntersectionObserver`로 관찰 | `.body`의 scroll 이벤트 + `ResizeObserver`로 실제 오버플로·스크롤 위치 감지 |
| 트리거 조건 | 지정 대상(보통 마지막 카드)이 아직 뷰포트에 안 보일 때 | `scrollable`이 `true`이고, 본문이 실제로 넘치며 아직 끝까지 스크롤하지 않았을 때 |
| 적용 범위 | 사용하는 페이지가 직접 배치(현재 `PublicDashboardPage` 1곳) | `ScrollCard`를 쓰는 모든 카드에 자동 적용(화면별 추가 작업 불필요) |

### b) 카드 단일 스크롤 규칙(중첩 스크롤 금지)

위 본문 규칙 참고 — `ScrollCard`가 구조적으로 보장하므로, 신규 카드형 컴포넌트를 만들 때 `.body` 안에 또 다른 `overflow-y:auto` 컨테이너를 추가하지 않는다.

### c) 펼치기/접기는 애니메이션 기본 적용

모든 [펼치기/접기] 인터랙션(예: `MaterialRiskOverviewSection`의 "더보기", `GlobalRiskBoard`의 정보 패널 접기/펼치기)은 애니메이션을 기본 적용한다. 신규 라이브러리를 쓰지 않고 순수 CSS `max-height`+`opacity` transition을 쓴다(SideNav 접기의 `width` transition과 동일한 패턴을 높이 축으로 확장). duration은 `--transition-fast`(`0.2s`) 토큰을 공용으로 사용한다.

### d) 형제 카드/리스트 항목 4개 이상 시 overflow 처리 고려 대상

한 영역 안에 형제 카드 또는 리스트 항목이 4개 이상이면(예: 5칸 게이지 그리드) 스크롤(`ScrollCard` 기본값) 또는 "더보기"(Disclosure) 중 하나로 overflow를 처리하는 것을 고려 대상으로 삼는다 — 3개 이하는 대부분 화면에 한 번에 들어가 별도 처리가 불필요한 경우가 많다는 경험적 기준이며, 강제 규칙은 아니다.
