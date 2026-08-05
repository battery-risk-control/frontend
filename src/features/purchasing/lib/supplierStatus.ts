/**
 * ERP 공급사 상태 코드 → 화면 표기(한국어).
 *
 * 표에 없는 값은 코드를 그대로 보여준다(지어내지 않는다). 컴포넌트 파일이 아니라 여기 두는
 * 이유는 Fast Refresh 제약이다 — 컴포넌트 파일이 상수를 함께 내보내면 HMR이 깨진다.
 * `DataImportUploadPanel`·`SupplierOverviewPanel`이 공유한다.
 */
export const SUPPLIER_STATUS_LABEL: Record<string, string> = {
  ACTIVE: '거래중',
  APPROVED: '승인',
  REVIEW: '검토 필요',
  UNDER_REVIEW: '거래 자격 검토 중',
  SUSPENDED: '거래중지',
  BLOCKED: '거래불가',
}

/** 코드 → 한국어 라벨. 미매핑/빈 값이면 원문(빈 문자열)을 그대로 반환한다. */
export function supplierStatusLabel(status: string | null | undefined): string {
  if (!status) return ''
  return SUPPLIER_STATUS_LABEL[status] ?? status
}
