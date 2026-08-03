import { downloadWithAuth, fetchWithAuth, uploadWithAuth } from './http'
import type { DownloadedFile } from './http'
import type {
  ContractDocumentConfirmResult,
  ContractDocumentPreview,
  ContractUploadOptions,
  ErpImportCommitResult,
  ErpImportConstraints,
  ErpImportPreview,
} from './types'

/**
 * 1계층 구매팀 "데이터 관리" 화면 API 클라이언트.
 *
 * 두 모드 모두 **분석 → 반영** 2단계이고, 백엔드에 잡 ID나 스테이징 테이블이 없다. 그래서
 * 반영 호출에 같은 파일을 다시 실어 보낸다 — 화면이 File 객체를 그대로 들고 있어야 한다는
 * 뜻이고, 새로고침하면 다시 올려야 한다(화면이 그렇게 안내한다).
 *
 * 다른 화면 API와 달리 **mock 폴백이 없다.** 여기서 지어낸 값을 보여주면 "DB에 반영됐다"는
 * 잘못된 확신을 주게 되고, 그건 되돌릴 수 없는 오해다.
 *
 * 모든 호출이 인증을 요구하므로 `accessToken`을 인자로 받는다(`useAuthState()`에 있다).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

/** `VITE_API_BASE_URL`이 없으면 실 API를 부를 수 없다 — 화면이 안내 문구를 띄우도록 알린다. */
export function isDataImportApiConfigured(): boolean {
  return Boolean(API_BASE_URL)
}

function unwrap<T>(result: T | { error: string; message: string }): T {
  if (result && typeof result === 'object' && 'error' in result) {
    throw new Error((result as { message: string }).message)
  }
  return result as T
}

/** 여러 파일을 같은 `files` 키로 담는다 — 백엔드가 `@RequestPart("files") List<MultipartFile>`로 받는다. */
function erpForm(files: File[]): FormData {
  const form = new FormData()
  files.forEach((file) => form.append('files', file))
  return form
}

/**
 * ERP CSV 분석. 대상 테이블 판별 + 컬럼 매핑 + 행 검증 결과가 온다. **DB는 건드리지 않는다.**
 *
 * FK는 "DB에 이미 있거나 같은 배치에 함께 올린 파일에 있으면" 통과다. 그래서 자재와 계약을
 * 한 번에 올리는 게 정상 사용이고, 계약만 따로 올리면 자재를 못 찾는다는 오류가 난다.
 *
 * 사용 예:
 *   const preview = await previewErpCsv(accessToken, [materialsFile, contractsFile])
 */
export async function previewErpCsv(accessToken: string, files: File[]): Promise<ErpImportPreview> {
  return unwrap(await uploadWithAuth<ErpImportPreview>(
    '/api/v1/erp/imports/preview',
    accessToken,
    erpForm(files),
  ))
}

/**
 * ERP CSV 반영. 백엔드가 같은 검증을 다시 돌리고 FK 의존 순서대로 한 트랜잭션에 적재한다 —
 * 한 행이라도 실패하면 전부 되돌아간다. 오류가 남아 있으면 거부하므로 화면은 분석 결과의
 * `committable`이 true일 때만 이 함수를 부른다.
 *
 * 사용 예:
 *   const result = await commitErpCsv(accessToken, files)
 */
export async function commitErpCsv(accessToken: string, files: File[]): Promise<ErpImportCommitResult> {
  return unwrap(await uploadWithAuth<ErpImportCommitResult>(
    '/api/v1/erp/imports/commit',
    accessToken,
    erpForm(files),
  ))
}

/**
 * 업로드 제약(최대 크기·허용 확장자) 조회. 화면이 파일을 고르기 전에 걸러주기 위한 값이고,
 * 최종 판단은 언제나 서버가 다시 한다.
 *
 * 사용 예:
 *   const { max_file_size_bytes } = await fetchErpImportConstraints(accessToken)
 */
export async function fetchErpImportConstraints(accessToken: string): Promise<ErpImportConstraints> {
  return unwrap(await fetchWithAuth<ErpImportConstraints>('/api/v1/erp/imports/constraints', accessToken))
}

/**
 * 검증 보고서 PDF. 서버가 같은 검증을 다시 돌려 문서를 만든다 — 화면이 들고 있는 숫자를 그리는
 * 게 아니다. 그래서 보고서와 화면의 수치가 어긋날 수 없다.
 *
 * `reportType`이 `POST_COMMIT`이면 반영 때 받은 `receipt`가 필요하다. 승인자·반영 건수는 그
 * 서명된 값에서만 나오므로, 화면이 숫자를 지어내 보고서에 실을 방법이 없다.
 *
 * 사용 예:
 *   const file = await downloadErpValidationReport(accessToken, files, 'PRE_COMMIT')
 */
