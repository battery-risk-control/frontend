import { useRef, useState } from 'react'
import type { ContractSummary, DataImportMode } from '../../../api/types'
import styles from './DataImportUploadPanel.module.css'

/**
 * 백엔드가 받는 형식과 같은 값. 어긋나면 화면이 통과시킨 파일이 서버에서 막힌다.
 * ERP는 `ErpImportService`가 CSV만 받고, RAG는 `DocumentService.ALLOWED_MIME_TYPES`가
 * pdf/txt/csv를 받는다.
 */
const ACCEPTED: Record<DataImportMode, string[]> = {
  ERP: ['.csv'],
  RAG: ['.csv', '.txt', '.pdf'],
}

/** Spring `spring.servlet.multipart.max-file-size`와 같은 값. */
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

interface DataImportUploadPanelProps {
  mode: DataImportMode
  onModeChange: (mode: DataImportMode) => void
  files: File[]
  onFilesChange: (files: File[]) => void
  /** RAG 모드에서 문서를 붙일 계약 목록. ERP 모드에서는 쓰지 않는다. */
  contracts: ContractSummary[]
  selectedContractId: number | null
  onSelectContract: (contractId: number | null) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  canAnalyze: boolean
}

export function DataImportUploadPanel({
  mode,
  onModeChange,
  files,
  onFilesChange,
  contracts,
  selectedContractId,
  onSelectContract,
  onAnalyze,
  isAnalyzing,
  canAnalyze,
}: DataImportUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [rejected, setRejected] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * 받을 수 있는 파일만 남기고 나머지는 이유와 함께 돌려준다. 조용히 버리면 사용자는 파일을
   * 올렸다고 믿은 채 다음 단계로 간다.
   *
   * RAG 모드는 한 번에 한 건이다 — 계약서 분석/반영 API가 파일 하나를 받고, 여러 건을 큐로
   * 돌리면 중간에 실패했을 때 "몇 건이 들어갔는지" 화면이 설명할 수 없다.
   */
  function accept(incoming: File[]) {
    const allowed = ACCEPTED[mode]
    const reasons: string[] = []
    const passed = incoming.filter((file) => {
      const name = file.name.toLowerCase()
      if (!allowed.some((extension) => name.endsWith(extension))) {
        reasons.push(`${file.name} — ${allowed.join(', ')} 형식만 올릴 수 있습니다`)
        return false
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        reasons.push(`${file.name} — 50MB를 넘습니다`)
        return false
      }
      return true
    })
    setRejected(reasons)
    if (passed.length === 0) return
    onFilesChange(mode === 'RAG' ? passed.slice(0, 1) : dedupe([...files, ...passed]))
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    accept(Array.from(event.dataTransfer.files))
  }

  const selectedContract = contracts.find((contract) => contract.contract_id === selectedContractId)

  return (
    <section className={styles.panel} aria-labelledby="upload-heading">
      <div className={styles.header}>
        <h2 id="upload-heading" className={styles.heading}>1. 파일 업로드</h2>
        <p className={styles.headerNote}>
          {mode === 'ERP'
            ? 'ERP 표준 CSV를 올려 DB에 반영합니다'
            : '계약 문서를 올려 계약 정보와 RAG 검색 색인에 반영합니다'}
        </p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="데이터 종류">
        {(['ERP', 'RAG'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? styles.tabActive : styles.tab}
            onClick={() => onModeChange(value)}
          >
            {value === 'ERP' ? 'ERP 데이터 (CSV)' : 'RAG 데이터 (CSV · TXT · PDF)'}
          </button>
        ))}
      </div>

      {/*
        RAG 문서는 어느 계약에 붙는지가 정해져야 분석할 수 있다(백엔드가 공급사·자재를 요구한다).
        고른 계약에 이미 문서가 있으면 그 계약에 추가되고, 없으면 새 계약을 만든다.
      */}
      {mode === 'RAG' && (
        <label className={styles.contractPicker}>
          <span className={styles.contractLabel}>대상 계약</span>
          <select
            className={styles.select}
            value={selectedContractId ?? ''}
            onChange={(event) => onSelectContract(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">계약을 선택하세요</option>
            {contracts.map((contract) => (
              <option key={contract.contract_id} value={contract.contract_id}>
                {contract.erp_contract_id ?? `#${contract.contract_id}`} · {contract.supplier_name ?? '공급사 미상'} ·{' '}
                {contract.material_name ?? '자재 미상'}
                {contract.document_count === 0 ? ' (문서 없음)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      <div
        className={isDragging ? styles.dropzoneActive : styles.dropzone}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <p className={styles.dropTitle}>파일을 드래그하거나 클릭하여 업로드</p>
        <p className={styles.dropHint}>
          {ACCEPTED[mode].join(', ')} 지원 (최대 50MB{mode === 'ERP' ? ', 여러 개 가능' : ', 한 번에 한 건'})
        </p>
        <input
          ref={inputRef}
          type="file"
          className={styles.hiddenInput}
          accept={ACCEPTED[mode].join(',')}
          multiple={mode === 'ERP'}
          onChange={(event) => {
            accept(Array.from(event.target.files ?? []))
            // 같은 파일을 다시 고를 수 있게 비운다 — 안 비우면 change가 안 뜬다.
            event.target.value = ''
          }}
        />
      </div>

      {rejected.length > 0 && (
        <ul className={styles.rejected}>
          {rejected.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className={styles.fileGrid}>
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className={styles.fileCard}>
              <div className={styles.fileRow}>
                <span className={styles.fileName}>{file.name}</span>
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`${file.name} 제거`}
                  onClick={() => onFilesChange(files.filter((candidate) => candidate !== file))}
                >
                  ✕
                </button>
              </div>
              <p className={styles.fileMeta}>
                <span className={styles.fileType}>
                  {file.name.slice(file.name.lastIndexOf('.') + 1).toUpperCase()}
                </span>
                {formatBytes(file.size)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        {mode === 'RAG' && files.length > 0 && !selectedContract && (
          <p className={styles.actionNote}>대상 계약을 먼저 선택해 주세요.</p>
        )}
        <button
          type="button"
          className={styles.analyzeButton}
          onClick={onAnalyze}
          disabled={!canAnalyze || isAnalyzing}
        >
          {isAnalyzing ? '분석 중…' : '내용 분석'}
        </button>
      </div>
      <p className={styles.reloadNote}>
        분석·반영은 올린 파일을 그대로 다시 보냅니다. 새로고침하면 파일이 사라지니 다시 올려주세요.
      </p>
    </section>
  )
}

/** 같은 이름·크기의 파일을 두 번 담지 않는다 — 두 번 올리면 같은 행이 두 번 적재된다. */
function dedupe(files: File[]): File[] {
  const seen = new Set<string>()
  return files.filter((file) => {
    const key = `${file.name}-${file.size}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
