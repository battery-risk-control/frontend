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

  /* Layout */
  --header-height: 56px; /* Header.module.css .header의 height와 동일 — sticky 하위 요소(top 오프셋) 공용 참조 */
}
```

## 주의
- 신뢰도 라벨 색상(`--color-confidence-*`)과 리스크 등급 색상(`--color-risk-*`)은 서로 다른 축이다. 화면에 함께 쓰일 때 혼동되지 않도록 컴포넌트명도 구분한다 (`ConfidenceBadge` vs `RiskGradeBadge`).
- spacing/radius는 근거 자료가 없어 업계 관례로 채운 값이다. 실제 Figma 고해상도 스타일 가이드 프레임을 열람할 수 있게 되면(Figma 커넥터 연결 시) 가장 먼저 교체해야 한다.
- GlobalRiskBoard 지도 마커(Leaflet SVG 렌더러)는 CSS 변수를 읽지 못해 리스크 등급 색상을 hex로 리터럴 미러링함 — 이 문서의 리스크 색상 토큰이 바뀌면 GlobalRiskBoard.tsx의 하드코딩된 값도 함께 갱신해야 함.
- `--header-height`는 `Header`가 `position:sticky; top:0`으로 항상 뷰포트 상단에 고정되는 것과 겹치지 않도록, 마찬가지로 `position:sticky`인 하위 요소(`SideNav`/`AlertsPanel`/`PageSectionDots`의 `withAside` 레일)가 `top`/`height` 계산에 공통 참조하는 값이다. `Header.module.css`의 `.header{height:...}`가 바뀌면 이 토큰도 함께 갱신해야 한다(값이 어긋나면 sticky 요소가 Header 뒤로 가려지거나 그 아래 빈틈이 생김).

## 카드 레이아웃·스크롤 규칙

각 카드(영역)는 정확히 하나의 스크롤 컨테이너만 갖는다. 그 안의 구조적 하위그룹은 별도 스크롤을 갖지 않고, 개별 요소(리스트 행 등)가 넘칠 때만 "더보기"(`...` 또는 아이콘, 본문을 과도하게 가리지 않는 형태)로 펼친다. 1차 개요에 필요한 정보를 더보기 뒤에 숨기지 않는다(빠른 개요 파악 우선). ScrollCard 공용 컴포넌트가 이 규칙을 구조적으로 보장한다(소급 문서화: 현재 `ScrollCard`가 이 규칙을 구조적으로 보장함 — `.body` 하나에만 `overflow-y:auto`가 걸리고, 그 안의 하위 요소는 별도 스크롤 컨테이너를 갖지 않는다).

### a) 스크롤/내비게이션 신호 3갈래 — 적용 범위 구분

"더 볼 콘텐츠가 있다"를 알리거나 그리로 이동시키는 장치가 화면 레벨에 따라 3갈래로 나뉜다 — 이름이 비슷하거나 목적이 겹쳐 보일 수 있어 표로 구분한다.

| | 페이지 레벨 내비게이션 (`PageSectionDots`) | 페이지 레벨 콘텐츠 신호 (컷오프 기법) | 카드 레벨 오버플로 신호 (`useScrollOverflowHint`) |
|---|---|---|---|
| 대상 | 이름 붙은 섹션이 많은 화면(예: 구매팀 대시보드) | 섹션이 적고 간소한 화면(예: 비로그인 공개 대시보드) | 카드 레벨(`ScrollCard`의 `.body`, 또는 `SideNav`/`AlertsPanel`의 독립 스크롤 영역) |
| 구현 방식 | `components/ui/PageSectionDots` — 각 섹션 heading을 `IntersectionObserver`로 다중 관찰, 도트 클릭 시 `scrollIntoView` | `.page`를 `height:100vh; overflow-y:auto`로, 그리드 행을 `minmax(320px, auto)`로 둬 다음 행/카드가 하단에 자연스럽게 일부만 보이게 함(레이아웃만으로 구현, JS 없음) | `.body`의 scroll 이벤트 + `ResizeObserver`로 실제 오버플로·스크롤 위치 감지, 상/하단 그라데이션+화살표 힌트 |
| 트리거 조건 | 항상 표시, 현재 뷰포트에 보이는 섹션의 도트만 활성화 | 항상 표시(레이아웃 자체가 신호), 별도 표시/숨김 로직 없음 | 본문이 실제로 넘치고, 아직 끝(또는 처음)까지 스크롤하지 않았을 때만 표시 |
| 적용 범위 | 현재 구매팀 대시보드 1곳(`variant="withAside"`) — `variant="standalone"`은 아직 실사용처 없음 | 현재 비로그인 공개 대시보드 1곳 | `ScrollCard`를 쓰는 모든 카드 + `SideNav`/`AlertsPanel`에 자동 적용(화면별 추가 작업 불필요) |

**어떤 화면에 어느 걸 쓸지 판단 기준(현재 기준, 고정 공식 아님)**: 이름 붙은 독립 섹션이 8개 이상으로 많고 점프 이동이 유용한 화면 → `PageSectionDots`, 섹션이 3~4개 이하로 적고 구조가 간소한 화면 → 컷오프 기법, 카드 내부의 리스트/본문 하나가 자체적으로 넘치는 경우 → `useScrollOverflowHint`(`ScrollCard`가 이미 내장, `SideNav`/`AlertsPanel`처럼 카드가 아닌 곳은 직접 적용).

**폐기됨**: `ScrollHint`(`components/ui/ScrollHint`, `IntersectionObserver`로 그리드 마지막 카드 관찰) — 2026-07-26, 유일한 소비처였던 `PublicDashboardPage`가 컷오프 기법으로 전환하며 실사용처가 사라져 컴포넌트 자체를 삭제(`docs/design-candidates.md` "공개 대시보드 좁은 화면 콘텐츠 신호" 참고).

### b) 카드 단일 스크롤 규칙(중첩 스크롤 금지)

위 본문 규칙 참고 — `ScrollCard`가 구조적으로 보장하므로, 신규 카드형 컴포넌트를 만들 때 `.body` 안에 또 다른 `overflow-y:auto` 컨테이너를 추가하지 않는다.

### c) 펼치기/접기는 애니메이션 기본 적용

모든 [펼치기/접기] 인터랙션(예: `MaterialRiskOverviewSection`의 "더보기", `GlobalRiskBoard`의 정보 패널 접기/펼치기)은 애니메이션을 기본 적용한다. 신규 라이브러리를 쓰지 않고 순수 CSS `max-height`+`opacity` transition을 쓴다(SideNav 접기의 `width` transition과 동일한 패턴을 높이 축으로 확장). duration은 `--transition-fast`(`0.2s`) 토큰을 공용으로 사용한다.

### d) 형제 카드/리스트 항목 4개 초과 시 overflow 처리 기준

다음 기준으로 적용한다: 리스트 항목이 4개를 초과하면 4개가 보이는 높이로 `max-height`를 고정하고 `overflow-y: auto`로 5번째 항목부터 스크롤하게 한다(`ScrollCard`의 `maxBodyHeight` prop). 높이는 해당 화면의 실제 렌더링 결과를 실측해 정한다(고정 공식이 아님 — 항목당 내용 길이가 다르면 카드마다 다르게 측정). 5칸 게이지 그리드처럼 리스트가 아니라 그리드 형태인 경우는 스크롤 대신 "더보기"(Disclosure)로 처리한다(`MaterialRiskOverviewSection` 참고). 3개 이하는 대부분 화면에 한 번에 들어가 별도 처리가 불필요한 경우가 많다 — 단, 3개 이하라도 부모 폭이 좁아지는 상황(SideNav 펼침 등)에서는 줄바꿈 대신 가로 스크롤을 적용한다(`MaterialRiskOverviewSection`의 요약 행 참고, 실측으로 auto-fit grid가 부모 폭 축소 시 줄바꿈됨을 확인).

## 스크롤 UI 노출 원칙

**상위 원칙**: 스크롤바 숨김(`scrollbar-width:none`)+힌트 조합은 앱 뼈대(chrome, `SideNav`/`AlertsPanel`처럼 페이지 전환과 무관하게 항상 같은 자리를 차지하는 요소)에만 적용한다. 본문 콘텐츠는 네이티브 스크롤바를 노출한다.

본문 콘텐츠는 다시 두 하위 패턴으로 나뉘며, 서로 다른 규칙을 따른다:

- **카드 내부 리스트형**(b항목 — 원자재 공급사 리스크 현황 등): 카드 1장 안에 항목이 세로로 쌓이는 구조. `overflow-y`, 네이티브 스크롤바 노출, 휠 스크롤만으로 충분 — 별도 드래그 구현 불필요.
- **형제 카드 캐러셀형**(d항목 — 자재 카드 그리드 등): 카드 여러 장이 가로로 나열되는 구조. `overflow-x`, 네이티브 스크롤바 노출 + 드래그 이동(grab-to-scroll) 필수 — 가로 휠 지원이 기기마다 약해 드래그가 실질적 주 조작 수단이 되기 때문.
