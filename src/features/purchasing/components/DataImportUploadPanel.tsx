import { useRef, useState } from 'react'
import type { ContractUploadOptions, DataImportMode } from '../../../api/types'
import { supplierStatusLabel } from '../lib/supplierStatus'
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

/**
 * 서버에서 제약을 못 받아왔을 때만 쓰는 값. 서버 설정을 못 읽었다고 업로드를 막을 수는 없으니
 * 현재 기본값과 같은 수를 두되, 실제 판단은 언제나 서버가 다시 한다.
 */
const FALLBACK_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

interface DataImportUploadPanelProps {
  mode: DataImportMode
  onModeChange: (mode: DataImportMode) => void
  files: File[]
  onFilesChange: (files: File[]) => void
  /** 서버가 알려준 최대 파일 크기. 아직 못 받았으면 null. */
  maxFileSizeBytes: number | null
  /**
   * RAG 모드에서 계약서를 붙일 대상. 계약이 아니라 **공급사·자재**를 고른다 — 이 화면은 아직
   * 계약이 없는 조합에 계약서를 처음 등록하는 곳이라, 계약 목록으로는 그 조합을 고를 수 없다.
   */
  options: ContractUploadOptions | null
  selectedSupplierId: string | null
  selectedMaterialId: string | null
  onSelectSupplier: (erpSupplierId: string | null) => void
  onSelectMaterial: (erpMaterialId: string | null) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  canAnalyze: boolean
}

export function DataImportUploadPanel({
  mode,
  onModeChange,
  files,
  onFilesChange,
  maxFileSizeBytes,
  options,
  selectedSupplierId,
  selectedMaterialId,
  onSelectSupplier,
  onSelectMaterial,
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
    const maxBytes = maxFileSizeBytes ?? FALLBACK_MAX_FILE_SIZE_BYTES
    const reasons: string[] = []
    const already = new Set(files.map((file) => `${file.name}-${file.size}`))
    const passed = incoming.filter((file) => {
      const name = file.name.toLowerCase()
      if (!allowed.some((extension) => name.endsWith(extension))) {
        reasons.push(`${file.name} — ${allowed.join(', ')} 형식만 올릴 수 있습니다`)
        return false
      }
      // 빈 파일은 서버에서 "빈 파일입니다" 오류로 돌아온다. 여기서 먼저 알려주면 왕복을 아낀다.
      if (file.size === 0) {
        reasons.push(`${file.name} — 빈 파일입니다`)
        return false
      }
      if (file.size > maxBytes) {
        reasons.push(`${file.name} — ${formatBytes(maxBytes)}를 넘습니다`)
        return false
      }
      // 같은 파일을 두 번 고르면 조용히 하나로 합쳐지는데, 사용자는 두 개를 올렸다고 믿는다.
      if (mode === 'ERP' && already.has(`${file.name}-${file.size}`)) {
        reasons.push(`${file.name} — 이미 선택된 파일입니다`)
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

  return (
    <section className={styles.panel} aria-labelledby="upload-heading">
      <div className={styles.header}>
        <h2 id="upload-heading" className={styles.heading}>1. 파일 업로드</h2>
        <p className={styles.headerNote}>
          {mode === 'ERP'
            ? 'ERP 표준 CSV를 올려 DB에 반영합니다'
            : '새 계약서를 등록하고 RAG 검색 색인에 임베딩합니다'}
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
        백엔드는 계약이 아니라 공급사+자재를 받는다. 그 조합에 계약이 없으면 CTR-XXX를 새로
        발급하고, 있으면 기존 계약에 문서를 붙인다. 이 화면은 앞의 경우(신규 등록)만 다루므로
        계약 목록이 아니라 공급사·자재를 고르게 한다 — 계약 목록으로는 "아직 계약이 없는 조합"을
        애초에 고를 수가 없다.
      */}
      {mode === 'RAG' && (
        <div className={styles.targetPicker}>
          <label className={styles.targetField}>
            <span className={styles.contractLabel}>공급사</span>
            <select
              className={styles.select}
              value={selectedSupplierId ?? ''}
              onChange={(event) => onSelectSupplier(event.target.value || null)}
            >
              <option value="">공급사를 선택하세요</option>
              {(options?.suppliers ?? []).map((supplier) => (
                <option key={supplier.erp_supplier_id} value={supplier.erp_supplier_id}>
                  {supplier.supplier_name} ({supplier.erp_supplier_id})
                  {supplier.supplier_status && supplier.supplier_status !== 'ACTIVE'
                    ? ` · ${supplierStatusLabel(supplier.supplier_status)}`
                    : ''}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.targetField}>
            <span className={styles.contractLabel}>자재</span>
            <select
              className={styles.select}
              value={selectedMaterialId ?? ''}
              onChange={(event) => onSelectMaterial(event.target.value || null)}
            >
              <option value="">자재를 선택하세요</option>
              {(options?.materials ?? []).map((material) => (
                <option key={material.erp_material_id} value={material.erp_material_id}>
                  {material.material_name} ({material.erp_material_id})
                  {!material.active ? ' · 사용 중단' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
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
          {ACCEPTED[mode].join(', ')} 지원 (최대{' '}
          {formatBytes(maxFileSizeBytes ?? FALLBACK_MAX_FILE_SIZE_BYTES)}
          {mode === 'ERP' ? ', 여러 개 가능' : ', 한 번에 한 건'})
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
        <div className={styles.fileListHeader}>
          <span className={styles.fileListCount}>
            선택한 파일 {files.length}개 · {formatBytes(files.reduce((sum, file) => sum + file.size, 0))}
          </span>
          <button type="button" className={styles.clearAllButton} onClick={() => onFilesChange([])}>
            전체 초기화
          </button>
        </div>
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
        {mode === 'RAG' && files.length > 0 && !(selectedSupplierId && selectedMaterialId) && (
          <p className={styles.actionNote}>공급사와 자재를 먼저 선택해 주세요.</p>
        )}
        <button
          type="button"
          className={styles.analyzeButton}
          onClick={onAnalyze}
          disabled={!canAnalyze || isAnalyzing}
        >
          {isAnalyzing ? '검사 중…' : mode === 'ERP' ? '품질검사 시작' : '내용 분석'}
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
