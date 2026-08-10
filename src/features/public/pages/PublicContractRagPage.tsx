import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LOGIN_REQUIRED_MESSAGE,
  fetchContractDetail,
  fetchOutboundContractDetail,
  fetchContracts,
  reprocessContractDocuments,
  searchClauses,
  uploadContractDocument,
} from '../../../api/publicContractRag.api'
import type { ContractSearchKind } from '../../../api/publicContractRag.api'
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
import { SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import { hasMeaningfulPageNumbers } from '../../../lib/clausePages'
import { useAuthState } from '../../../lib/useAuthState'
import { PUBLIC_SIDE_NAV_ITEMS } from '../../../lib/publicNav'
import styles from './PublicContractRagPage.module.css'

/**
 * 검색창 placeholder이자 빈 결과 화면의 "예시" 버튼 문구.
 *
 * <p>예전에는 이 문장이 `query`의 <b>초기값</b>이라 검색창에 그대로 박혀 있었다. 처음 한 번은
 * 편하지만 그다음부터는 매번 전체 선택 후 지워야 해서, 자주 쓰는 사람일수록 손해였다.
 */
const EXAMPLE_QUERY = '납기 지연과 공급 중단 시 적용되는 계약 조항'
/**
 * 백엔드에서 받아올 청크 수.
 *
 * <p>화면에 세울 조항은 {@link DISPLAY_LIMIT}개뿐인데 그보다 넉넉히 받는 이유: 적재된 계약서
 * 30개가 **같은 템플릿으로 만들어져** 있어서, 예컨대 "제5조 불가항력"은 계약이 달라도 본문이
 * 글자 하나까지 같다. 5건만 받으면 그 5자리를 같은 조항 하나가 전부 먹어 검색이 고장 난 것처럼
 * 보인다(실제로 그랬다). 넉넉히 받아 합친 뒤 서로 다른 조항으로 자리를 채운다.
 */
const SEARCH_TOP_K = 20

/** 합친 뒤 화면에 세울 조항 수. */
const DISPLAY_LIMIT = 5

/** 계약 종류의 사람 말 라벨 — 매입(공급사→자사) / 납품(자사→고객사). */
const KIND_LABEL: Record<'INBOUND' | 'OUTBOUND', string> = {
  INBOUND: '원자재 매입 계약',
  OUTBOUND: '제품 납품 계약',
}

/** 검색 결과 카드에 다는 짧은 배지 문구. */
const KIND_BADGE: Record<'INBOUND' | 'OUTBOUND', string> = {
  INBOUND: '매입',
  OUTBOUND: '납품',
}

/** 종류별 방향 부연. */
const KIND_HINT: Record<'INBOUND' | 'OUTBOUND', string> = {
  INBOUND: '공급사 → 자사',
  OUTBOUND: '자사 → 고객사',
}

/** select의 범위 값(문자열)을 검색 API 옵션으로 바꾼다. (ContractRagPage와 동일 규칙) */
function scopeToSearchOptions(
  scopeValue: string,
  contracts: ContractSummary[],
): { kind: ContractSearchKind; contractId?: number | null; productId?: number | null; customerId?: number | null } {
  if (scopeValue === 'ALL') return { kind: 'ALL' }
  if (scopeValue === 'KIND:INBOUND') return { kind: 'INBOUND' }
  if (scopeValue === 'KIND:OUTBOUND') return { kind: 'OUTBOUND' }

  const contract = scopeSelectedContract(scopeValue, contracts)
  if (!contract) return { kind: 'ALL' }
  if (contract.kind === 'OUTBOUND') {
    return { kind: 'OUTBOUND', productId: contract.product_id, customerId: contract.customer_id }
  }
  return { kind: 'INBOUND', contractId: contract.contract_id }
}

/** 범위 값이 특정 계약을 가리키면 그 계약을, 아니면 null을 돌려준다. */
function scopeSelectedContract(
  scopeValue: string,
  contracts: ContractSummary[],
): ContractSummary | null {
  const match = /^C:(INBOUND|OUTBOUND):(\d+)$/.exec(scopeValue)
  if (!match) return null
  const kind = match[1] as 'INBOUND' | 'OUTBOUND'
  const contractId = Number(match[2])
  return contracts.find((c) => c.kind === kind && c.contract_id === contractId) ?? null
}

/**
 * 우측 패널의 처리 결과 안내.
 *
 * <p>예전에는 문자열 하나를 `.warning`으로 그렸다. 업로드가 성공해도 경고 박스가 떠서
 * "뭔가 잘못됐나" 싶었고, 파일명·청크 수·다음 할 일이 한 문단에 뭉쳐 있어 읽히지도 않았다.
 * 성패를 색으로 가르고 제목과 본문을 나눈다.
 */
interface PanelNotice {
  tone: 'success' | 'info' | 'warning'
  title: string
  detail?: string
}

const NOTICE_TONE_CLASS: Record<PanelNotice['tone'], string> = {
  success: styles.success,
  info: styles.info,
  warning: styles.warning,
}

/** 문서 적재 상태 → 한글. 정상(COMPLETED)일 때는 아예 표시하지 않으므로 여기 없어도 된다. */
const DOCUMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: '적재 대기',
  PROCESSING: '적재 중',
  FAILED: '적재 실패',
}

