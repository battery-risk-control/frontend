import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LOGIN_REQUIRED_MESSAGE,
  fetchContractDetail,
  fetchContracts,
  reprocessContractDocuments,
  searchClauses,
  uploadContractDocument,
} from '../../../api/publicContractRag.api'
import type {
  ContractClauseHit,
  ContractClauseSearchResult,
  ContractDetail,
  ContractSummary,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { useAuthState } from '../../../lib/useAuthState'
import { PUBLIC_SIDE_NAV_ITEMS } from '../../../lib/publicNav'
import styles from './PublicContractRagPage.module.css'

const DEFAULT_QUERY = '납기 지연과 공급 중단 시 적용되는 계약 조항'
const TOP_K = 5

/** 백엔드 DocumentService가 받는 형식·크기와 같은 값. 어긋나면 화면이 통과시킨 파일이 서버에서 막힌다. */
const ALLOWED_EXTENSIONS = ['.pdf', '.txt']
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

/**
 * 비로그인 `/public/contract-rag` — 구매팀 1계층 "계약 · RAG 검색"을
 * `origin/minji-tier1-dashboard`의 `ContractRagPage.tsx` 기준으로 이식했다(2026-08-03,
 * 지난 `5bfd7db`가 구버전 `origin/minji` 기준이었던 것을 정정 — 계약 선택 드롭다운이 상세
 * 패널을 직접 여는 동작, 파일 확장자/크기 검증(`stageFile`)이 이번에 새로 반영됐다).
 *
 * **"근거로 사용하기"(evidence) 기능이 이번에 함께 제거됐다.** tier1 원저자 주석: "그 조항은
 * 멀티에이전트 판정에 전혀 반영되지 않아(그래프에 외부 근거를 주입할 입구가 없다) UI째로
 * 걷어냈다 — 효과 없는 선택지를 남겨두면 사용자가 '내가 고른 근거로 분석됐다'고 믿게 된다."
 * 구버전(`origin/minji`) 기준이던 이 화면에 남아있던 낡은 기능이라 이번 동기화로 함께 뺐다.
 *
 * **업로드 UI는 로그인 상태에서만 노출한다**(이번 작업 3단계) — 검색·조회·상세는 비로그인도
 * 그대로 이용 가능하지만, 계약서 업로드·재처리는 `accessToken`이 있을 때만 드롭존과 버튼을
 * 렌더하고, 없으면 "로그인 후 이용 가능합니다" 안내로 대체한다.
 *
 * 원본과의 나머지 차이(완전 공개 + mock 폴백)는 `PublicRiskMonitoringPage.tsx` 최상단 주석
 * 참고 — 업로드·재처리 자체는 mock 모드에서 `UPLOAD_NOT_READY_MESSAGE`("준비 중")로 대체된다.
 */
export function PublicContractRagPage() {
  const { accessToken } = useAuthState()
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  // 검색창은 비워 두고 예시는 결과 패널의 버튼으로 제공한다(구매팀과 동일) — 미리 채워두면
  // 다른 걸 검색하려는 사람이 매번 지워야 한다.
  const [query, setQuery] = useState('')
  const [scopeContractId, setScopeContractId] = useState<number | null>(null)
  const [search, setSearch] = useState<ContractClauseSearchResult | null>(null)
  const [selectedClause, setSelectedClause] = useState<ContractClauseHit | null>(null)
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [panelNotice, setPanelNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * 계약 목록을 불러온다. **적재되지 않은 계약도 포함한다**(`includeUnindexed`) —
   * 문서가 0건인 신규 계약은 검색 결과에 나올 수가 없어서, 이 목록에서 빠지면 첫 문서를
   * 올릴 방법이 아예 사라진다. 대신 항목에 "미적재"를 붙여 검색이 빌 것임을 미리 알린다.
   */
  const fetchContractList = useCallback(async (): Promise<ContractSummary[]> => {
    try {
      return await fetchContracts(accessToken, true)
    } catch {
      // 계약 목록은 보조 수단이라, 실패해도 전체 계약 검색은 그대로 된다.
      return []
    }
  }, [accessToken])

  useEffect(() => {
    let cancelled = false
    void fetchContractList().then((rows) => {
      if (!cancelled) setContracts(rows)
    })
    return () => {
      cancelled = true
    }
  }, [fetchContractList])

  async function handleSearch() {
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setPanelNotice(null)
    try {
      const result = await searchClauses(accessToken, query.trim(), {
        contractId: scopeContractId,
        topK: TOP_K,
      })
      setSearch(result)
      // 첫 결과의 계약을 우측 패널에 미리 띄운다 — 검색 직후에도 우측이 비지 않게.
      const first = result.results[0]
      if (first) {
        setSelectedClause(first)
        if (first.contract) void loadContract(first.contract.contract_id)
      }
    } catch (err) {
      setSearch(null)
      setSearchError(err instanceof Error ? err.message : '계약 조항 검색에 실패했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  /**
   * 우측 패널 갱신. **안내 문구(panelNotice)는 지우지 않는다** — 업로드·재처리 직후에도
   * 결과를 반영하려고 이 함수를 부르는데, 여기서 지우면 결과 문구가 뜨자마자 사라진다.
   */
  async function loadContract(contractId: number) {
    setPanelError(null)
    try {
      setDetail(await fetchContractDetail(accessToken, contractId))
    } catch (err) {
      setDetail(null)
      setPanelError(err instanceof Error ? err.message : '계약 문서를 불러오지 못했습니다.')
    }
  }

  function handleSelectClause(hit: ContractClauseHit) {
    setSelectedClause(hit)
    setPanelNotice(null)
    if (hit.contract) void loadContract(hit.contract.contract_id)
  }

  /**
   * 계약 선택. 검색 범위를 좁히는 것과 **우측 패널을 여는 것**을 한 번에 한다 —
   * 검색 결과가 없어도(=문서 미적재 계약이어도) 계약 상세로 들어가 첫 문서를 올릴 수 있어야 한다.
   */
  function handleSelectContract(contractId: number | null) {
    setScopeContractId(contractId)
    setPanelNotice(null)
    setSelectedClause(null)
    if (contractId === null) {
      setDetail(null)
      return
    }
    void loadContract(contractId)
  }

  /**
   * "문서 재처리" 버튼. 드롭존에 파일이 올라와 있으면 그 파일을 업로드(=적재)하고,
   * 없으면 이미 적재된 문서를 다시 임베딩한다.
   */
  async function handleProcess() {
    if (!detail) return
    setIsProcessing(true)
    setPanelError(null)
    setPanelNotice(null)
    try {
      if (stagedFile) {
        const result = await uploadContractDocument(
          accessToken, detail.contract.contract_id, stagedFile)
        setPanelNotice(result.duplicate
          ? `이미 적재된 문서입니다 (${result.original_file_name}). 다시 임베딩하지 않았습니다.`
          : `업로드 완료 — ${result.original_file_name} · ${result.chunk_count}개 청크 적재.`
            + ' 새 조항을 찾으려면 "계약서 검색"을 다시 누르세요.')
        setStagedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        const result = await reprocessContractDocuments(
          accessToken, detail.contract.contract_id)
        setPanelNotice(
          `재처리 완료 — 성공 ${result.success_count}건 · 실패 ${result.failed_count}건`)
      }
      // 상세뿐 아니라 목록도 다시 읽는다 — 목록에 청크 수·"미적재" 표시가 붙어 있어서
      // 여기서 갱신하지 않으면 방금 올린 계약이 계속 "미적재"로 남는다.
      const [, rows] = await Promise.all([
        loadContract(detail.contract.contract_id),
        fetchContractList(),
      ])
      setContracts(rows)
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : '문서 처리에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * 드롭·파일선택 공통 검증. 백엔드도 같은 규칙으로 막지만, 그쪽은 **버튼을 누른 뒤에야**
   * 알려준다 — 파일을 놓는 순간 틀렸다고 말해주는 편이 낫다.
   */
  function stageFile(file: File | null) {
    if (!file) {
      setStagedFile(null)
      return
    }
    const name = file.name.toLowerCase()
    if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
      setStagedFile(null)
      setPanelError(`PDF 또는 TXT 파일만 올릴 수 있습니다 — ${file.name}`)
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStagedFile(null)
      setPanelError(
        `파일이 너무 큽니다(${formatFileSize(file.size)}). 50MB 이하만 올릴 수 있습니다.`)
      return
    }
    setPanelError(null)
    setStagedFile(file)
  }

  /**
   * 이 계약을 AI 브리핑 화면으로 넘긴다. 실행은 그 화면의 "LLM 브리핑 생성"이 맡는다.
   * 넘기는 것은 계약 하나뿐이다(evidence 없음, 위 컴포넌트 주석 참고).
   */
  function handleBriefing() {
    if (!detail) return
    navigate(`/public/ai-briefing?source=CONTRACT&ref=${detail.contract.contract_id}`)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    stageFile(event.dataTransfer.files?.[0] ?? null)
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PUBLIC_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>계약 · RAG 검색</h1>
            <p className={styles.subheading}>
              계약서에서 위험 관련 조항을 검색하고 실제 근거를 확인합니다
            </p>
          </div>

          <section className={styles.searchBar} aria-label="계약 조항 검색">
            <input
              type="search"
              className={styles.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSearch()
              }}
              placeholder={`ex) ${DEFAULT_QUERY}`}
              aria-label="검색어"
            />
            <label className={styles.scopeSelect}>
              <span>계약 선택</span>
              <select
                value={scopeContractId ?? ''}
                onChange={(event) =>
                  handleSelectContract(event.target.value ? Number(event.target.value) : null)
                }
              >
                <option value="">전체 계약</option>
                {contracts.map((contract) => (
                  <option key={contract.contract_id} value={contract.contract_id}>
                    {contract.erp_contract_id ?? `#${contract.contract_id}`} · {contract.contract_name}
                    {contract.document_count === 0
                      ? ' (미적재)'
                      : ` (${contract.indexed_chunk_count}청크)`}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.searchButton}
              onClick={() => void handleSearch()}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? '검색 중…' : '계약서 검색'}
            </button>
          </section>

          {search?.mock && (
            <p className={styles.warning}>
              임베딩이 mock 모드입니다(<code>EMBEDDING_PROVIDER=mock</code>). 아래 유사도 점수는
              실제 의미 유사도가 아니므로 근거 판단에 쓰지 마세요.
            </p>
          )}

          <div className={styles.split}>
            <section className={styles.panel} aria-labelledby="clause-list-heading">
              <h2 id="clause-list-heading" className={styles.panelHeading}>
                {search
                  ? `검색 결과 · ${search.scope === 'all'
                      ? `전체 계약 ${search.result_count}건`
                      : `contract_id ${search.contract_id}`}`
                  : '검색 결과'}
              </h2>

              {searchError && <p className={styles.error}>{searchError}</p>}
              {!search && !searchError && (
                <div className={styles.notice}>
                  <p className={styles.emptyLead}>
                    검색어를 넣고 "계약서 검색"을 누르면 의미가 가까운 조항을 유사도 순으로 보여줍니다.
                  </p>
                  <button
                    type="button"
                    className={styles.exampleQuery}
                    onClick={() => setQuery(DEFAULT_QUERY)}
                  >
                    예시: {DEFAULT_QUERY}
                  </button>
                </div>
              )}
              {search && search.results.length === 0 && (
                <p className={styles.notice}>
                  {detail && detail.contract.document_count === 0
                    ? '이 계약에는 적재된 문서가 없습니다. 우측에서 계약서를 올린 뒤 다시 검색하세요.'
                    : '일치하는 조항이 없습니다. 계약 선택을 전체 계약으로 넓히거나 표현을 바꿔 보세요.'}
                </p>
              )}

              <ul className={styles.clauseList}>
                {search?.results.map((hit) => {
                  const key = `${hit.document_id}-${hit.chunk_index}`
                  const isSelected =
                    selectedClause?.document_id === hit.document_id &&
                    selectedClause?.chunk_index === hit.chunk_index
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className={isSelected
                          ? `${styles.clauseCard} ${styles.clauseCardSelected}`
                          : styles.clauseCard}
                        onClick={() => handleSelectClause(hit)}
                        aria-current={isSelected}
                      >
                        <span className={styles.clauseTop}>
                          <span className={styles.clauseTitle}>{hit.clause_title}</span>
                          <span className={styles.clauseScore}>
                            유사도 {hit.similarity_score.toFixed(2)}
                          </span>
                        </span>
                        <p className={styles.clauseMeta}>
                          {hit.contract?.erp_contract_id ?? `contract_id ${hit.contract?.contract_id ?? '—'}`}
                          {' · '}page {hit.page_number} · source: {hit.source}
                        </p>
                        <p className={styles.clauseContent}>{truncate(hit.content)}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className={styles.panel} aria-labelledby="contract-doc-heading">
              <h2 id="contract-doc-heading" className={styles.panelHeading}>계약 문서</h2>
              {panelError && <p className={styles.error}>{panelError}</p>}
              {panelNotice && <p className={styles.warning}>{panelNotice}</p>}
              {!detail && !panelError && (
                <p className={styles.notice}>검색 결과에서 조항을 선택하세요.</p>
              )}

              {detail && (
                <>
                  <p className={styles.contractCode}>
                    {detail.contract.erp_contract_id ?? `#${detail.contract.contract_id}`}
                  </p>
                  <p className={styles.contractName}>{detail.contract.contract_name}</p>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>계약 기간</span>
                    <p className={styles.fieldValue}>
                      {formatDate(detail.contract.start_date)} — {formatDate(detail.contract.end_date)}
                    </p>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>공급사 / 자재</span>
                    <p className={styles.fieldValue}>
                      {detail.contract.erp_supplier_id ?? '—'} / {detail.contract.erp_material_id ?? '—'}
                    </p>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>임베딩</span>
                    <p className={styles.embedding}>
                      {detail.embedding_type ?? '미적재'}
                      <br />
                      {detail.embedding_version ?? '—'}
                      <br />
                      mock: {String(detail.mock_embedding ?? '—')}
                    </p>
                  </div>

                  {detail.documents.length > 0 && (
                    <ul className={styles.documentList}>
                      {detail.documents.map((document) => (
                        <li key={document.document_id}>
                          {document.original_file_name} · {document.chunk_count}청크 ·{' '}
                          {document.processing_status}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 업로드 UI는 로그인 상태에서만 노출한다(이번 작업 3단계) — 검색·조회·상세는
                      비로그인도 그대로, 계약서 업로드·재처리만 로그인을 요구한다. */}
                  {accessToken ? (
                    <>
                      <div
                        className={isDragging ? `${styles.dropZone} ${styles.dropZoneActive}` : styles.dropZone}
                        onDragOver={(event) => {
                          event.preventDefault()
                          setIsDragging(true)
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                      >
                        <p className={styles.dropZoneTitle}>계약서 추가 업로드</p>
                        <p className={styles.dropZoneHint}>
                          {stagedFile
                            ? `선택됨: ${stagedFile.name} — "문서 재처리"를 누르면 적재합니다`
                            : 'PDF / TXT 파일 끌어놓기'}
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt"
                          className={styles.fileInput}
                          onChange={(event) => stageFile(event.target.files?.[0] ?? null)}
                          aria-label="계약서 파일 선택"
                        />
                      </div>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => void handleProcess()}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중…' : '문서 재처리'}
                      </button>
                    </>
                  ) : (
                    <p className={styles.notice}>{LOGIN_REQUIRED_MESSAGE}</p>
                  )}

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleBriefing}
                    disabled={!detail.briefing_available}
                  >
                    이 계약으로 AI 브리핑 생성
                  </button>

                  {!detail.briefing_available && detail.briefing_blocked_reason && (
                    <p className={styles.notice}>{detail.briefing_blocked_reason}</p>
                  )}
                </>
              )}
            </section>
          </div>

        </main>
      </div>
      <Footer />
    </div>
  )
}

/** 카드에는 조항 앞부분만 보여준다 — 전체 원문은 조항을 골랐을 때 우측 계약에서 확인한다. */
function truncate(content: string, max = 260): string {
  const normalized = content.replace(/\s*\n\s*/g, ' ').trim()
  return normalized.length > max ? `${normalized.slice(0, max)}…` : normalized
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return value.replaceAll('-', '.')
}

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024)
  return megabytes >= 1 ? `${megabytes.toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`
}
