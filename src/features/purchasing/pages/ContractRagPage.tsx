import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchContractDetail,
  fetchOutboundContractDetail,
  fetchContracts,
  isContractRagApiConfigured,
  reprocessContractDocuments,
  reprocessOutboundContractDocuments,
  downloadContractDocument,
  searchClauses,
  uploadContractDocument,
  uploadOutboundContractDocument,
} from '../../../api/contractRag.api'
import type { ContractSearchKind } from '../../../api/contractRag.api'
import { saveBlob } from '../../../lib/saveBlob'
import type {
  ContractClauseHit,
  ContractClauseSearchResult,
  ContractDetail,
  ContractSummary,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import { hasMeaningfulPageNumbers } from '../../../lib/clausePages'
import { useAuthState } from '../../../lib/useAuthState'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import styles from './ContractRagPage.module.css'

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

/**
 * 계약 종류의 사람 말 라벨. "인바운드/아웃바운드"는 어려우니 업무 용어로 바꾼다 —
 * 매입(공급사→자사) / 납품(자사→고객사).
 */
const KIND_LABEL: Record<'INBOUND' | 'OUTBOUND', string> = {
  INBOUND: '원자재 매입 계약',
  OUTBOUND: '제품 납품 계약',
}

/** 검색 결과 카드·목록에 다는 짧은 배지 문구. */
const KIND_BADGE: Record<'INBOUND' | 'OUTBOUND', string> = {
  INBOUND: '매입',
  OUTBOUND: '납품',
}

/** 종류별 부연 — 매입/납품이 무엇인지 한 줄로 안내한다. */
const KIND_HINT: Record<'INBOUND' | 'OUTBOUND', string> = {
  INBOUND: '공급사 → 자사',
  OUTBOUND: '자사 → 고객사',
}

/**
 * select의 범위 값(문자열)을 검색 API 옵션으로 바꾼다.
 * - "ALL" → 매입·납품 전체
 * - "KIND:INBOUND"/"KIND:OUTBOUND" → 그 종류 전체
 * - "C:INBOUND:<id>" → 특정 매입계약(contract_id로 특정)
 * - "C:OUTBOUND:<id>" → 특정 납품계약(product_id+customer_id로 특정 — contract_id는 매입과 겹침)
 */
function scopeToSearchOptions(
  scopeValue: string,
  contracts: ContractSummary[],
): { kind: ContractSearchKind; contractId?: number | null; productId?: number | null; customerId?: number | null } {
  if (scopeValue === 'ALL') return { kind: 'ALL' }
  if (scopeValue === 'KIND:INBOUND') return { kind: 'INBOUND' }
  if (scopeValue === 'KIND:OUTBOUND') return { kind: 'OUTBOUND' }

  const contract = scopeSelectedContract(scopeValue, contracts)
  if (!contract) return { kind: 'ALL' } // 목록이 아직 없거나 값이 어긋나면 전체로 폴백
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
 * 1계층 구매팀 "계약 · RAG 검색". 좌측 조항 검색 결과 + 우측 계약 문서 2단 구성.
 *
 * 검색은 기본적으로 **전체 계약**을 훑는다(백엔드 scope="all") — 화면이 검색창에 문장만 넣고
 * 조항을 찾는 흐름이기 때문이다. 계약을 고르면 그 계약으로 좁힌다.
 *
 * 우측 패널은 조항을 고르면 그 조항이 속한 계약으로 바뀐다. **계약 선택 드롭다운으로도 열린다** —
 * 문서가 하나도 없는 신규 계약은 검색에 걸릴 수가 없어서, 드롭다운이 유일한 진입로다.
 * 여기서 계약서를 올리거나(드롭 → "문서 재처리") 이미 적재된 문서를 다시 임베딩할 수 있다.
 *
 * **유사도 점수는 임베딩이 실제 모델일 때만 뜻이 있다.** 백엔드가 `mock: true`를 내려주면
 * 점수가 무의미하므로 화면이 경고를 띄운다 — 조용히 숫자만 보여주면 "0.61"을 실제 유사도로
 * 읽게 된다.
 */
export function ContractRagPage() {
  const { accessToken } = useAuthState()
  const navigate = useNavigate()
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  /** 계약 목록 조회 중인지. select는 자리표시자를 넣을 데가 없어 안내 문구와 비활성으로 알린다. */
  const [contractsLoading, setContractsLoading] = useState(true)
  const [query, setQuery] = useState('')
  /**
   * 검색 범위. 하나의 select 값으로 담는다:
   *   "ALL"                      — 전체(매입·납품)
   *   "KIND:INBOUND"             — 원자재 매입 계약 전체
   *   "KIND:OUTBOUND"            — 제품 납품 계약 전체
   *   "C:INBOUND:<id>"           — 특정 매입계약
   *   "C:OUTBOUND:<id>"          — 특정 납품계약
   * 매입/납품은 contract_id 번호가 겹치므로 종류를 값에 함께 담아야 계약을 유일하게 가리킨다.
   */
  const [scopeValue, setScopeValue] = useState<string>('ALL')
  const [search, setSearch] = useState<ContractClauseSearchResult | null>(null)
  const [selectedClause, setSelectedClause] = useState<ContractClauseHit | null>(null)
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  /**
   * 우측 "계약 문서" 패널이 지금 보고 있는 계약 종류. 1단(종류) 선택값이다.
   * 매입/납품은 계약 PK가 겹쳐 상세 조회 엔드포인트가 갈리므로, 어느 쪽을 볼지 여기서 정한다.
   */
  const [panelKind, setPanelKind] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND')
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  // 검색 결과 카드의 원문 다운로드 — 진행 중인 문서 id(버튼 비활성/문구용)와 실패 메시지.
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [panelNotice, setPanelNotice] = useState<PanelNotice | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apiConfigured = isContractRagApiConfigured()

  /**
   * 계약 목록을 불러온다. **적재되지 않은 계약도 포함한다**(`includeUnindexed`) —
   * 문서가 0건인 신규 계약은 검색 결과에 나올 수가 없어서, 이 목록에서 빠지면 첫 문서를
   * 올릴 방법이 아예 사라진다. 대신 항목에 "미적재"를 붙여 검색이 빌 것임을 미리 알린다.
   */
  const fetchContractList = useCallback(async (): Promise<ContractSummary[]> => {
    if (!accessToken || !apiConfigured) return []
    try {
      return await fetchContracts(accessToken, true)
    } catch {
      // 계약 목록은 보조 수단이라, 실패해도 전체 계약 검색은 그대로 된다.
      return []
    }
  }, [accessToken, apiConfigured])

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
    if (!accessToken || !query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setPanelNotice(null)
    try {
      const result = await searchClauses(accessToken, query.trim(), {
        ...scopeToSearchOptions(scopeValue, contracts),
        topK: SEARCH_TOP_K,
      })
      setSearch(result)
      // 첫 결과의 계약을 우측 패널에 미리 띄운다 — 사진처럼 검색 직후에도 우측이 비지 않게.
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
    if (!accessToken) return
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
    if (!accessToken) return
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
   * 검색 결과 조항의 원본 계약 문서를 내려받는다. AiBriefingPage.handleDownloadContract와 같은 규약 —
   * 성공하면 saveBlob, 실패하면 오류 메시지. 매입(con_)·납품(outcon_) 문서 모두 같은 엔드포인트가
   * document_id 접두로 갈라 서빙한다.
   */
  async function handleDownloadClause(documentId: string) {
    if (!accessToken) return
    setDownloadError(null)
    setDownloadingId(documentId)
    try {
      const file = await downloadContractDocument(accessToken, documentId)
      if ('error' in file) {
        setDownloadError(file.message)
      } else {
        saveBlob(file.blob, file.fileName)
      }
    } finally {
      setDownloadingId(null)
    }
  }

  /**
   * 검색 범위만 바꾼다. 결과는 다음 검색부터 반영된다 — 필터를 건드렸다고 이미 받아둔 결과를
   * 지우면, 범위를 이리저리 바꿔 보는 동안 화면이 계속 비어 버린다.
   *
   * <p>예전에는 이 드롭다운이 **우측 패널을 여는 일까지** 했다. 검색 필터를 만졌는데 오른쪽
   * 문서 패널이 통째로 바뀌니 무슨 일이 일어난 건지 알 수 없었다. 그쪽은 이제 우측 패널이
   * 자기 선택기로 직접 한다({@link handleOpenContract}).
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
    // 1단 선택(panelKind)이 정한 종류에 맞는 상세 엔드포인트로 연다.
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
   * 없으면 이미 적재된 문서를 다시 임베딩한다 — 사진의 흐름("문서를 끌어다 놓고 재처리를
   * 누르면 저장된다")과 운영상의 재적재를 한 버튼에서 처리한다.
   */
  async function handleProcess() {
    if (!accessToken || !detail) return
    setIsProcessing(true)
    setPanelError(null)
    setPanelNotice(null)
    // 매입(INBOUND)/납품(OUTBOUND)이 각자 전용 엔드포인트를 쓴다 — 계약 PK 번호가 겹쳐
    // 인바운드 경로로 아웃바운드를 보내면 엉뚱한 계약을 건드린다. detail.contract.contract_id는
    // 아웃바운드 상세에서는 outbound_contract_id를 담고 온다(fetchOutboundContractDetail 기준).
    const isOutbound = detail.contract.kind === 'OUTBOUND'
    try {
      if (stagedFile) {
        const result = isOutbound
          ? await uploadOutboundContractDocument(
              accessToken, detail.contract.contract_id, stagedFile)
          : await uploadContractDocument(
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
        const result = isOutbound
          ? await reprocessOutboundContractDocuments(
              accessToken, detail.contract.contract_id)
          : await reprocessContractDocuments(
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
      // 검색 결과는 일부러 다시 돌리지 않는다(검색 1회 = 임베딩 1콜). 대신 안내로 알린다.
      const [, rows] = await Promise.all([
        isOutbound
          ? loadOutboundContract(detail.contract.contract_id)
          : loadContract(detail.contract.contract_id),
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
   *
   * **넘기는 것은 계약 하나뿐이다.** 예전에는 화면에서 조항을 골라 담는 "근거로 사용하기"가
   * 있었지만, 그 조항은 멀티에이전트 판정에 전혀 반영되지 않았다(그래프에 외부 근거를 주입할
   * 입구가 없다). 효과 없는 선택지를 남겨두면 사용자가 "내가 고른 근거로 분석됐다"고 믿게 되므로
   * UI째로 걷어냈다. 브리핑의 계약 근거는 AI 브리핑 화면의 계약 RAG Agent가 직접 검색한다.
   * 그래프에 주입 입구가 생기면 그때 되살린다.
   */
  function handleBriefing() {
    if (!detail) return
    navigate(`/purchasing/ai-briefing?source=CONTRACT&ref=${detail.contract.contract_id}`)
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

  /**
   * 검색 결과 제목의 범위 표기. 무엇으로 좁혔는지 사람 말로 보여준다.
   * 예전에는 `contract_id 17`이 그대로 떴는데 그건 DB PK라 화면에서 할 일이 없다.
   */
  function scopeLabel(): string {
    if (scopeValue === 'ALL') return '전체 계약'
    if (scopeValue === 'KIND:INBOUND') return KIND_LABEL.INBOUND
    if (scopeValue === 'KIND:OUTBOUND') return KIND_LABEL.OUTBOUND
    if (scopeContract) {
      return scopeContract.erp_contract_id ?? scopeContract.contract_name ?? '선택한 계약'
    }
    return '선택한 계약'
  }

  /**
   * 이번 검색이 특정 계약으로 좁힌 것이었으면 그 계약. 결과가 비었을 때 "이 계약엔 문서가
   * 없다"인지 "표현을 바꿔 보라"인지 가르는 데 쓴다(전체·종류 범위였으면 null).
   */
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
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>계약 · RAG 검색</h1>
            <p className={styles.subheading}>
              계약서에서 위험 관련 조항을 검색하고 실제 근거를 확인합니다
            </p>
          </div>

          {/*
            위: 어디서 찾을지(검색 범위) / 아래: 무엇을 찾을지(검색어) 두 줄이다.
            셋을 한 줄에 두고 flex-wrap으로 흘리면 화면 폭에 따라 드롭다운이 내려갔다 버튼이
            내려갔다 해서 배치가 예측되지 않았고, 드롭다운은 폭에 눌려 계약명이 잘렸다
            (`CTR-016 · Synthetic Graphite Supply Agreement 1` 처럼 길다).
          */}
          <section className={styles.searchBar} aria-label="계약 조항 검색">
            <label className={styles.scopeSelect}>
              {/* "계약 선택"은 무엇을 고르는 건지만 말하고 무슨 일이 일어나는지는 안 말한다. */}
              <span>검색 범위</span>
              <select
                value={scopeValue}
                disabled={contractsLoading}
                onChange={(event) => handleChangeScope(event.target.value)}
              >
                {/* 위 3개는 "묶음" 범위(전체/매입 전체/납품 전체), 아래 두 그룹은 특정 계약이다.
                    "매입/납품"은 어려운 말이라 화살표(→)로 방향을 함께 보여 안내한다.
                    "(미적재)"는 남긴다 — 그 계약을 고르면 검색이 반드시 빈다는 예고라, 없으면
                    결과가 0건인 이유를 알 수 없다. */}
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
              {/* 매입/납품이 무엇인지 한 줄로 못박아 둔다 — 드롭다운 라벨만으로는 처음 보는
                  사람이 방향을 헷갈린다. */}
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
                {/* 찾는 것은 계약서가 아니라 조항이다. "계약서 검색"은 문서를 찾는 것처럼 읽힌다. */}
                {isSearching ? '검색 중…' : '조항 검색'}
              </button>
            </div>
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
                {/* 건수는 합친 뒤의 조항 수다 — 화면에 선 카드 수와 어긋나면 안 된다. */}
                {search ? `검색 결과 · ${scopeLabel()} ${clauses.length}건` : '검색 결과'}
              </h2>

              {searchError && <p className={styles.error}>{searchError}</p>}
              {/* 조항 검색은 임베딩 조회라 눈에 띄게 걸린다. 버튼만 "검색 중…"으로 바뀌고
                  본문이 비어 있으면 결과가 없는 것으로 읽혀서, 결과 자리에도 표시한다. */}
              {isSearching && (
                <div aria-busy="true" aria-label="계약 조항 검색 중">
                  <SkeletonText lines={5} lastLineWidth="55%" />
                </div>
              )}
              {/*
                예시 질의는 검색창에 미리 채우지 않고 여기에 버튼으로 둔다. 채워두면 다른 것을
                검색하려는 사람이 전체 선택 후 지워야 하는데, 그건 매번 치르는 비용인 반면
                예시가 필요한 건 처음 한 번이다.
              */}
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
              {/*
                결과가 0건인 이유를 가른다. 판단 기준은 **검색한 그 계약**의 적재 여부다 —
                우측 패널이 보고 있는 계약이 아니다. 둘은 이제 따로 움직여서(검색 범위와 문서
                패널을 분리했다), 우측 것을 보면 "전체 계약을 검색했는데 이 계약에는 문서가
                없습니다"처럼 엉뚱한 안내가 나간다.
              */}
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
                    <li
                      key={key}
                      className={isSelected
                        ? `${styles.clauseItem} ${styles.clauseItemSelected}`
                        : styles.clauseItem}
                    >
                      <button
                        type="button"
                        className={styles.clauseCard}
                        onClick={() => handleSelectClause(hit)}
                        aria-current={isSelected}
                      >
                        <span className={styles.clauseTop}>
                          <span className={styles.clauseTitleWrap}>
                            {/* 전체 검색에서는 매입·납품이 섞여 나오므로, 어느 쪽 계약 조항인지
                                배지로 바로 구분해준다. */}
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
                          {/*
                            유사도 원값(0.61) 대신 순위를 쓴다. 구매 담당자에게 그 숫자는 높은
                            건지 낮은 건지 알 수 없고, 임베딩 모델이 바뀌면 같은 관련도라도 값이
                            달라진다. 원자재 위험 화면도 같은 표기라 두 화면이 같은 말을 한다.
                            원값은 title에 남겨 개발 중 확인할 수 있게 한다.
                          */}
                          <span
                            className={styles.clauseScore}
                            title={`유사도 ${hit.similarity_score.toFixed(3)}`}
                          >
                            {index + 1}순위
                          </span>
                        </span>
                        {/*
                          내부 값은 빼고 사람이 쓰는 식별자만 남긴다. `source`(어느 벡터스토어에서
                          왔는지)와 `contract_id`(DB PK)는 화면에서 할 일이 없다. 페이지는 적재된
                          문서가 전부 txt라 늘 1이므로, 갈릴 때만 보여준다.
                        */}
                        <p className={styles.clauseMeta}>
                          {[
                            hit.contract?.erp_contract_id ?? hit.contract?.contract_name,
                            // 같은 본문이 여러 계약에 있다는 것 자체가 정보다 — 표준 계약이라
                            // 한 곳만 고쳐서는 안 된다는 뜻이라서.
                            alsoIn.length > 0 ? `외 ${alsoIn.length}건에 동일 조항` : null,
                            showPages ? `p.${hit.page_number}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className={styles.clauseContent}>{previewBody(hit)}</p>
                      </button>
                      {/* 다운로드 줄 전체가 버튼 — 좌우 어디를 눌러도 원본이 받아진다.
                          카드(선택)와는 형제라 버튼 중첩이 아니다. */}
                      <button
                        type="button"
                        className={styles.downloadRow}
                        onClick={() => handleDownloadClause(hit.document_id)}
                        disabled={downloadingId === hit.document_id}
                      >
                        {downloadingId === hit.document_id ? '내려받는 중…' : '원문 다운로드 ↓'}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {downloadError && <p className={styles.error}>{downloadError}</p>}
            </section>

            <section className={styles.panel} aria-labelledby="contract-doc-heading">
              {/*
                이 패널이 무엇을 보여줄지는 이 패널이 고른다. 예전에는 검색창 옆 드롭다운이
                검색 범위와 이 패널을 동시에 조종해서, 필터를 만졌을 뿐인데 오른쪽이 통째로
                바뀌는 것처럼 보였다.
              */}
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
              {/*
                빈 자리에 "조항을 선택하세요"만 두면 이 패널이 검색 결과의 종속물처럼 보인다.
                실제로는 검색을 거치지 않고도 들어올 수 있는 곳이고 — 문서가 0건인 계약은 검색에
                걸릴 수가 없어서 위 드롭다운이 유일한 진입로다 — 첫 계약서를 올리는 자리이기도
                하다. 그 사실을 여기서 밝힌다.
              */}
              {!detail && !panelError && (
                <p className={styles.notice}>
                  검색 결과에서 조항을 고르면 그 조항이 속한 계약이 열립니다.
                  <br />
                  아직 계약서를 올리지 않은 계약은 검색에 걸리지 않으니, 위 목록에서 직접 골라 여기서 등록하세요.
                </p>
              )}

              {detail && (
                <>
                  {/* 사람이 읽는 계약명이 먼저다. CTR-004는 식별자라 그 아래 작게 둔다. */}
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

                  {/*
                    임베딩 모델명·버전은 뺐다(OPENAI_API / openai-text-embedding-3-large). 구매
                    담당자가 이 화면에서 할 수 있는 일이 없는 값이다. 반대로 mock 여부는 검색
                    순위를 믿어도 되는지가 걸리므로, 정상이 아닐 때만 경고로 남긴다.
                  */}
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
                          {/* 적재가 정상이면 굳이 말하지 않는다 — 문제일 때만 눈에 띄어야 한다. */}
                          {document.processing_status !== 'COMPLETED' &&
                            ` · ${DOCUMENT_STATUS_LABEL[document.processing_status] ?? document.processing_status}`}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 매입(INBOUND)·납품(OUTBOUND) 모두 이 화면에서 업로드·재처리한다 —
                      handleProcess가 계약 kind에 따라 각자 전용 엔드포인트로 보낸다. */}
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
 * <p>합치면 자리가 줄어드는 게 아니라 정보가 는다 — "이 조항은 5개 계약에 동일하다"는 것 자체가
 * 표준 계약이라는 뜻이라, 한 곳만 고쳐서는 안 된다는 판단으로 이어진다. 남는 자리는 서로 다른
 * 조항이 채운다.
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
 * 카드에 보여줄 조항 앞부분.
 *
 * <p>두 가지를 손본다.
 * <ul>
 *   <li><b>공백 정리</b> — 원문이 탭으로 들여쓴 계약서라 그대로 두면 문장 중간에 큰 구멍이
 *       생긴다. 예전 코드는 개행만 지우고 탭은 남겨 뒀다.</li>
 *   <li><b>조항 머리 제거</b> — 카드 제목이 이미 "제5조 · 불가항력"이라고 말하는데 본문도
 *       "Article 5 FORCE MAJEURE"로 시작하면 같은 말을 두 번 읽게 된다. 떼면 실제 내용부터
 *       보인다.</li>
 * </ul>
 * 전체 원문은 조항을 골랐을 때 우측 계약에서 확인한다.
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