/** 백엔드 DocumentService가 받는 형식·크기와 같은 값. 어긋나면 화면이 통과시킨 파일이 서버에서 막힌다. */
const ALLOWED_EXTENSIONS = ['.pdf', '.txt']
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

/**
 * 비로그인 `/public/contract-rag` — 구매팀 1계층 "계약 · RAG 검색"을
 * `ContractRagPage.tsx` 최신본 기준으로 동기화했다(2026-08-06). 검색은 기본적으로 **전체
 * 계약**을 훑는다(백엔드 scope="all"). 계약을 고르면 그 계약으로 좁힌다.
 *
 * 우측 패널은 조항을 고르면 그 조항이 속한 계약으로 바뀐다. **계약 선택 드롭다운으로도 열린다** —
 * 문서가 하나도 없는 신규 계약은 검색에 걸릴 수가 없어서, 드롭다운이 유일한 진입로다.
 *
 * **업로드 UI는 로그인 상태에서만 노출한다** — 검색·조회·상세는 비로그인도 그대로 이용
 * 가능하지만, 계약서 업로드·재처리는 `accessToken`이 있을 때만 드롭존과 버튼을 렌더하고,
 * 없으면 "로그인 후 이용 가능합니다" 안내로 대체한다.
 *
 * 원본과의 나머지 차이(완전 공개 + mock 폴백)는 `PublicRiskMonitoringPage.tsx` 최상단 주석
 * 참고 — 이 화면도 같은 원칙을 따른다.
 */
