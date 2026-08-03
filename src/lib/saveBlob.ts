/**
 * 서버가 내려준 파일을 사용자의 디스크로 저장한다.
 *
 * `<a download>`를 만들어 클릭하는 우회로를 쓰는 이유는, `window.open(url)`로는 브라우저가
 * PDF를 새 탭에서 열어 버려 "다운로드"가 되지 않기 때문이다. 파일명도 그 경로로는 지정할 수 없다.
 *
 * `revokeObjectURL`을 잊으면 받은 파일이 통째로 메모리에 남는다 — 수 MB짜리 보고서를 반복해서
 * 내려받는 화면이라 무시할 수 있는 크기가 아니다.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
