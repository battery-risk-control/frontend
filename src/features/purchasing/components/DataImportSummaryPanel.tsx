import type {
  ContractDocumentConfirmResult,
  ContractDocumentPreview,
  DataImportMode,
  ErpImportCommitResult,
  ErpImportPreview,
} from '../../../api/types'
import styles from './DataImportSummaryPanel.module.css'

/** 오류가 이보다 많으면 PDF가 다 담지 못한다(서버가 상위 100건에서 자른다). */
const PDF_ISSUE_LIMIT = 100

interface DataImportSummaryPanelProps {
  mode: DataImportMode
  erpPreview: ErpImportPreview | null
  ragPreview: ContractDocumentPreview | null
  erpResult: ErpImportCommitResult | null
  ragResult: ContractDocumentConfirmResult | null
  /** 승인. 경고가 있으면 페이지가 확인 창을 먼저 띄운다. */
  onRequestCommit: () => void
  /** 거부. 페이지가 확인 창을 띄운 뒤 상태를 폐기한다. */
  onRequestReject: () => void
  onDownloadReport: () => void
  onDownloadErrorCsv: () => void
  isCommitting: boolean
  isDownloading: boolean
  /** 승인 버튼을 열어도 되는지. 판단은 페이지가 한다(파일 동일성까지 봐야 하기 때문). */
  canCommit: boolean
  /** 승인할 수 없는 이유. 버튼만 잠그고 이유를 안 쓰면 사용자는 무엇을 고쳐야 할지 모른다. */
  blockedReason: string | null
  error: string | null
}

/**
 * 우측 결정 패널. 반영 전에는 "무엇이 얼마나 들어가는지와 승인·거부"를, 반영 후에는 "무엇이
 * 들어갔는지"를 같은 자리에서 보여준다.
 *
 * 승인 버튼은 페이지가 계산한 {@link DataImportSummaryPanelProps.canCommit}만 따른다. 여기서
 * 조건을 다시 판단하지 않는 이유는, 조건 하나(예: 분석 후 파일이 바뀌었는지)를 한쪽에만 넣으면
 * 두 곳의 판단이 갈라지기 때문이다 — 그 상태로 열린 버튼은 다른 파일의 검증 결과로 반영을 건다.
 */
