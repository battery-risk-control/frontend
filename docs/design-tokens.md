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
}
```

## 주의
- 신뢰도 라벨 색상(`--color-confidence-*`)과 리스크 등급 색상(`--color-risk-*`)은 서로 다른 축이다. 화면에 함께 쓰일 때 혼동되지 않도록 컴포넌트명도 구분한다 (`ConfidenceBadge` vs `RiskGradeBadge`).
- spacing/radius는 근거 자료가 없어 업계 관례로 채운 값이다. 실제 Figma 고해상도 스타일 가이드 프레임을 열람할 수 있게 되면(Figma 커넥터 연결 시) 가장 먼저 교체해야 한다.
