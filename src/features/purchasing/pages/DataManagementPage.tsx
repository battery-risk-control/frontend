import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchContracts } from '../../../api/contractRag.api'
import {
  commitErpCsv,
  confirmContractDocument,
  downloadErpErrorCsv,
  downloadErpValidationReport,
  fetchErpImportConstraints,
  isDataImportApiConfigured,
  previewContractDocument,
  previewErpCsv,
} from '../../../api/dataImport.api'
import type {
  ContractDocumentConfirmResult,
  ContractDocumentPreview,
  ContractSummary,
  DataImportMode,
  ErpImportCommitResult,
  ErpImportPreview,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { useAuthState } from '../../../lib/useAuthState'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import { saveBlob } from '../../../lib/saveBlob'
import { DataImportStepper } from '../components/DataImportStepper'
import { DataImportUploadPanel } from '../components/DataImportUploadPanel'
import { DataImportErpAnalysis } from '../components/DataImportErpAnalysis'
import { DataImportSchemaMapping } from '../components/DataImportSchemaMapping'
import { DataImportRagAnalysis } from '../components/DataImportRagAnalysis'
import type { ContractFieldDraft } from '../components/DataImportRagAnalysis'
import { DataImportSummaryPanel } from '../components/DataImportSummaryPanel'
import { ConfirmCommitModal, RejectImportModal } from '../components/DataImportModals'
import styles from './DataManagementPage.module.css'

const EMPTY_DRAFT: ContractFieldDraft = {
  contractNumber: '',
  contractName: '',
  effectiveDate: '',
  expirationDate: '',
}

/**
 * 화면이 지나가는 상태. 파일을 골랐다고 검증된 것이 아니고, 검증됐다고 반영된 것이 아니다 —
 * 그 구분을 타입으로 세워두면 "검증 없이 반영" 같은 경로가 애초에 만들어지지 않는다.
 */
type ImportStep = 'SELECT' | 'VALIDATING' | 'REVIEW' | 'COMMITTING' | 'COMPLETED' | 'REJECTED'

/** 스텝퍼에 표시할 칸 번호. REJECTED는 1번 칸으로 돌아가되 완료 표시를 달지 않는다. */
const STEP_INDEX: Record<ImportStep, number> = {
  SELECT: 1,
  VALIDATING: 2,
  REVIEW: 3,
  COMMITTING: 4,
  COMPLETED: 5,
  REJECTED: 1,
}

/**
 * 1계층 구매팀 "데이터 관리". 구매팀 화면 중 유일하게 **DB에 쓰는** 화면이다.
 *
 * 지켜야 하는 순서는 하나다: <b>업로드 → 품질검사 → 사용자 검토 → 승인 또는 거부 → 반영</b>.
 * 파일을 올리는 것만으로는 DB가 절대 바뀌지 않고, 사용자가 명시적으로 승인해야만 반영된다.
 *
 * **분석 결과를 서버가 들고 있지 않다.** 잡 ID도 스테이징 테이블도 없어서 반영 단계에 같은
 * 파일을 다시 보낸다. 그래서 이 컴포넌트가 File 객체를 계속 쥐고 있어야 하고, 새로고침하면
 * 처음부터 다시 올려야 한다(업로드 패널이 그렇게 안내한다).
 *
 * **파일이나 모드가 바뀌면 검사 결과를 즉시 버린다.** 남겨두면 A 파일의 검증 결과를 보면서
 * B 파일을 반영하게 되는데, 그건 되돌릴 수 없는 사고다. 버리는 것만으로는 부족해서
 * {@link previewedFiles}로 "검사한 그 파일이 맞는지"를 승인 직전에 한 번 더 확인한다.
 */
export function DataManagementPage() {
  const { accessToken } = useAuthState()
  const apiConfigured = isDataImportApiConfigured()

  const [mode, setMode] = useState<DataImportMode>('ERP')
  const [files, setFiles] = useState<File[]>([])
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)
  const [maxFileSizeBytes, setMaxFileSizeBytes] = useState<number | null>(null)

  const [erpPreview, setErpPreview] = useState<ErpImportPreview | null>(null)
  /**
   * 검사를 돌린 바로 그 File 객체들. 승인 직전에 현재 목록과 대조한다.
   * 파일 변경 시 결과를 버리는 것과 <b>겹치는 방어</b>인데, 이건 겹쳐도 되는 종류의 사고다.
   */
  const [previewedFiles, setPreviewedFiles] = useState<File[] | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [ragPreview, setRagPreview] = useState<ContractDocumentPreview | null>(null)
  const [ragDraft, setRagDraft] = useState<ContractFieldDraft>(EMPTY_DRAFT)
  const [erpResult, setErpResult] = useState<ErpImportCommitResult | null>(null)
  const [ragResult, setRagResult] = useState<ContractDocumentConfirmResult | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [wasRejected, setWasRejected] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 검사·반영 결과만 버린다. 올린 파일은 그대로 둔다 — 파일을 지우면 다시 올려야 한다. */
  const discardResults = useCallback(() => {
    setErpPreview(null)
    setPreviewedFiles(null)
    setSelectedFileName(null)
    setRagPreview(null)
    setRagDraft(EMPTY_DRAFT)
    setErpResult(null)
    setRagResult(null)
    setError(null)
  }, [])

  // 업로드 제약은 서버가 진실이다. 못 받아와도 화면을 막지 않고 패널이 기본값으로 안내한다.
  useEffect(() => {
    if (!accessToken || !apiConfigured) return
    let cancelled = false
    void fetchErpImportConstraints(accessToken)
      .then((constraints) => {
        if (!cancelled) setMaxFileSizeBytes(constraints.max_file_size_bytes)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured])

  // RAG 모드는 문서를 붙일 계약을 골라야 분석할 수 있다. 목록은 미적재 계약까지 포함해서
  // 가져온다 — 문서가 0건인 신규 계약이야말로 첫 문서를 올릴 대상이다.
  useEffect(() => {
    if (mode !== 'RAG' || !accessToken || !apiConfigured || contracts.length > 0) return
    let cancelled = false
    void fetchContracts(accessToken, true)
      .then((rows) => {
        if (!cancelled) setContracts(rows)
      })
      .catch(() => {
        // 목록을 못 불러와도 ERP 모드는 멀쩡하다. 화면 전체를 막지 않는다.
        if (!cancelled) setError('계약 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      })
    return () => {
      cancelled = true
    }
  }, [mode, accessToken, apiConfigured, contracts.length])

  // 반영 중에 탭을 닫으면 트랜잭션 결과를 확인할 방법이 사라진다(응답을 받을 화면이 없어진다).
  // 브라우저 기본 경고를 띄워 한 번 붙잡는다.
  useEffect(() => {
    if (!isCommitting) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isCommitting])

  function handleModeChange(next: DataImportMode) {
    if (next === mode || isCommitting) return
    setMode(next)
    setFiles([])          // 받는 형식이 달라진다 — 남겨두면 CSV가 아닌 파일이 ERP 모드에 남는다
    setSelectedContractId(null)
    setWasRejected(false)
    discardResults()
  }

  function handleFilesChange(next: File[]) {
    if (isCommitting) return   // 반영 중 목록이 바뀌면 무엇을 보냈는지 알 수 없게 된다
    setFiles(next)
    setWasRejected(false)
    discardResults()
  }

  function handleSelectContract(contractId: number | null) {
    setSelectedContractId(contractId)
    discardResults()   // 대상 계약이 바뀌면 이전 분석의 "반영 대상 계약"이 더는 맞지 않는다
  }

  const selectedContract = contracts.find((contract) => contract.contract_id === selectedContractId)
  const canAnalyze = mode === 'ERP'
    ? files.length > 0
    : files.length === 1
      && Boolean(selectedContract?.erp_supplier_id)
      && Boolean(selectedContract?.erp_material_id)

  async function handleAnalyze() {
    if (!accessToken || !canAnalyze) return
    setIsAnalyzing(true)
    setWasRejected(false)
    discardResults()
    try {
      if (mode === 'ERP') {
        const preview = await previewErpCsv(accessToken, files)
        setErpPreview(preview)
        setPreviewedFiles(files)
        // 처음 볼 곳은 문제가 있는 파일이다. 아무 문제 없으면 첫 파일.
        setSelectedFileName(
          (preview.files.find((file) => file.error_count > 0) ?? preview.files[0])?.file_name ?? null,
        )
      } else {
        const preview = await previewContractDocument(
          accessToken,
          files[0],
          selectedContract!.erp_supplier_id!,
          selectedContract!.erp_material_id!,
        )
        setRagPreview(preview)
        setRagDraft({
          contractNumber: preview.contract_number ?? '',
          contractName: preview.contract_name ?? '',
          effectiveDate: preview.effective_date ?? '',
          expirationDate: preview.expiration_date ?? '',
        })
      }
    } catch (err) {
      setError(describe(err, '품질검사에 실패했습니다.'))
    } finally {
      setIsAnalyzing(false)
    }
  }

  /**
   * 검사한 파일과 지금 고른 파일이 같은지. 같은 이름·크기의 <b>다른</b> 파일로 바꿔치기해도
   * 참조가 달라 여기서 걸린다.
   */
  const filesMatchPreview = useMemo(() => {
    if (previewedFiles === null) return false
    if (previewedFiles.length !== files.length) return false
    return previewedFiles.every((file, index) => file === files[index])
  }, [previewedFiles, files])

  const canCommit = mode === 'ERP'
    ? Boolean(erpPreview?.committable) && filesMatchPreview && !isCommitting && erpResult === null
    : ragPreview !== null && !isCommitting && ragResult === null

  const blockedReason = commitBlockedReason()

  function commitBlockedReason(): string | null {
    if (canCommit || isCommitting) return null
    if (mode === 'RAG') return ragPreview === null ? '먼저 내용 분석을 실행해 주세요.' : null
    if (erpPreview === null) return '먼저 품질검사를 실행해 주세요.'
    if (!erpPreview.committable) return '오류를 수정한 후 다시 업로드해 주세요.'
    if (!filesMatchPreview) return '검사 후 파일이 바뀌었습니다. 품질검사를 다시 실행해 주세요.'
    return null
  }

  /** 승인 요청. 경고·중복이 있으면 곧바로 반영하지 않고 확인을 한 번 받는다. */
  function handleRequestCommit() {
    if (!canCommit) return
    const needsConfirm = mode === 'ERP'
      && erpPreview !== null
      && (erpPreview.total_warnings > 0 || erpPreview.total_duplicates > 0)
    if (needsConfirm) {
      setConfirmOpen(true)
      return
    }
    void runCommit()
  }

  async function runCommit() {
    setConfirmOpen(false)
    // 확인 창을 거치는 동안 파일이 바뀌었을 수도 있다. 실제로 보내기 직전에 다시 본다.
    if (!accessToken || !canCommit) return
    setIsCommitting(true)
    setError(null)
    try {
      if (mode === 'ERP') {
        setErpResult(await commitErpCsv(accessToken, files))
      } else {
        setRagResult(await confirmContractDocument(
          accessToken,
          files[0],
          selectedContract!.erp_supplier_id!,
          selectedContract!.erp_material_id!,
          {
            contractNumber: ragDraft.contractNumber,
            contractName: ragDraft.contractName,
            effectiveDate: ragDraft.effectiveDate,
            expirationDate: ragDraft.expirationDate,
          },
        ))
      }
    } catch (err) {
      // 반영에 실패하면 완료 화면으로 넘어가지 않는다. 검토 단계에 그대로 남아 있어야
      // 사용자가 무엇을 고쳐 다시 시도할지 판단할 수 있다.
      setError(`${describe(err, 'DB 반영에 실패했습니다.')} 한 트랜잭션으로 실행되므로 데이터베이스는 반영 전 상태로 되돌아갔습니다.`)
    } finally {
      setIsCommitting(false)
    }
  }

  function handleConfirmReject() {
    setRejectOpen(false)
    setFiles([])
    setSelectedContractId(null)
    discardResults()
    setWasRejected(true)
  }

  async function handleDownloadReport() {
    if (!accessToken || files.length === 0) return
    setIsDownloading(true)
    setError(null)
    try {
      const file = erpResult
        ? await downloadErpValidationReport(accessToken, files, 'POST_COMMIT', erpResult.receipt)
        : await downloadErpValidationReport(accessToken, files, 'PRE_COMMIT')
      saveBlob(file.blob, file.fileName)
    } catch (err) {
      setError(describe(err, '검증 보고서를 만들지 못했습니다.'))
    } finally {
      setIsDownloading(false)
    }
  }

  async function handleDownloadErrorCsv() {
    if (!accessToken || files.length === 0) return
    setIsDownloading(true)
    setError(null)
    try {
      const file = await downloadErpErrorCsv(accessToken, files)
      saveBlob(file.blob, file.fileName)
    } catch (err) {
      setError(describe(err, '오류 목록 CSV를 만들지 못했습니다.'))
    } finally {
      setIsDownloading(false)
    }
  }

  function handleStartOver() {
    if (isCommitting) return
    setFiles([])
    setSelectedContractId(null)
    setWasRejected(false)
    discardResults()
  }

  const hasPreview = erpPreview !== null || ragPreview !== null
  const hasResult = erpResult !== null || ragResult !== null
  const step: ImportStep = hasResult
    ? 'COMPLETED'
    : isCommitting ? 'COMMITTING'
      : hasPreview ? 'REVIEW'
        : isAnalyzing || files.length > 0 ? 'VALIDATING'
          : wasRejected ? 'REJECTED' : 'SELECT'

  const selectedFile = erpPreview?.files.find((file) => file.file_name === selectedFileName) ?? null

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.heading}>데이터 관리</h1>
              <p className={styles.subheading}>
                파일을 올려 품질을 검사하고, 검토 후 승인한 데이터만 DB에 반영합니다
              </p>
            </div>
            {(files.length > 0 || hasPreview) && (
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleStartOver}
                disabled={isCommitting}
              >
                새로 시작
              </button>
            )}
          </div>

          {!apiConfigured && (
            <p className={styles.notice}>
              백엔드 API가 설정되지 않았습니다(<code>VITE_API_BASE_URL</code>).
              실제로 반영하려면 <code>npm run dev:live</code>로 실행하세요.
            </p>
          )}

          <DataImportStepper current={STEP_INDEX[step]} rejected={step === 'REJECTED'} />

          {step === 'REJECTED' && (
            <p className={styles.rejectedNotice}>
              업로드를 거부했습니다. 데이터베이스에는 아무것도 반영되지 않았습니다.
              수정한 파일을 다시 올려주세요.
            </p>
          )}

          <div className={styles.split}>
            <div className={styles.mainColumn}>
              <DataImportUploadPanel
                mode={mode}
                onModeChange={handleModeChange}
                files={files}
                onFilesChange={handleFilesChange}
                maxFileSizeBytes={maxFileSizeBytes}
                contracts={contracts}
                selectedContractId={selectedContractId}
                onSelectContract={handleSelectContract}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                canAnalyze={canAnalyze && apiConfigured && !isCommitting}
              />

              {isAnalyzing && <p className={styles.notice}>파일 품질을 검사하는 중입니다…</p>}

              {erpPreview && (
                <>
                  <DataImportErpAnalysis
                    preview={erpPreview}
                    selectedFileName={selectedFileName}
                    onSelectFile={setSelectedFileName}
                  />
                  <DataImportSchemaMapping file={selectedFile} />
                </>
              )}

              {ragPreview && (
                <DataImportRagAnalysis
                  preview={ragPreview}
                  draft={ragDraft}
                  onDraftChange={setRagDraft}
                />
              )}

              {!isAnalyzing && !hasPreview && files.length > 0 && (
                <p className={styles.notice}>
                  "{mode === 'ERP' ? '품질검사 시작' : '내용 분석'}"을 눌러 파일에 무엇이 들어 있는지
                  먼저 확인하세요. 이 단계에서는 DB가 바뀌지 않습니다.
                </p>
              )}
            </div>

            <DataImportSummaryPanel
              mode={mode}
              erpPreview={erpPreview}
              ragPreview={ragPreview}
              erpResult={erpResult}
              ragResult={ragResult}
              onRequestCommit={handleRequestCommit}
              onRequestReject={() => setRejectOpen(true)}
              onDownloadReport={handleDownloadReport}
              onDownloadErrorCsv={handleDownloadErrorCsv}
              isCommitting={isCommitting}
              isDownloading={isDownloading}
              canCommit={canCommit}
              blockedReason={blockedReason}
              error={error}
            />
          </div>
        </main>
      </div>
      <Footer />

      {confirmOpen && erpPreview && (
        <ConfirmCommitModal
          warningCount={erpPreview.total_warnings}
          duplicateCount={erpPreview.total_duplicates}
          rowCount={erpPreview.total_rows}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => void runCommit()}
        />
      )}

      {rejectOpen && (
        <RejectImportModal
          onCancel={() => setRejectOpen(false)}
          onConfirm={handleConfirmReject}
        />
      )}
    </div>
  )
}

/**
 * 서버 오류를 사용자가 읽을 문장으로. 인증·권한처럼 <b>사용자가 할 일이 다른</b> 경우는
 * 원문 대신 무엇을 해야 하는지로 바꿔 쓴다.
 */
function describe(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : ''
  if (!message) return `${fallback} 백엔드에 연결하지 못했습니다.`
  if (/토큰|만료|인증/.test(message)) return '로그인이 만료됐습니다. 다시 로그인한 뒤 시도해 주세요.'
  if (/권한/.test(message)) return '이 작업은 구매팀 계정만 실행할 수 있습니다.'
  return message
}
