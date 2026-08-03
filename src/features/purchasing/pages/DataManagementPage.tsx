import { useCallback, useEffect, useState } from 'react'
import { fetchContracts } from '../../../api/contractRag.api'
import {
  commitErpCsv,
  confirmContractDocument,
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
import { DataImportStepper } from '../components/DataImportStepper'
import { DataImportUploadPanel } from '../components/DataImportUploadPanel'
import { DataImportErpAnalysis } from '../components/DataImportErpAnalysis'
import { DataImportRagAnalysis } from '../components/DataImportRagAnalysis'
import type { ContractFieldDraft } from '../components/DataImportRagAnalysis'
import { DataImportSummaryPanel } from '../components/DataImportSummaryPanel'
import styles from './DataManagementPage.module.css'

const EMPTY_DRAFT: ContractFieldDraft = {
  contractNumber: '',
  contractName: '',
  effectiveDate: '',
  expirationDate: '',
}

/**
 * 1계층 구매팀 "데이터 관리". 구매팀 화면 중 유일하게 **DB에 쓰는** 화면이다.
 *
 * 두 모드가 같은 4단계를 돈다: 파일 업로드 → 내용 분석(DB 미반영) → 확인 → DB 반영.
 *   - ERP 모드: 표준 CSV 10종을 한 번에 올려 ERP 테이블에 적재한다.
 *   - RAG 모드: 계약 문서 한 건을 올려 계약 정보 저장 + ChromaDB 색인까지 돌린다.
 *
 * **분석 결과를 서버가 들고 있지 않다.** 백엔드에 잡 ID도 스테이징 테이블도 없어서, 반영
 * 단계에 같은 파일을 다시 보낸다. 그래서 이 컴포넌트가 File 객체를 계속 쥐고 있어야 하고,
 * 새로고침하면 처음부터 다시 올려야 한다(업로드 패널이 그렇게 안내한다).
 *
 * **파일이나 모드가 바뀌면 분석 결과를 즉시 버린다.** 남겨두면 A 파일의 검증 결과를 보면서
 * B 파일을 반영하게 되는데, 그건 되돌릴 수 없는 사고다.
 */
export function DataManagementPage() {
  const { accessToken } = useAuthState()
  const apiConfigured = isDataImportApiConfigured()

  const [mode, setMode] = useState<DataImportMode>('ERP')
  const [files, setFiles] = useState<File[]>([])
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  const [erpPreview, setErpPreview] = useState<ErpImportPreview | null>(null)
  const [ragPreview, setRagPreview] = useState<ContractDocumentPreview | null>(null)
  const [ragDraft, setRagDraft] = useState<ContractFieldDraft>(EMPTY_DRAFT)
  const [erpResult, setErpResult] = useState<ErpImportCommitResult | null>(null)
  const [ragResult, setRagResult] = useState<ContractDocumentConfirmResult | null>(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** 분석·반영 결과만 버린다. 올린 파일은 그대로 둔다 — 파일을 지우면 다시 올려야 한다. */
  const discardResults = useCallback(() => {
    setErpPreview(null)
    setRagPreview(null)
    setRagDraft(EMPTY_DRAFT)
    setErpResult(null)
    setRagResult(null)
    setError(null)
  }, [])

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

  function handleModeChange(next: DataImportMode) {
    if (next === mode) return
    setMode(next)
    setFiles([])          // 받는 형식이 달라진다 — 남겨두면 CSV가 아닌 파일이 ERP 모드에 남는다
    setSelectedContractId(null)
    discardResults()
  }

  function handleFilesChange(next: File[]) {
    setFiles(next)
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
    discardResults()
    try {
      if (mode === 'ERP') {
        setErpPreview(await previewErpCsv(accessToken, files))
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
      setError(err instanceof Error ? err.message : '내용 분석에 실패했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleCommit() {
    if (!accessToken) return
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
      setError(err instanceof Error ? err.message : 'DB 반영에 실패했습니다.')
    } finally {
      setIsCommitting(false)
    }
  }

  function handleStartOver() {
    setFiles([])
    setSelectedContractId(null)
    discardResults()
  }

  const hasPreview = erpPreview !== null || ragPreview !== null
  const hasResult = erpResult !== null || ragResult !== null
  const step = files.length === 0 ? 1 : !hasPreview ? 2 : !hasResult ? 3 : 4

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
                ERP 표준 CSV와 계약 문서를 올려 내용을 확인한 뒤 DB에 반영합니다
              </p>
            </div>
            {(files.length > 0 || hasPreview) && (
              <button type="button" className={styles.resetButton} onClick={handleStartOver}>
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

          <DataImportStepper current={step} />

          <div className={styles.split}>
            <div className={styles.mainColumn}>
              <DataImportUploadPanel
                mode={mode}
                onModeChange={handleModeChange}
                files={files}
                onFilesChange={handleFilesChange}
                contracts={contracts}
                selectedContractId={selectedContractId}
                onSelectContract={handleSelectContract}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                canAnalyze={canAnalyze && apiConfigured}
              />

              {isAnalyzing && <p className={styles.notice}>내용을 분석하는 중입니다…</p>}
              {erpPreview && <DataImportErpAnalysis preview={erpPreview} />}
              {ragPreview && (
                <DataImportRagAnalysis
                  preview={ragPreview}
                  draft={ragDraft}
                  onDraftChange={setRagDraft}
                />
              )}
              {!isAnalyzing && !hasPreview && files.length > 0 && (
                <p className={styles.notice}>
                  "내용 분석"을 눌러 파일에 무엇이 들어 있는지 먼저 확인하세요. 이 단계에서는 DB가
                  바뀌지 않습니다.
                </p>
              )}
            </div>

            <DataImportSummaryPanel
              mode={mode}
              erpPreview={erpPreview}
              ragPreview={ragPreview}
              erpResult={erpResult}
              ragResult={ragResult}
              onCommit={handleCommit}
              isCommitting={isCommitting}
              error={error}
            />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
