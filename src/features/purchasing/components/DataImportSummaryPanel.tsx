import type {
  ContractDocumentConfirmResult,
  ContractDocumentPreview,
  DataImportMode,
  ErpImportCommitResult,
  ErpImportPreview,
} from '../../../api/types'
import styles from './DataImportSummaryPanel.module.css'

interface DataImportSummaryPanelProps {
  mode: DataImportMode
  erpPreview: ErpImportPreview | null
  ragPreview: ContractDocumentPreview | null
  erpResult: ErpImportCommitResult | null
  ragResult: ContractDocumentConfirmResult | null
  onCommit: () => void
  isCommitting: boolean
  error: string | null
}

/**
 * 우측 요약 컬럼. 반영 전에는 "무엇이 얼마나 들어가는지"를, 반영 후에는 "무엇이 들어갔는지"를
 * 같은 자리에서 보여준다.
 *
 * 반영 버튼은 분석 결과가 있고 오류가 0일 때만 열린다. 백엔드도 같은 조건으로 거부하지만,
 * 눌리는 버튼을 두고 서버에서 막으면 사용자는 "왜 안 되는지"를 오류 메시지로만 알게 된다.
 */
export function DataImportSummaryPanel({
  mode,
  erpPreview,
  ragPreview,
  erpResult,
  ragResult,
  onCommit,
  isCommitting,
  error,
}: DataImportSummaryPanelProps) {
  const committed = erpResult !== null || ragResult !== null
  const canCommit = mode === 'ERP' ? Boolean(erpPreview?.committable) : ragPreview !== null

  return (
    <aside className={styles.column} aria-label="반영 요약">
      {mode === 'ERP' && erpPreview && (
        <>
          <section className={styles.card}>
            <h2 className={styles.cardHeading}>4. 반영 요약</h2>
            <p className={styles.totalLabel}>반영 예정 건수</p>
            <p className={styles.totalValue}>
              {erpPreview.total_rows.toLocaleString()}
              <span className={styles.totalUnit}> 건</span>
            </p>
            <ul className={styles.summaryList}>
              {erpPreview.summary.map((entry) => (
                <li key={entry.target_table} className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{entry.label}</span>
                  <span className={styles.summaryCount}>{entry.row_count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            {erpPreview.summary.length === 0 && (
              <p className={styles.note}>대상 테이블이 판별된 파일이 없습니다.</p>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardHeading}>데이터 품질 점수</h2>
            <p className={styles.score}>
              <span className={scoreToneClass(erpPreview.quality_score)}>{erpPreview.quality_score}</span>
              <span className={styles.scoreMax}>/100</span>
            </p>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: `${erpPreview.quality_score}%` }}
              />
            </div>
            <ul className={styles.issueSummary}>
              <li className={styles.issueSummaryRow}>
                <span>오류</span>
                <span className={erpPreview.total_errors > 0 ? styles.critical : undefined}>
                  {erpPreview.total_errors}건
                </span>
              </li>
              <li className={styles.issueSummaryRow}>
                <span>경고</span>
                <span className={erpPreview.total_warnings > 0 ? styles.warning : undefined}>
                  {erpPreview.total_warnings}건
                </span>
              </li>
              <li className={styles.issueSummaryRow}>
                <span>중복</span>
                <span>{erpPreview.total_duplicates}건</span>
              </li>
            </ul>
          </section>
        </>
      )}

      {mode === 'RAG' && ragPreview && (
        <section className={styles.card}>
          <h2 className={styles.cardHeading}>4. 반영 요약</h2>
          <ul className={styles.summaryList}>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>계약</span>
              <span className={styles.summaryCount}>
                {ragPreview.existing_contract_id ? '기존 유지' : '신규 1건'}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>문서</span>
              <span className={styles.summaryCount}>1건</span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>RAG 색인</span>
              <span className={styles.summaryCount}>{ragPreview.text_extracted ? '적재' : '원문 미확인'}</span>
            </li>
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardHeading}>5. DB 반영</h2>
        {!committed ? (
          <>
            <p className={styles.note}>
              {mode === 'ERP'
                ? '반영은 한 트랜잭션으로 실행되어, 한 행이라도 실패하면 전부 되돌아갑니다.'
                : '계약 정보를 저장하고 문서를 RAG 검색 색인에 적재합니다.'}
            </p>
            <button
              type="button"
              className={styles.commitButton}
              onClick={onCommit}
              disabled={!canCommit || isCommitting}
            >
              {isCommitting ? '반영 중…' : 'DB에 반영'}
            </button>
            {!canCommit && (
              <p className={styles.blockedNote}>
                {erpPreview && !erpPreview.committable
                  ? '오류가 남아 있어 반영할 수 없습니다. 파일을 수정하고 다시 분석해 주세요.'
                  : '먼저 내용 분석을 실행해 주세요.'}
              </p>
            )}
            <p className={styles.warnNote}>
              반영된 데이터는 화면에서 되돌릴 수 없습니다.
            </p>
          </>
        ) : (
          <div className={styles.result}>
            <p className={styles.resultHeading}>반영 완료</p>
            {erpResult && (
              <>
                <p className={styles.note}>
                  신규 {erpResult.total_inserted.toLocaleString()}건 · 갱신{' '}
                  {erpResult.total_updated.toLocaleString()}건
                </p>
                <ul className={styles.summaryList}>
                  {erpResult.results.map((entry) => (
                    <li key={entry.target_table} className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>{entry.label}</span>
                      <span className={styles.summaryCount}>
                        +{entry.inserted.toLocaleString()} / ~{entry.updated.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {ragResult && (
              <ul className={styles.summaryList}>
                <li className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>계약</span>
                  <span className={styles.summaryCount}>
                    {ragResult.contract_id}
                    {ragResult.contract_created ? ' (신규)' : ''}
                  </span>
                </li>
                <li className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>문서</span>
                  <span className={styles.summaryCount}>{ragResult.document_id}</span>
                </li>
                <li className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>색인 상태</span>
                  <span className={styles.summaryCount}>{ragResult.processing_status}</span>
                </li>
              </ul>
            )}
          </div>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </section>
    </aside>
  )
}

/** 점수 색은 임계값이 아니라 읽는 사람의 판단을 돕는 힌트다 — 80 이상 정상, 60 이상 주의. */
function scoreToneClass(score: number): string {
  if (score >= 80) return styles.scoreNormal
  if (score >= 60) return styles.scoreWarning
  return styles.scoreCritical
}
