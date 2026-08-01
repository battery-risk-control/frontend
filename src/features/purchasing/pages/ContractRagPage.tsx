import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchContractDetail,
  fetchContracts,
  isContractRagApiConfigured,
  reprocessContractDocuments,
  searchClauses,
  uploadContractDocument,
} from '../../../api/contractRag.api'
import type {
  ContractClauseHit,
  ContractClauseSearchResult,
  ContractDetail,
  ContractEvidenceRef,
  ContractSummary,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { useAuthState } from '../../../lib/useAuthState'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import styles from './ContractRagPage.module.css'

const DEFAULT_QUERY = '납기 지연과 공급 중단 시 적용되는 계약 조항'
const TOP_K = 5

/**
 * 1계층 구매팀 "계약 · RAG 검색". 좌측 조항 검색 결과 + 우측 계약 문서 2단 구성.
 *
 * 검색은 기본적으로 **전체 계약**을 훑는다(백엔드 scope="all") — 화면이 검색창에 문장만 넣고
 * 조항을 찾는 흐름이기 때문이다. 계약을 고르면 그 계약으로 좁힌다.
 *
 * 우측 패널은 조항을 고르면 그 조항이 속한 계약으로 바뀐다. 여기서 계약서를 추가로 올리거나
 * (드롭 → "문서 재처리") 이미 적재된 문서를 다시 임베딩할 수 있고, 담아 둔 근거로 AI 브리핑을
 * 돌릴 수 있다.
 *
 * **유사도 점수는 임베딩이 실제 모델일 때만 뜻이 있다.** 백엔드가 `mock: true`를 내려주면
 * 점수가 무의미하므로 화면이 경고를 띄운다 — 조용히 숫자만 보여주면 "0.61"을 실제 유사도로
 * 읽게 된다.
 */
export function ContractRagPage() {
  const { accessToken } = useAuthState()
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [query, setQuery] = useState(DEFAULT_QUERY)
  const [scopeContractId, setScopeContractId] = useState<number | null>(null)
  const [search, setSearch] = useState<ContractClauseSearchResult | null>(null)
  const [selectedClause, setSelectedClause] = useState<ContractClauseHit | null>(null)
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [evidence, setEvidence] = useState<ContractEvidenceRef[]>([])
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [panelNotice, setPanelNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apiConfigured = isContractRagApiConfigured()

  useEffect(() => {
    if (!accessToken || !apiConfigured) return
    let cancelled = false
    async function load(token: string) {
      try {
        const result = await fetchContracts(token)
        if (!cancelled) setContracts(result)
      } catch {
        // 계약 목록은 검색 범위를 좁히는 보조 수단이라, 실패해도 전체 검색은 그대로 된다.
        if (!cancelled) setContracts([])
      }
    }
    void load(accessToken)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured])

  async function handleSearch() {
    if (!accessToken || !query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setPanelNotice(null)
    try {
      const result = await searchClauses(accessToken, query.trim(), {
        contractId: scopeContractId,
        topK: TOP_K,
      })
      setSearch(result)
      // 첫 결과의 계약을 우측 패널에 미리 띄운다 — 사진처럼 검색 직후에도 우측이 비지 않게.
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
   * 결과를 반영하려고 이 함수를 부르는데, 여기서 지우면 "31개 청크 적재" 같은 결과 문구가
   * 뜨자마자 사라진다. 문구를 비우는 것은 조항을 새로 고르는 쪽의 몫이다.
   */
  async function loadContract(contractId: number) {
    if (!accessToken) return
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

  /** "근거로 사용하기" 토글. 같은 조항을 다시 누르면 담았던 것을 뺀다. */
  function toggleEvidence(hit: ContractClauseHit) {
    setEvidence((previous) => {
      const exists = previous.some(
        (item) => item.document_id === hit.document_id && item.chunk_index === hit.chunk_index,
      )
      if (exists) {
        return previous.filter(
          (item) => !(item.document_id === hit.document_id && item.chunk_index === hit.chunk_index),
        )
      }
      return [...previous, {
        document_id: hit.document_id,
        chunk_index: hit.chunk_index,
        clause_title: hit.clause_title,
      }]
    })
  }

  /**
   * "문서 재처리" 버튼. 드롭존에 파일이 올라와 있으면 그 파일을 업로드(=적재)하고,
   * 없으면 이미 적재된 문서를 다시 임베딩한다 — 사진의 흐름("문서를 끌어다 놓고 재처리를
   * 누르면 저장된다")과 운영상의 재적재를 한 버튼에서 처리한다.
   */
  async function handleProcess() {
    if (!accessToken || !detail) return
    setIsProcessing(true)
    setPanelError(null)
    setPanelNotice(null)
    try {
      if (stagedFile) {
        const result = await uploadContractDocument(
          accessToken, detail.contract.contract_id, stagedFile)
        setPanelNotice(result.duplicate
          ? `이미 적재된 문서입니다 (${result.original_file_name}). 다시 임베딩하지 않았습니다.`
          : `업로드 완료 — ${result.original_file_name} · ${result.chunk_count}개 청크 적재`)
        setStagedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        const result = await reprocessContractDocuments(
          accessToken, detail.contract.contract_id)
        setPanelNotice(
          `재처리 완료 — 성공 ${result.success_count}건 · 실패 ${result.failed_count}건`)
      }
      await loadContract(detail.contract.contract_id)
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : '문서 처리에 실패했습니다.')
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * 이 계약을 AI 브리핑 화면으로 넘긴다. 실행은 그 화면의 "LLM 브리핑 생성"이 맡는다.
   *
   * 담아 둔 근거(evidence)는 함께 넘기지 않는다 — 예전에도 응답에 그대로 실려 돌아올 뿐
   * 판정에는 반영되지 않았고(그래프에 외부 근거 주입 입구가 없다), AI 브리핑 화면은 계약 RAG
   * Agent가 직접 조항을 검색해 근거로 쓴다.
   */
  function handleBriefing() {
    if (!detail) return
    navigate(`/purchasing/ai-briefing?source=CONTRACT&ref=${detail.contract.contract_id}`)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) setStagedFile(file)
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
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
              placeholder={DEFAULT_QUERY}
              aria-label="검색어"
            />
            <label className={styles.scopeSelect}>
              <span>검색 범위</span>
              <select
                value={scopeContractId ?? ''}
                onChange={(event) =>
                  setScopeContractId(event.target.value ? Number(event.target.value) : null)
                }
              >
                <option value="">전체 계약</option>
                {contracts.map((contract) => (
                  <option key={contract.contract_id} value={contract.contract_id}>
                    {contract.erp_contract_id ?? `#${contract.contract_id}`} · {contract.contract_name}
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

          {!apiConfigured && (
            <p className={styles.notice}>
              백엔드 API가 설정되지 않았습니다(<code>VITE_API_BASE_URL</code>).
              실 데이터를 보려면 <code>npm run dev:live</code>로 실행하세요.
            </p>
          )}

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
                <p className={styles.notice}>
                  검색어를 넣고 "계약서 검색"을 누르면 의미가 가까운 조항을 유사도 순으로 보여줍니다.
                </p>
              )}
              {search && search.results.length === 0 && (
                <p className={styles.notice}>
                  일치하는 조항이 없습니다. 검색 범위를 전체 계약으로 넓히거나 표현을 바꿔 보세요.
                </p>
              )}

              <ul className={styles.clauseList}>
                {search?.results.map((hit) => {
                  const key = `${hit.document_id}-${hit.chunk_index}`
                  const isSelected =
                    selectedClause?.document_id === hit.document_id &&
                    selectedClause?.chunk_index === hit.chunk_index
                  const isEvidence = evidence.some(
                    (item) =>
                      item.document_id === hit.document_id &&
                      item.chunk_index === hit.chunk_index,
                  )
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
                      <div className={styles.clauseActions}>
                        <button
                          type="button"
                          className={isEvidence
                            ? `${styles.evidenceButton} ${styles.evidenceButtonActive}`
                            : styles.evidenceButton}
                          onClick={() => toggleEvidence(hit)}
                        >
                          {isEvidence ? '근거에서 빼기' : '근거로 사용하기'}
                        </button>
                      </div>
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
                      onChange={(event) => setStagedFile(event.target.files?.[0] ?? null)}
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

                  <button
                    type="button"
                    className={styles.primaryButton}
                    onClick={handleBriefing}
                    disabled={!detail.briefing_available}
                  >
                    이 근거로 AI 브리핑 생성
                  </button>

                  {!detail.briefing_available && detail.briefing_blocked_reason && (
                    <p className={styles.notice}>{detail.briefing_blocked_reason}</p>
                  )}
                  {detail.briefing_available && evidence.length > 0 && (
                    <p className={styles.notice}>담아 둔 근거 {evidence.length}건</p>
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