export async function downloadErpValidationReport(
  accessToken: string,
  files: File[],
  reportType: 'PRE_COMMIT' | 'POST_COMMIT',
  receipt?: string,
): Promise<DownloadedFile> {
  const form = erpForm(files)
  form.append('reportType', reportType)
  if (receipt) form.append('receipt', receipt)
  return unwrap(await downloadWithAuth(
    '/api/v1/erp/imports/report',
    accessToken,
    form,
    reportType === 'POST_COMMIT' ? 'erp-import-final-report.pdf' : 'erp-validation-report.pdf',
  ))
}

/**
 * 전체 오류 목록 CSV. PDF는 상위 100건만 싣기 때문에, 오류가 많을 때 나머지를 확인하려면
 * 이쪽을 쓴다. 공식 보고서는 어디까지나 PDF이고 이건 고치기 위한 작업용 파일이다.
 *
 * 사용 예:
 *   const file = await downloadErpErrorCsv(accessToken, files)
 */
export async function downloadErpErrorCsv(
  accessToken: string,
  files: File[],
): Promise<DownloadedFile> {
  return unwrap(await downloadWithAuth(
    '/api/v1/erp/imports/errors.csv',
    accessToken,
    erpForm(files),
    'erp-validation-errors.csv',
  ))
}

/**
 * RAG 업로드 대상(공급사·자재) 선택지 조회.
 *
 * 계약 목록(`fetchContracts`)을 쓰지 않는 이유는, 이 화면이 **아직 계약이 없는 조합에 계약서를
 * 처음 등록**하는 곳이기 때문이다. 계약 목록으로 고르게 하면 이미 계약이 있는 조합밖에 못 고른다.
 *
 * 사용 예:
 *   const { suppliers, materials } = await fetchContractUploadOptions(accessToken)
 */
export async function fetchContractUploadOptions(accessToken: string): Promise<ContractUploadOptions> {
  return unwrap(await fetchWithAuth<ContractUploadOptions>(
    '/api/v1/documents/contracts/options',
    accessToken,
  ))
}

/**
 * RAG 계약 문서 분석. 파일 원문을 뽑아 계약 필드를 정규식으로 추출해 보여준다. **DB는 건드리지
 * 않는다.** 추출값은 틀릴 수 있으므로 화면이 수정 가능한 입력으로 띄운다.
 *
 * 응답의 `existing_contract_id`가 채워져 있으면 그 조합에 이미 계약이 있다는 뜻이다 —
 * 데이터 관리 화면은 그때 승인을 막고 계약/RAG 화면으로 보낸다(신규 등록 전용이므로).
 *
 * 공급사·자재는 화면에서 고른 계약에서 가져온다 — 이 조합에 계약이 이미 있으면 새로 만들지
 * 않고 그 계약에 문서만 붙는다(`existing_contract_id`).
 *
 * 사용 예:
 *   const preview = await previewContractDocument(accessToken, file, 'SUP-CHL-01', 'MAT-LI-CARB')
 */
export async function previewContractDocument(
  accessToken: string,
  file: File,
  erpSupplierId: string,
  erpMaterialId: string,
): Promise<ContractDocumentPreview> {
  const form = new FormData()
  form.append('file', file)
  form.append('erp_supplier_id', erpSupplierId)
  form.append('erp_material_id', erpMaterialId)
  return unwrap(await uploadWithAuth<ContractDocumentPreview>(
    '/api/v1/documents/contracts/preview',
    accessToken,
    form,
  ))
}

/**
 * RAG 계약 문서 반영. 계약(필요 시 신규 생성)과 문서를 만들고 그 자리에서 청킹·임베딩까지
 * 돌려 ChromaDB에 적재한다.
 *
 * 계약 필드는 전부 선택값이다 — 비워 보내면 백엔드가 파일에서 다시 추출해 채운다. 화면은
 * 분석 단계에서 사용자가 확인·수정한 값을 그대로 넘긴다.
 *
 * 사용 예:
 *   const result = await confirmContractDocument(accessToken, file, 'SUP-CHL-01', 'MAT-LI-CARB', fields)
 */
export async function confirmContractDocument(
  accessToken: string,
  file: File,
  erpSupplierId: string,
  erpMaterialId: string,
  fields: {
    contractNumber?: string | null
    contractName?: string | null
    effectiveDate?: string | null
    expirationDate?: string | null
  },
): Promise<ContractDocumentConfirmResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('erp_supplier_id', erpSupplierId)
  form.append('erp_material_id', erpMaterialId)
  // 빈 값은 아예 보내지 않는다. 빈 문자열을 보내면 백엔드가 "값이 있다"고 보고 그대로 저장해,
  // 파일에서 다시 추출하는 폴백이 동작하지 않는다.
  if (fields.contractNumber) form.append('contract_number', fields.contractNumber)
  if (fields.contractName) form.append('contract_name', fields.contractName)
  if (fields.effectiveDate) form.append('effective_date', fields.effectiveDate)
  if (fields.expirationDate) form.append('expiration_date', fields.expirationDate)
  return unwrap(await uploadWithAuth<ContractDocumentConfirmResult>(
    '/api/v1/documents/contracts/confirm',
    accessToken,
    form,
  ))
}
