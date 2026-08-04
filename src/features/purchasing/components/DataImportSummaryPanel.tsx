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
          {/*
            번호를 뗐다. 이 카드는 "무엇이 얼마나 들어오는가"만 말하는 정보 카드인데, 스텝퍼의
            4단계(승인 또는 거부)는 아래 버튼 카드가 하는 일이다. 정보 카드에 결정 번호가 붙어
            있으면 읽는 순서(무엇이 들어오나 → 믿을 만한가 → 실행)가 첫 칸에서 끊긴다.
          */}
          <section className={styles.card}>
            <h2 className={styles.cardHeading}>가져오기 요약</h2>
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
              <span className={scoreBand(erpPreview.quality_score).tone}>
                {erpPreview.quality_score}
              </span>
              <span className={styles.scoreMax}>/100</span>
              {/* 92라는 숫자만으로는 좋은 건지 알 수 없다. 색과 같은 임계값에서 뽑은 라벨을 붙인다. */}
              <span className={scoreBand(erpPreview.quality_score).badge}>
                {scoreBand(erpPreview.quality_score).grade}
              </span>
            </p>
            {/* 막대도 점수와 같은 색을 쓴다 — 같은 값을 두 색으로 그리면 어느 쪽이 뜻인지 흐려진다. */}
            <div className={styles.scoreBar}>
              <div
                className={`${styles.scoreFill} ${scoreBand(erpPreview.quality_score).fill}`}
                style={{ width: `${erpPreview.quality_score}%` }}
              />
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
            {/*
              결론만 말하고 원인을 빼면 "품질 보통인데 왜 못 넣지"가 된다. 점수와 판정은 다른
              축이라(점수는 데이터가 얼마나 깨끗한가, 판정은 넣어도 되는가) 71점이면서 반영
              불가인 상태가 정상이다 — 그 둘을 이어붙이는 일을 화면이 대신한다.
            */}
            <p className={erpPreview.committable ? styles.verdictOk : styles.verdictBlocked}>
              최종 판정 ·{' '}
              {erpPreview.committable
                ? 'DB 반영 가능'
                : `DB 반영 불가 (${blockedCause(erpPreview)})`}
            </p>
          </section>
        </>
      )}

      {mode === 'RAG' && ragPreview && !committed && (
        <section className={styles.card}>
          {/* ERP의 "가져오기 요약"과 같은 자리·같은 성격의 정보 카드다. 번호는 버튼 카드가 갖는다. */}
          <h2 className={styles.cardHeading}>등록 요약</h2>
          <ul className={styles.summaryList}>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>신규 계약</span>
              <span className={styles.summaryCount}>
                {ragPreview.existing_contract_id
                  ? '불가 (이미 존재)'
                  : ragPreview.expected_new_contract_id ?? '자동 발급'}
              </span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>문서</span>
              <span className={styles.summaryCount}>1건</span>
            </li>
            <li className={styles.summaryItem}>
              <span className={styles.summaryLabel}>RAG 색인</span>
              <span className={styles.summaryCount}>{ragPreview.text_extracted ? '신규 임베딩' : '원문 미확인'}</span>
            </li>
          </ul>
          <p className={ragPreview.existing_contract_id ? styles.verdictBlocked : styles.verdictOk}>
            최종 판정 · {ragPreview.existing_contract_id ? '신규 등록 불가' : '신규 등록 가능'}
          </p>
        </section>
      )}

      {!committed ? (
        <section className={styles.card}>
          {/*
            스텝퍼의 4단계가 바로 이 카드다(1 업로드 · 2 검증 · 3 매핑 · 4 승인/거부 · 5 반영 완료).
            예전에는 ERP가 번호 없는 "DB 반영 결정", RAG가 "5. DB 반영"이었는데, RAG 쪽은 아래
            "5. 반영 완료"와 번호가 겹쳐 5가 두 개였다. 두 모드 모두 스텝퍼와 같은 번호를 쓴다.
          */}
          <h2 className={styles.cardHeading}>4. 승인 또는 거부</h2>
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
/**
 * 반영이 막힌 이유.
 *
 * <p>서버의 판정식({@code committable = totalErrors == 0 && totalRows > 0})을 그대로 뒤집어
 * 읽는다. 조건을 화면에서 새로 만들면, 서버가 막은 이유와 화면이 대는 이유가 갈릴 수 있다.
 *
 * <p>마지막 줄은 지금 식으로는 닿지 않는 자리다. 그래도 사유를 지어내지 않고 남겨 둔다 —
 * 나중에 판정 조건이 늘면 여기서 조용히 틀린 말을 하는 대신 "확인 필요"로 드러난다.
 */
function blockedCause(preview: ErpImportPreview): string {
  if (preview.total_errors > 0) return `오류 ${preview.total_errors.toLocaleString()}건`
  if (preview.total_rows === 0) return '반영할 행 없음'
  return '사유 확인 필요'
}

/**
 * 품질 점수의 색과 등급 라벨.
 *
 * <p>둘을 한 함수에서 뽑는다. 임계값을 따로 두면 한쪽만 고쳤을 때 "초록인데 보통" 같은
 * 조합이 나오는데, 색과 라벨이 어긋나면 어느 쪽을 믿어야 할지 알 수 없다.
 */
function scoreBand(score: number): {
  tone: string
  badge: string
  fill: string
  grade: string
} {
  if (score >= 80) {
    return {
      tone: styles.scoreNormal,
      badge: styles.badgeNormal,
      fill: styles.fillNormal,
      grade: '우수',
    }
  }
  if (score >= 60) {
    return {
      tone: styles.scoreWarning,
      badge: styles.badgeWarning,
      fill: styles.fillWarning,
      grade: '보통',
    }
  }
  return {
    tone: styles.scoreCritical,
    badge: styles.badgeCritical,
    fill: styles.fillCritical,
    grade: '미흡',
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'medium' })
}
