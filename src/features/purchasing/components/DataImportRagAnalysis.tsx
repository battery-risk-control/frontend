import type { ContractDocumentPreview } from '../../../api/types'
import styles from './DataImportRagAnalysis.module.css'

/** 화면이 편집을 허용하는 계약 필드. 반영 단계에 이 값이 그대로 넘어간다. */
export interface ContractFieldDraft {
  contractNumber: string
  contractName: string
  effectiveDate: string
  expirationDate: string
}

interface DataImportRagAnalysisProps {
  preview: ContractDocumentPreview
  draft: ContractFieldDraft
  onDraftChange: (draft: ContractFieldDraft) => void
}

/**
 * RAG 계약 문서 분석 결과.
 *
 * 계약 필드는 **정규식으로 뽑은 추정값이라 편집 가능한 입력으로 보여준다.** 읽기 전용으로 두면
 * 잘못 뽑힌 계약번호가 그대로 DB에 들어가고, 계약번호는 나중에 조항 검색의 근거 표시에 쓰이기
 * 때문에 틀리면 추적이 끊긴다.
 *
 * 원문 미리보기가 함께 있는 이유는, 필드가 비었을 때 "문서에 그 값이 없는 것"인지 "추출이
 * 실패한 것"인지 사용자가 눈으로 판단할 수 있어야 해서다.
 */
export function DataImportRagAnalysis({ preview, draft, onDraftChange }: DataImportRagAnalysisProps) {
  function update(patch: Partial<ContractFieldDraft>) {
    onDraftChange({ ...draft, ...patch })
  }

  return (
    <section className={styles.panel} aria-labelledby="rag-analysis-heading">
      <div className={styles.header}>
        <h2 id="rag-analysis-heading" className={styles.heading}>2. 내용 분석</h2>
        <p className={styles.headerNote}>DB에는 아직 아무것도 반영되지 않았습니다</p>
      </div>

      {/*
        이 조합에 계약이 이미 있으면 백엔드는 새 계약을 만들지 않고 기존 계약에 문서를 붙인다.
        그건 "기존 계약 문서 추가"라 계약/RAG 화면의 일이다. 여기서는 승인을 막고 이유를 밝힌다 —
        버튼만 잠그고 이유를 안 쓰면 사용자는 무엇이 잘못됐는지 알 수 없다.
      */}
      {preview.existing_contract_id && (
        <div className={styles.blockedNotice}>
          <p className={styles.blockedTitle}>이미 계약이 있는 조합입니다</p>
          <p className={styles.blockedBody}>
            {preview.erp_supplier_id} · {preview.erp_material_id} 에는 계약{' '}
            <strong>{preview.existing_contract_id}</strong>이(가) 이미 등록돼 있습니다.
            데이터 관리는 <strong>신규 계약서 등록 전용</strong>이라 여기서는 반영할 수 없습니다.
            기존 계약에 문서를 추가하려면 <strong>계약/RAG</strong> 화면을 이용해 주세요.
          </p>
        </div>
      )}

      <dl className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>파일</dt>
          <dd className={styles.metaValue}>{preview.file_name ?? '—'}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>공급사 · 자재</dt>
          <dd className={styles.metaValue}>{preview.erp_supplier_id} · {preview.erp_material_id}</dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>등록 대상 계약</dt>
          <dd className={styles.metaValue}>
            {preview.existing_contract_id
              ? `${preview.existing_contract_id} · 이미 존재`
              : `${preview.expected_new_contract_id ?? '자동 발급'} · 신규 발급 예정`}
          </dd>
        </div>
        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>추출된 원문</dt>
          <dd className={styles.metaValue}>
            {preview.text_extracted
              ? `${preview.char_count.toLocaleString()}자`
              : <span className={styles.failure}>원문을 읽지 못했습니다</span>}
          </dd>
        </div>
      </dl>

      <h3 className={styles.subheading}>3. 계약 정보 확인</h3>
      <p className={styles.subnote}>
        문서에서 자동으로 뽑은 값입니다. 틀린 곳은 직접 고쳐주세요 — 여기 값이 그대로 저장됩니다.
      </p>
      <div className={styles.fieldGrid}>
        <Field label="계약 번호" value={draft.contractNumber} onChange={(v) => update({ contractNumber: v })} />
        <Field label="계약명" value={draft.contractName} onChange={(v) => update({ contractName: v })} />
        <Field label="발효일" type="date" value={draft.effectiveDate} onChange={(v) => update({ effectiveDate: v })} />
        <Field label="만료일" type="date" value={draft.expirationDate} onChange={(v) => update({ expirationDate: v })} />
      </div>
      <p className={styles.subnote}>
        비워 두면 반영할 때 백엔드가 문서에서 다시 추출해 채웁니다.
      </p>

      <h3 className={styles.subheading}>읽어 들인 원문</h3>
      {preview.text_extracted ? (
        <pre className={styles.textPreview}>{preview.text_preview}</pre>
      ) : (
        <p className={styles.failure}>
          원문을 읽지 못했습니다. 계약 정보를 직접 입력하면 문서는 그대로 저장·색인됩니다.
        </p>
      )}
      {preview.text_extracted && preview.char_count > preview.text_preview.length && (
        <p className={styles.subnote}>
          앞 {preview.text_preview.length.toLocaleString()}자만 표시했습니다. 전체는{' '}
          {preview.char_count.toLocaleString()}자입니다.
        </p>
      )}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'date'
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