export function DataImportSummaryPanel({
  mode,
  erpPreview,
  ragPreview,
  erpResult,
  ragResult,
  onRequestCommit,
  onRequestReject,
  onDownloadReport,
  onDownloadErrorCsv,
  isCommitting,
  isDownloading,
  canCommit,
  blockedReason,
  error,
}: DataImportSummaryPanelProps) {
  const committed = erpResult !== null || ragResult !== null

  return (
    <aside className={styles.column} aria-label="반영 요약">
      {mode === 'ERP' && erpPreview && !committed && (
        <>
          <section className={styles.card}>
            <h2 className={styles.cardHeading}>4. 승인 또는 거부</h2>
            <p className={styles.totalLabel}>예상 DB 반영 건수</p>
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
              <div className={styles.scoreFill} style={{ width: `${erpPreview.quality_score}%` }} />
            </div>
            <ul className={styles.issueSummary}>
              <li className={styles.issueSummaryRow}>
                <span>오류</span>
                <span className={erpPreview.total_errors > 0 ? styles.critical : undefined}>
                  {erpPreview.total_errors.toLocaleString()}건
                </span>
              </li>
              <li className={styles.issueSummaryRow}>
                <span>경고</span>
                <span className={erpPreview.total_warnings > 0 ? styles.warning : undefined}>
                  {erpPreview.total_warnings.toLocaleString()}건
                </span>
              </li>
              <li className={styles.issueSummaryRow}>
                <span>중복</span>
                <span>{erpPreview.total_duplicates.toLocaleString()}건</span>
              </li>
            </ul>
            <p className={erpPreview.committable ? styles.verdictOk : styles.verdictBlocked}>
              최종 판정 · {erpPreview.committable ? 'DB 반영 가능' : 'DB 반영 불가'}
            </p>
          </section>
        </>
      )}

      {mode === 'RAG' && ragPreview && !committed && (
        <section className={styles.card}>
          <h2 className={styles.cardHeading}>4. 승인 또는 거부</h2>
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

      {!committed ? (
        <section className={styles.card}>
          <h2 className={styles.cardHeading}>{mode === 'ERP' ? 'DB 반영 결정' : '5. DB 반영'}</h2>
          <p className={styles.note}>
            {mode === 'ERP'
              ? '반영은 한 트랜잭션으로 실행되어, 한 행이라도 실패하면 전부 되돌아갑니다.'
              : '계약 정보를 저장하고 문서를 RAG 검색 색인에 적재합니다.'}
          </p>

          <button
            type="button"
            className={styles.commitButton}
            onClick={onRequestCommit}
            disabled={!canCommit || isCommitting}
          >
            {isCommitting ? '반영 중…' : 'DB 반영 승인'}
          </button>

          {blockedReason && <p className={styles.blockedNote}>{blockedReason}</p>}

          {mode === 'ERP' && erpPreview && (
            <>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onDownloadReport}
                disabled={isDownloading}
              >
                {isDownloading ? '보고서 생성 중…' : '검증 보고서 PDF'}
              </button>
              {/* PDF가 다 담지 못할 때만 띄운다 — 늘 보이면 어느 쪽이 공식 보고서인지 흐려진다. */}
              {erpPreview.total_errors > PDF_ISSUE_LIMIT && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={onDownloadErrorCsv}
                  disabled={isDownloading}
                >
                  전체 오류 CSV ({erpPreview.total_errors.toLocaleString()}건)
                </button>
              )}
              <button
                type="button"
                className={styles.rejectButton}
                onClick={onRequestReject}
                disabled={isCommitting}
              >
                업로드 거부
              </button>
            </>
          )}

          <p className={styles.warnNote}>반영된 데이터는 화면에서 되돌릴 수 없습니다.</p>
        </section>
      ) : (
        <section className={styles.card}>
          <h2 className={styles.cardHeading}>5. 반영 완료</h2>

          {erpResult && (
            <>
              <p className={styles.resultHeading}>DB 반영 완료</p>
              <p className={styles.note}>{formatDateTime(erpResult.committed_at)}</p>
              <ul className={styles.issueSummary}>
                <li className={styles.issueSummaryRow}>
                  <span>신규 삽입</span>
                  <span>{erpResult.total_inserted.toLocaleString()}건</span>
                </li>
                <li className={styles.issueSummaryRow}>
                  <span>갱신</span>
                  <span>{erpResult.total_updated.toLocaleString()}건</span>
                </li>
              </ul>
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

              {/*
                DB는 들어갔는데 지식그래프만 옛 값으로 남은 상태다. 이걸 실패처럼 보여주면
                사용자가 같은 파일을 다시 올려 중복 갱신을 시도한다. 성공과 붙여서, 그러나
                구분해서 적는다.
              */}
              {erpResult.kg_sync_warning ? (
                <div className={styles.kgWarning}>
                  <p className={styles.kgWarningTitle}>KG 동기화 실패</p>
                  <p className={styles.kgWarningBody}>
                    ERP 데이터는 정상 반영됐지만 KG 동기화에 실패했습니다. 지식그래프에는 이전
                    데이터가 남아 있을 수 있습니다.
                  </p>
                  <p className={styles.kgWarningReason}>{erpResult.kg_sync_warning}</p>
                </div>
              ) : (
                <p className={styles.kgOk}>KG 동기화 정상</p>
              )}

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={onDownloadReport}
                disabled={isDownloading}
              >
                {isDownloading ? '보고서 생성 중…' : '최종 반영 보고서 PDF'}
              </button>
            </>
          )}

          {ragResult && (
            <>
              <p className={styles.resultHeading}>반영 완료</p>
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
            </>
          )}
        </section>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </aside>
  )
}

/** 점수 색은 임계값이 아니라 읽는 사람의 판단을 돕는 힌트다 — 80 이상 정상, 60 이상 주의. */
function scoreToneClass(score: number): string {
  if (score >= 80) return styles.scoreNormal
  if (score >= 60) return styles.scoreWarning
  return styles.scoreCritical
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'medium' })
}