export function PublicContractRagPage() {
  const { accessToken } = useAuthState()
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  /** 계약 목록 조회 중인지. select는 자리표시자를 넣을 데가 없어 안내 문구와 비활성으로 알린다. */
  const [contractsLoading, setContractsLoading] = useState(true)
  const [query, setQuery] = useState('')
  /** 검색 범위. "ALL"·"KIND:INBOUND"·"KIND:OUTBOUND"·"C:INBOUND:<id>"·"C:OUTBOUND:<id>". */
  const [scopeValue, setScopeValue] = useState<string>('ALL')
  const [search, setSearch] = useState<ContractClauseSearchResult | null>(null)
  const [selectedClause, setSelectedClause] = useState<ContractClauseHit | null>(null)
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  /** 우측 "계약 문서" 패널이 보고 있는 계약 종류. 1단(종류) 선택값. */
  const [panelKind, setPanelKind] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND')
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [panelNotice, setPanelNotice] = useState<PanelNotice | null>(null)
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
    void fetchContractList()
      .then((rows) => {
        if (!cancelled) setContracts(rows)
      })
      .finally(() => {
        if (!cancelled) setContractsLoading(false)
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
        ...scopeToSearchOptions(scopeValue, contracts),
        topK: SEARCH_TOP_K,
      })
      setSearch(result)
      // 첫 결과의 계약을 우측 패널에 미리 띄운다 — 검색 직후에도 우측이 비지 않게.
      const first = result.results[0]
      if (first) {
        setSelectedClause(first)
        if (first.contract) void openContractDetail(first.contract)
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
    setPanelError(null)
    try {
      setDetail(await fetchContractDetail(accessToken, contractId))
    } catch (err) {
      setDetail(null)
      setPanelError(err instanceof Error ? err.message : '계약 문서를 불러오지 못했습니다.')
    }
  }

  /** 아웃바운드(제품 납품) 계약 상세. 인바운드와 엔드포인트가 갈려 별도 함수로 둔다. */
  async function loadOutboundContract(outboundContractId: number) {
    setPanelError(null)
    try {
      setDetail(await fetchOutboundContractDetail(accessToken, outboundContractId))
    } catch (err) {
      setDetail(null)
      setPanelError(err instanceof Error ? err.message : '계약 문서를 불러오지 못했습니다.')
    }
  }

  /** 계약 종류를 보고 알맞은 상세 엔드포인트로 연다. 우측 패널의 1단(종류) 선택도 맞춘다. */
  function openContractDetail(contract: ContractSummary) {
    setPanelKind(contract.kind)
    if (contract.kind === 'OUTBOUND') {
      void loadOutboundContract(contract.contract_id)
    } else {
      void loadContract(contract.contract_id)
    }
  }

  function handleSelectClause(hit: ContractClauseHit) {
    setSelectedClause(hit)
    setPanelNotice(null)
    if (hit.contract) {
      openContractDetail(hit.contract)
    } else {
      setDetail(null)
    }
  }

  /**
   * 검색 범위만 바꾼다. 결과는 다음 검색부터 반영된다 — 필터를 건드렸다고 이미 받아둔 결과를
   * 지우면, 범위를 이리저리 바꿔 보는 동안 화면이 계속 비어 버린다.
   */
  function handleChangeScope(value: string) {
    setScopeValue(value)
  }

  /**
   * 우측 "계약 문서" 패널을 연다.
   *
   * <p>검색을 거치지 않는 진입로가 반드시 필요하다 — 문서가 0건인 계약은 검색에 걸릴 수가
   * 없어서, 이 선택기가 없으면 첫 계약서를 올릴 방법이 아예 사라진다.
   */
  function handleOpenContract(contractId: number | null) {
    setPanelNotice(null)
    setSelectedClause(null)
    if (contractId === null) {
      setDetail(null)
      return
    }
    if (panelKind === 'OUTBOUND') {
      void loadOutboundContract(contractId)
    } else {
      void loadContract(contractId)
    }
  }

  /** 우측 패널 1단(계약 종류) 변경. 종류가 바뀌면 2단 선택과 상세를 비운다. */
  function handleChangePanelKind(kind: 'INBOUND' | 'OUTBOUND') {
    setPanelKind(kind)
    setSelectedClause(null)
    setPanelNotice(null)
    setDetail(null)
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
          ? {
              tone: 'info',
              title: '이미 적재된 문서입니다',
              detail: `${result.original_file_name} — 내용이 같아 다시 임베딩하지 않았습니다.`,
            }
          : {
              tone: 'success',
              title: `업로드 완료 · ${result.chunk_count}개 청크 적재`,
              detail: `${result.original_file_name} — 새 조항을 찾으려면 "조항 검색"을 다시 누르세요.`,
            })
        setStagedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        const result = await reprocessContractDocuments(
          accessToken, detail.contract.contract_id)
        // 실패가 하나라도 있으면 성공 색으로 그리지 않는다 — 초록 상자에 "실패 2건"은 안 읽힌다.
        setPanelNotice(result.failed_count > 0
          ? {
              tone: 'warning',
              title: `재처리 완료 — 실패 ${result.failed_count}건`,
              detail: `성공 ${result.success_count}건. 실패한 문서는 다시 올려야 검색에 걸립니다.`,
            }
          : {
              tone: 'success',
              title: `재처리 완료 · ${result.success_count}건`,
              detail: '새 조항을 찾으려면 "조항 검색"을 다시 누르세요.',
            })
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
   * 넘기는 것은 계약 하나뿐이다 — "근거로 사용하기"는 멀티에이전트 판정에 반영되지 않아
   * 구매팀 화면에서 이미 제거됐다.
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

  /** 현재 선택된 범위의 대상 계약(특정 계약을 골랐을 때만). 아니면 null. */
  const scopeContract = useMemo(
    () => scopeSelectedContract(scopeValue, contracts),
    [scopeValue, contracts],
  )

  /** 검색 결과 제목의 범위 표기. 무엇으로 좁혔는지 사람 말로 보여준다. */
  function scopeLabel(): string {
    if (scopeValue === 'ALL') return '전체 계약'
    if (scopeValue === 'KIND:INBOUND') return KIND_LABEL.INBOUND
    if (scopeValue === 'KIND:OUTBOUND') return KIND_LABEL.OUTBOUND
    if (scopeContract) {
      return scopeContract.erp_contract_id ?? scopeContract.contract_name ?? '선택한 계약'
    }
    return '선택한 계약'
  }

  /** 이번 검색이 특정 계약으로 좁힌 것이었으면 그 계약(아니면 null). 빈 결과 안내를 가른다. */
  const searchedContract = search && search.scope === 'filtered' ? scopeContract : null

  /** 드롭다운을 매입/납품 두 그룹으로 나눠 보여주기 위한 분리. */
  const inboundContracts = useMemo(
    () => contracts.filter((contract) => contract.kind === 'INBOUND'),
    [contracts],
  )
  const outboundContracts = useMemo(
    () => contracts.filter((contract) => contract.kind === 'OUTBOUND'),
    [contracts],
  )

  /** 같은 본문을 한 장으로 합친 뒤 화면에 세울 만큼만 남긴 목록. */
  const clauses = useMemo(
    () => (search ? mergeIdenticalClauses(search.results).slice(0, DISPLAY_LIMIT) : []),
    [search],
  )

  // 적재된 계약서가 전부 txt면 페이지가 늘 1이라 알려주는 게 없다. 갈릴 때만 보여준다.
  const showPages = hasMeaningfulPageNumbers(clauses.map((clause) => clause.hit.page_number))

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

          {/*
            위: 어디서 찾을지(검색 범위) / 아래: 무엇을 찾을지(검색어) 두 줄이다. 셋을 한 줄에
            두고 flex-wrap으로 흘리면 화면 폭에 따라 드롭다운이 내려갔다 버튼이 내려갔다 해서
            배치가 예측되지 않았고, 드롭다운은 폭에 눌려 계약명이 잘렸다.
          */}
          <section className={styles.searchBar} aria-label="계약 조항 검색">
            <label className={styles.scopeSelect}>
              <span>검색 범위</span>
              <select
                value={scopeValue}
                disabled={contractsLoading}
                onChange={(event) => handleChangeScope(event.target.value)}
              >
                <option value="ALL">
                  {contractsLoading ? '계약 목록 불러오는 중…' : '전체 계약 (매입·납품 모두)'}
                </option>
                <option value="KIND:INBOUND">
                  {KIND_LABEL.INBOUND} — 전체 ({KIND_HINT.INBOUND})
                </option>
                <option value="KIND:OUTBOUND">
                  {KIND_LABEL.OUTBOUND} — 전체 ({KIND_HINT.OUTBOUND})
                </option>
                {inboundContracts.length > 0 && (
                  <optgroup label={`${KIND_LABEL.INBOUND} · 특정 계약 (${KIND_HINT.INBOUND})`}>
                    {inboundContracts.map((contract) => (
                      <option key={`C:INBOUND:${contract.contract_id}`} value={`C:INBOUND:${contract.contract_id}`}>
                        {contract.erp_contract_id ?? `#${contract.contract_id}`} · {contract.contract_name}
                        {contract.document_count === 0 ? ' (미적재)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                {outboundContracts.length > 0 && (
                  <optgroup label={`${KIND_LABEL.OUTBOUND} · 특정 계약 (${KIND_HINT.OUTBOUND})`}>
                    {outboundContracts.map((contract) => (
                      <option key={`C:OUTBOUND:${contract.contract_id}`} value={`C:OUTBOUND:${contract.contract_id}`}>
                        {contract.erp_contract_id ?? `#${contract.contract_id}`} · {contract.contract_name}
                        {contract.document_count === 0 ? ' (미적재)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <span className={styles.scopeHint}>
                <strong>매입</strong>=원자재를 사오는 계약(공급사→자사) ·{' '}
                <strong>납품</strong>=제품을 파는 계약(자사→고객사)
              </span>
            </label>
            <div className={styles.searchRow}>
              <input
                type="search"
                className={styles.searchInput}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void handleSearch()
                }}
                placeholder={`ex) ${EXAMPLE_QUERY}`}
                aria-label="검색어"
              />
              <button
                type="button"
                className={styles.searchButton}
                onClick={() => void handleSearch()}
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? '검색 중…' : '조항 검색'}
              </button>
            </div>
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
                {search ? `검색 결과 · ${scopeLabel()} ${clauses.length}건` : '검색 결과'}
              </h2>

              {searchError && <p className={styles.error}>{searchError}</p>}
              {isSearching && (
                <div aria-busy="true" aria-label="계약 조항 검색 중">
                  <SkeletonText lines={5} lastLineWidth="55%" />
                </div>
              )}
              {!isSearching && !search && !searchError && (
                <div className={styles.notice}>
                  <p className={styles.emptyLead}>
                    찾고 싶은 상황을 문장으로 넣으면 뜻이 가까운 조항을 관련도 순으로 보여줍니다.
                  </p>
                  <button
                    type="button"
                    className={styles.exampleQuery}
                    onClick={() => setQuery(EXAMPLE_QUERY)}
                  >
                    예시: {EXAMPLE_QUERY}
                  </button>
                </div>
              )}
              {!isSearching && search && clauses.length === 0 && (
                <p className={styles.notice}>
                  {searchedContract?.document_count === 0
                    ? '이 계약에는 적재된 문서가 없습니다. 우측 "계약 문서"에서 계약서를 올린 뒤 다시 검색하세요.'
                    : '일치하는 조항이 없습니다. 검색 범위를 전체 계약으로 넓히거나 표현을 바꿔 보세요.'}
                </p>
              )}

              <ul className={styles.clauseList}>
                {clauses.map(({ hit, alsoIn }, index) => {
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
                          <span className={styles.clauseTitleWrap}>
                            {hit.contract && (
                              <span
                                className={hit.contract.kind === 'OUTBOUND'
                                  ? `${styles.kindBadge} ${styles.kindBadgeOutbound}`
                                  : `${styles.kindBadge} ${styles.kindBadgeInbound}`}
                              >
                                {KIND_BADGE[hit.contract.kind]}
                              </span>
                            )}
                            <span className={styles.clauseTitle}>{hit.clause_title}</span>
                          </span>
                          <span
                            className={styles.clauseScore}
                            title={`유사도 ${hit.similarity_score.toFixed(3)}`}
                          >
                            {index + 1}순위
                          </span>
                        </span>
                        <p className={styles.clauseMeta}>
                          {[
                            hit.contract?.erp_contract_id ?? hit.contract?.contract_name,
                            alsoIn.length > 0 ? `외 ${alsoIn.length}건에 동일 조항` : null,
                            showPages ? `p.${hit.page_number}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className={styles.clauseContent}>{previewBody(hit)}</p>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className={styles.panel} aria-labelledby="contract-doc-heading">
              <div className={styles.panelHead}>
                <h2 id="contract-doc-heading" className={styles.panelHeading}>계약 문서</h2>
                {/* 2단 선택: ① 계약 종류(매입/납품) → ② 그 종류의 특정 계약. */}
                <div className={styles.panelSelects}>
                  <select
                    className={styles.panelSelect}
                    value={panelKind}
                    disabled={contractsLoading}
                    aria-label="계약 종류 선택"
                    onChange={(event) => handleChangePanelKind(event.target.value as 'INBOUND' | 'OUTBOUND')}
                  >
                    <option value="INBOUND">{KIND_LABEL.INBOUND} ({KIND_HINT.INBOUND})</option>
                    <option value="OUTBOUND">{KIND_LABEL.OUTBOUND} ({KIND_HINT.OUTBOUND})</option>
                  </select>
                  <select
                    className={styles.panelSelect}
                    value={detail && detail.contract.kind === panelKind ? detail.contract.contract_id : ''}
                    disabled={contractsLoading}
                    aria-label="계약 선택"
                    onChange={(event) =>
                      handleOpenContract(event.target.value ? Number(event.target.value) : null)
                    }
                  >
                    <option value="">{contractsLoading ? '불러오는 중…' : '계약 선택…'}</option>
                    {(panelKind === 'INBOUND' ? inboundContracts : outboundContracts).map((contract) => (
                      <option key={contract.contract_id} value={contract.contract_id}>
                        {contract.erp_contract_id ?? `#${contract.contract_id}`} · {contract.contract_name}
                        {contract.document_count === 0 ? ' (미적재)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {panelError && <p className={styles.error}>{panelError}</p>}
              {panelNotice && (
                <div className={NOTICE_TONE_CLASS[panelNotice.tone]} role="status">
                  <p className={styles.noticeTitle}>{panelNotice.title}</p>
                  {panelNotice.detail && (
                    <p className={styles.noticeDetail}>{panelNotice.detail}</p>
                  )}
                </div>
              )}
              {!detail && !panelError && (
                <p className={styles.notice}>
                  검색 결과에서 조항을 고르면 그 조항이 속한 계약이 열립니다.
                  <br />
                  아직 계약서를 올리지 않은 계약은 검색에 걸리지 않으니, 위 목록에서 직접 골라 여기서 등록하세요.
                </p>
              )}

              {detail && (
                <>
                  <p className={styles.contractName}>{detail.contract.contract_name}</p>
                  <p className={styles.contractCode}>
                    {detail.contract.erp_contract_id ?? `#${detail.contract.contract_id}`}
                  </p>

                  {/* 계약 기간은 매입계약에만 있다(납품계약은 기간 대신 물량·단가·위약금 개념). */}
                  {detail.contract.kind === 'INBOUND' && (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>계약 기간</span>
                      <p className={styles.fieldValue}>
                        {formatDate(detail.contract.start_date)} — {formatDate(detail.contract.end_date)}
                      </p>
                    </div>
                  )}

                  {/* 종류에 따라 붙는 주체가 다르다 — 매입은 공급사·자재, 납품은 제품·고객사. */}
                  {detail.contract.kind === 'OUTBOUND' ? (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>제품 / 고객사</span>
                      <p className={styles.fieldValue}>
                        {detail.contract.product_name ?? detail.contract.erp_product_id ?? '—'}
                        {' / '}
                        {detail.contract.customer_name ?? detail.contract.erp_customer_id ?? '—'}
                      </p>
                    </div>
                  ) : (
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>공급사 / 자재</span>
                      <p className={styles.fieldValue}>
                        {detail.contract.supplier_name ?? detail.contract.erp_supplier_id ?? '—'}
                        {' / '}
                        {detail.contract.material_name ?? detail.contract.erp_material_id ?? '—'}
                      </p>
                    </div>
                  )}

                  {detail.mock_embedding === true && (
                    <p className={styles.warning}>
                      이 계약은 mock 임베딩으로 적재돼 있습니다. 조항 순서를 근거로 쓰지 마세요.
                    </p>
                  )}

                  {detail.documents.length > 0 && (
                    <ul className={styles.documentList}>
                      {detail.documents.map((document) => (
                        <li key={document.document_id}>
                          {document.original_file_name}
                          {document.processing_status !== 'COMPLETED' &&
                            ` · ${DOCUMENT_STATUS_LABEL[document.processing_status] ?? document.processing_status}`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 업로드·재처리는 매입계약 전용 엔드포인트다. 납품계약은 조회만 가능하고,
                      매입계약이라도 업로드는 로그인 상태에서만 — 검색·조회는 비로그인도 그대로다. */}
                  {detail.contract.kind === 'OUTBOUND' ? (
                    <p className={styles.notice}>
                      납품계약 문서는 여기서 조회만 할 수 있습니다. 계약서 등록·재처리는
                      "데이터 관리" 화면의 납품계약 업로드를 이용하세요.
                    </p>
                  ) : accessToken ? (
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

/** 본문이 같은 조항을 한 장으로 묶은 것. */
interface MergedClause {
  /** 대표 조항. 검색 결과가 관련도 순이므로 같은 본문 중 가장 위에 걸린 것이다. */
  hit: ContractClauseHit
  /** 같은 본문이 걸린 다른 계약들(대표 제외). */
  alsoIn: ContractSummary[]
}

/**
 * 본문이 같은 조항을 한 장으로 합친다.
 *
 * <p>계약서 30개가 같은 템플릿이라 "제5조 불가항력"이 다섯 계약에서 **글자 하나까지 똑같이**
 * 걸린다. 그대로 그리면 완전히 같은 카드 다섯 장이 쌓여 검색이 고장 난 것처럼 보인다.
 *
 * <p>묶는 기준은 백엔드가 적재할 때 본문으로 만든 {@code content_hash}다. 글자 하나만 달라도
 * 갈리므로 "비슷한 조항"을 잘못 합칠 일은 없다 — 놓치는 쪽으로 안전하다.
 */
function mergeIdenticalClauses(hits: ContractClauseHit[]): MergedClause[] {
  const merged = new Map<string, MergedClause>()
  for (const hit of hits) {
    const key = hit.content_hash || `${hit.document_id}-${hit.chunk_index}`
    const found = merged.get(key)
    if (!found) {
      merged.set(key, { hit, alsoIn: [] })
    } else if (hit.contract) {
      found.alsoIn.push(hit.contract)
    }
  }
  return [...merged.values()]
}

/**
 * 카드에 보여줄 조항 앞부분. 공백을 정리하고(원문이 탭으로 들여쓴 계약서라 그대로 두면 문장
 * 중간에 큰 구멍이 생긴다), 카드 제목과 겹치는 조항 머리("Article 5 FORCE MAJEURE")를 뗀다.
 */
function previewBody(hit: ContractClauseHit, max = 260): string {
  let text = hit.content.replace(/\s+/g, ' ').trim()
  text = text.replace(/^(?:Article\s+[\d.]+|제\s*\d+\s*조(?:의\s*\d+)?)\s*[(:.-]*\s*/i, '')
  const heading = hit.clause_heading?.trim()
  if (heading && text.toUpperCase().startsWith(heading.toUpperCase())) {
    text = text.slice(heading.length).replace(/^[)\s:.-]+/, '')
  }
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return value.replaceAll('-', '.')
}

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024)
  return megabytes >= 1 ? `${megabytes.toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`
}
