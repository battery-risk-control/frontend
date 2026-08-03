/**
 * ERP 데이터 품질 코드의 한글 표기와 색 등급. 원자재 위험 화면(KPI 카드)과 대시보드
 * ERP 영향 패널이 같은 코드를 쓰므로 한곳에 둔다 — 따로 두면 한 화면은 '일부 누락',
 * 다른 화면은 `INCOMPLETE`로 부르게 된다.
 *
 * 코드는 백엔드 `MaterialRiskService.DATA_QUALITY_RANK`가 매기는 순서
 * (`VALID < STALE < INCOMPLETE < INVALID < UNKNOWN`)와 같다. 요약 KPI는 자재별 값 중
 * **가장 나쁜 것**이라, 자재 하나만 결측이어도 카드는 그 자재를 가리킨다.
 *
 * 공급사의 IATF16949·PPAP 인증 여부를 뜻하던 예전 mock `quality_check`와는 다른 값이다.
 * 이건 점수 계산에 쓴 ERP 데이터가 쓸 만한지를 말한다.
 */
const DATA_QUALITY_LABEL: Record<string, string> = {
  VALID: '정상',
  STALE: '오래된 스냅샷',
  INCOMPLETE: '일부 누락',
  INVALID: '사용 불가',
  UNKNOWN: '확인 불가',
}

/** 모르는 코드는 원문 그대로 — 임의로 '정상'에 몰아넣으면 새 코드가 조용히 묻힌다. */
export function dataQualityLabel(status: string): string {
  return DATA_QUALITY_LABEL[status] ?? status
}

/**
 * 색 등급. VALID만 정상이고 나머지는 눈에 띄어야 한다 — 숫자를 믿어도 되는지가 걸린 값이라
 * '일부 누락'이 정상과 같은 색으로 나가면 사용자가 그냥 지나친다.
 */
export function dataQualityTone(status: string): 'normal' | 'warning' | 'critical' | 'neutral' {
  if (status === 'VALID') return 'normal'
  if (status === 'INVALID') return 'critical'
  if (status === 'UNKNOWN') return 'neutral'
  return 'warning'
}
