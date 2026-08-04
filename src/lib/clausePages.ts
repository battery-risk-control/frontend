/**
 * 조항 검색 결과에 페이지 번호를 보여줄지 판단한다.
 *
 * **왜 조건부인가.** 페이지 번호는 원본 문서에서 오는데, 백엔드
 * (`fastapi-ai/app/services/document_service.py`의 `_extract_pages`)는 PDF일 때만 실제 페이지를
 * 매긴다. `.txt`·`.csv`는 페이지 개념이 없어 파일 전체를 1페이지로 처리한다.
 *
 * 지금 적재된 계약서(`data/RAG_DATA/erp_aligned`) 30개가 전부 `.txt`라, 모든 청크가
 * `page_number = 1`이다. 제1조부터 제27조까지가 한 페이지에 있을 리 없는데 화면은 전부
 * "p.1"로 나온다 — 자리만 차지하고 아무것도 알려주지 않는 상수다.
 *
 * 그렇다고 필드를 지울 수는 없다. PDF를 업로드하면(계약·RAG 화면 드롭존, 데이터 관리 화면)
 * 그때는 진짜 페이지가 붙어 "몇 쪽을 펴야 하는가"라는 실제 정보가 된다.
 *
 * 그래서 **응답 안에서 페이지가 갈릴 때만** 보여준다. txt 시드에서는 사라지고 여러 쪽짜리
 * PDF에서는 나온다. 검색 결과가 전부 1쪽인 PDF에서는 감춰지지만, 그 경우엔 페이지를 알려줘도
 * 어차피 고를 것이 없다.
 */
export function hasMeaningfulPageNumbers(pageNumbers: number[]): boolean {
  return pageNumbers.some((pageNumber) => pageNumber !== 1)
}
