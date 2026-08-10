import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  downloadAiBriefingReport,
  fetchAiBriefing,
  fetchAiBriefingContext,
  fetchRecentAiBriefings,
  generateAiBriefing,
  isAiBriefingApiConfigured,
} from '../../../api/aiBriefing.api'
import type {
  AiBriefingContext,
  AiBriefingDetail,
  AiBriefingListItem,
  AiBriefingReviewStatus,
  AiBriefingRiskLevel,
  AiBriefingSource,
} from '../../../api/types'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { useAuthState } from '../../../lib/useAuthState'
import { saveBlob } from '../../../lib/saveBlob'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import styles from './AiBriefingPage.module.css'

const SOURCES: AiBriefingSource[] = ['NEWS', 'MATERIAL', 'CONTRACT']

/**
 * LLM 브리핑 생성 요청은 CloudFront 제한 시간보다 오래 걸릴 수 있다.
 * 브라우저 요청이 504로 종료되더라도 백엔드는 브리핑 생성과 저장을 계속하므로,
 * 5초마다 context API를 조회하여 새로운 브리핑 ID가 만들어졌는지 확인한다.
 */
const BRIEFING_POLL_INTERVAL_MS = 5_000

/**
 * 실제 장애가 발생했을 때 화면이 영원히 "실행 중" 상태로 남지 않도록
 * 최대 대기 시간을 10분으로 제한한다.
 */
const BRIEFING_POLL_TIMEOUT_MS = 10 * 60 * 1_000

/** 지정한 시간만큼 비동기로 기다린다. 브리핑 상태 폴링 간격에 사용한다. */
function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

/**
 * LLM 생성 자체의 실패가 아니라 CloudFront/ALB 응답 제한 때문에 발생한
 * 타임아웃인지 판별한다. 이 오류는 화면에 표시하지 않고 상태 조회로 전환한다.
 */
function isUpstreamTimeout(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : String(error)

  return (
    message.includes('upstream request timeout') ||
    message.includes('Gateway Timeout') ||
    message.includes('HTTP 504') ||
    (
      message.includes("Unexpected token 'u'") &&
      message.includes('not valid JSON')
    )
  )
}

/**
 * "최근 브리핑" 한 페이지 건수. 예전에는 50건을 한 번에 받아 세로로 쌓았는데, 브리핑이 쌓일수록
 * 패널이 끝없이 길어져 우측 "분석 근거"가 화면 밖으로 밀렸다. 최신 뉴스와 같은 좌우 화살표
 * 방식으로 바꾸면서 한 화면에 들어가는 만큼만 받는다.
 */
const RECENT_PAGE_SIZE = 4

/** 목록 필터 4축. `null`은 "전체"이고 그 축은 요청에서 빠진다. */
interface RecentFilters {
  source: AiBriefingSource | null
  level: AiBriefingRiskLevel | null
  reviewStatus: AiBriefingReviewStatus | null
  days: number | null
}

const NO_FILTERS: RecentFilters = { source: null, level: null, reviewStatus: null, days: null }

const SOURCE_FILTERS: { label: string; value: AiBriefingSource | null }[] = [
  { label: '전체', value: null },
  { label: '뉴스', value: 'NEWS' },
  { label: '원자재', value: 'MATERIAL' },
  { label: '계약', value: 'CONTRACT' },
]

const LEVEL_FILTERS: { label: string; value: AiBriefingRiskLevel | null }[] = [
  { label: '전체', value: null },
  { label: '심각', value: 'CRITICAL' },
  { label: '주의', value: 'WARNING' },
  { label: '정상', value: 'NORMAL' },
]

const REVIEW_FILTERS: { label: string; value: AiBriefingReviewStatus | null }[] = [
  { label: '전체', value: null },
  { label: '검증 통과', value: 'PASSED' },
  { label: '검토 필요', value: 'FAILED' },
  { label: '미검증', value: 'PENDING' },
]

/**
 * 기본값이 "전체"인 이유: 기간을 먼저 좁혀 두면 어제 만든 브리핑을 찾으러 온 사람이 빈 목록을
 * 보고 "저장이 안 됐다"고 읽는다. 좁히는 것은 사용자가 고를 일이다.
 */
const PERIOD_FILTERS: { label: string; value: number | null }[] = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '전체', value: null },
]

/**
 * 복귀 경로 화이트리스트. 앞 화면이 넘긴 {@code returnTo}를 <b>그대로 믿고 이동하면 안 된다</b> —
 * 쿼리스트링은 누구나 조작할 수 있어서, `//evil.example.com` 같은 값이 오면 오픈 리다이렉트가 된다.
 *
 * <p>구매팀 화면 내부 경로만 허용한다. 판정은 문자열 기준이며 `//`(프로토콜 상대 URL)과
 * 백슬래시를 함께 막는다 — 브라우저가 `/\evil.com`을 외부 주소로 해석하는 경우가 있다.
 */
function safeReturnTo(value: string | null): string | null {
  if (!value) {
    return null
  }
  const normalized = value.trim()
  if (!normalized.startsWith('/purchasing/') || normalized.includes('//') || normalized.includes('\\')) {
    return null
  }
  return normalized
}

/**
 * 1계층 구매팀 AI 브리핑. 상단 "분석 대상 · ERP 연결" + 좌측 브리핑 본문 + 우측 분석 근거·최근 브리핑.
 *
 * 이 화면에는 **두 가지 진입 경로**가 있고 화면이 그리는 것도 그만큼 갈린다.
 * - `?source=NEWS&ref=252`처럼 앞 화면(리스크 모니터링·원자재 위험·계약·RAG)에서 넘어온 경우.
 *   상단 프리필을 받아 채우고 "LLM 브리핑 생성"을 누를 수 있다. 누르기 전에는 본문이 비어 있다 —
 *   화면에 들어오기만 해도 멀티에이전트가 돌면 버튼 없이 비용이 나가기 때문이다.
 * - 쿼리스트링 없이 메뉴로 직접 들어온 경우. 분석 대상이 없으므로 생성 버튼은 비활성이고,
 *   "최근 브리핑"에서 "브리핑 상세 보기"로 저장된 브리핑을 열어 본다.
 *
 * 생성 결과와 저장된 브리핑은 **같은 타입**이라 `BriefingResult` 하나로 그린다. 방금 만든 것과
 * 다시 열어본 것을 다르게 그리면 같은 브리핑이 화면 안에서 두 모양으로 보인다.
 */
/**
 * 프리필 상태. 어떤 대상의 것인지(`key`)를 함께 들고 다닌다 — 대상이 바뀌었는데 이전 대상의
 * 프리필이 남아 있으면 "분석 대상"과 "ERP 연결"이 서로 다른 대상을 가리키게 된다.
 */
interface ContextState {
  key: string
  value: AiBriefingContext | null
  error: string | null
}

/** 열람 중인 브리핑. `key`(briefing_id)로 URL과 짝을 맞춘다 — 아래 주석 참고. */
interface DetailState {
  key: string
  value: AiBriefingDetail
}

export function AiBriefingPage() {
  const { accessToken } = useAuthState()
  const [searchParams, setSearchParams] = useSearchParams()
  const [contextState, setContextState] = useState<ContextState | null>(null)
  const [detailState, setDetailState] = useState<DetailState | null>(null)
  const [recent, setRecent] = useState<AiBriefingListItem[]>([])
  /** 필터를 통과한 전체 건수. 마지막 페이지에서 "다음"을 잠그는 데 쓴다. */
  const [recentTotal, setRecentTotal] = useState(0)
  const [recentPage, setRecentPage] = useState(0)
  const [filters, setFilters] = useState<RecentFilters>(NO_FILTERS)
  /** 최근 브리핑 조회 중인지. "저장된 브리핑이 아직 없습니다"와 구분해야 한다. */
  const [recentLoading, setRecentLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [recentToken, setRecentToken] = useState(0)

  const apiConfigured = isAiBriefingApiConfigured()
  const rawSource = (searchParams.get('source') ?? '').toUpperCase()
  const source = SOURCES.includes(rawSource as AiBriefingSource)
    ? (rawSource as AiBriefingSource)
    : null
  const ref = searchParams.get('ref')
  const targetKey = source && ref ? `${source}:${ref}` : null
  const returnTo = safeReturnTo(searchParams.get('returnTo'))

  const applied = contextState && contextState.key === targetKey ? contextState : null
  const context = applied?.value ?? null
  const contextError = applied?.error ?? null

  /*
   * 열람 중인 브리핑은 **URL이 원본**이다(`?briefing={id}`). 예전에는 상세를 여는 것이 `detail`
   * state만 바꿔서, 코발트 대상을 프리필해 둔 채 니켈 브리핑을 열면 상단은 코발트, 본문은 니켈로
   * 갈라졌다. 지금은 상세를 열 때 source·ref까지 함께 URL에 넣으므로 상단·본문·생성 버튼이
   * 항상 같은 대상을 가리킨다. 새로고침하거나 링크를 공유해도 같은 브리핑이 열리는 건 덤이다.
   */
  const briefingId = searchParams.get('briefing')
  const detail = detailState && detailState.key === briefingId ? detailState.value : null
  const loadedBriefingId = detailState?.key ?? null

  // 앞 화면에서 넘어온 대상의 프리필. 생성은 하지 않는다.
  useEffect(() => {
    if (!accessToken || !apiConfigured || !source || !ref || !targetKey) {
      return
    }
    // 쿼리스트링을 빠르게 바꾸면 이전 요청이 늦게 도착해 최신 프리필을 덮어쓸 수 있다.
    let cancelled = false
    async function load(token: string, nextSource: AiBriefingSource, nextRef: string, key: string) {
      try {
        const next = await fetchAiBriefingContext(token, nextSource, nextRef)
        if (!cancelled) setContextState({ key, value: next, error: null })
      } catch (err) {
        if (cancelled) return
        setContextState({
          key,
          value: null,
          error: err instanceof Error ? err.message : '분석 대상을 불러오지 못했습니다.',
        })
      }
    }
    void load(accessToken, source, ref, targetKey)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured, source, ref, targetKey])

  // 최근 브리핑은 진입 경로와 무관하게 항상 채운다 — 직접 들어온 사용자에게는 이것이 화면의 전부다.
  useEffect(() => {
    if (!accessToken || !apiConfigured) {
      return
    }
    let cancelled = false
    async function load(token: string, page: number, applied: RecentFilters) {
      try {
        // 필터·페이징을 함께 서버로 보낸다. 받아온 배열을 여기서 거르면 서버가 이미 자른 한
        // 페이지 안에서만 걸러져, 조건에 맞는데 뒷 페이지에 있는 브리핑이 통째로 사라진다.
        const result = await fetchRecentAiBriefings(token, {
          ...applied,
          page,
          size: RECENT_PAGE_SIZE,
        })
        if (cancelled) return
        setRecent(result.content)
        setRecentTotal(result.total_elements)
      } catch {
        // 최근 목록이 비어도 생성은 할 수 있어야 하므로 화면을 막지 않는다.
        if (cancelled) return
        setRecent([])
        setRecentTotal(0)
      } finally {
        if (!cancelled) setRecentLoading(false)
      }
    }
    void load(accessToken, recentPage, filters)
    return () => {
      cancelled = true
    }
    // 로딩 표시는 조회를 유발하는 쪽(필터·화살표·새로고침)이 켜고 여기서는 끄기만 한다 —
    // effect 본문에서 동기 setState를 하면 cascading render가 난다.
  }, [accessToken, apiConfigured, recentToken, recentPage, filters])

  // URL의 briefing으로 상세를 채운다. 방금 생성해 이미 손에 든 것은 다시 부르지 않는다.
  useEffect(() => {
    if (!accessToken || !apiConfigured || !briefingId || loadedBriefingId === briefingId) {
      return
    }
    let cancelled = false
    async function load(token: string, id: string) {
      try {
        const value = await fetchAiBriefing(token, id)
        if (!cancelled) setDetailState({ key: id, value })
      } catch (err) {
        if (cancelled) return
        setActionError(err instanceof Error ? err.message : '브리핑을 불러오지 못했습니다.')
      }
    }
    void load(accessToken, briefingId)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured, briefingId, loadedBriefingId])

  /*
   * 앞 화면(리스크 모니터링 등)에서 대상만 들고 넘어왔는데 이미 저장된 브리핑이 있으면
   * 그 본문을 띄운다. 예전에는 프리필(최종 점수 포함)만 보이고 "구매 위험 브리핑" 칸이
   * 비어 있어, 이미 만들어 둔 브리핑을 두고 "생성"을 다시 눌러야 했다(LLM 비용 재지출).
   */
  useEffect(() => {
    if (briefingId || !context?.latest_briefing_id) {
      return
    }
    const next = new URLSearchParams(searchParams)
    next.set('briefing', context.latest_briefing_id)
    setSearchParams(next, { replace: true })
  }, [briefingId, context, searchParams, setSearchParams])

  /*
   * 프리필이 없으면(= `?briefing={id}`만 들고 들어온 링크 진입) 열람 중인 상세에서 머리말을
   * 만든다. 상세에 분석 대상·ERP 연결이 모두 들어 있어 굳이 서버를 다시 부를 필요가 없다.
   */
  const displayContext = context ?? (detail ? contextFromDetail(detail) : null)

  const refreshRecent = useCallback(() => setRecentToken((previous) => previous + 1), [])

  /**
   * 생성 요청이 CloudFront에서 시간 초과된 뒤에도 백엔드는 작업을 계속할 수 있다.
   * 생성 버튼을 누르기 전에 존재했던 briefing ID와 context API가 반환하는 최신 ID를
   * 비교하고, 새로운 ID가 확인되면 완성된 브리핑 상세를 조회한다.
   */
  async function waitForGeneratedBriefing(
    previousBriefingId: string | null,
  ): Promise<AiBriefingDetail> {
    if (!accessToken || !source || !ref) {
      throw new Error('브리핑 생성 정보를 확인할 수 없습니다.')
    }

    const deadline = Date.now() + BRIEFING_POLL_TIMEOUT_MS

    while (Date.now() < deadline) {
      // 백엔드에 과도한 요청을 보내지 않도록 5초마다 조회한다.
      await sleep(BRIEFING_POLL_INTERVAL_MS)

      try {
        const nextContext = await fetchAiBriefingContext(
          accessToken,
          source,
          ref,
        )

        const nextBriefingId = nextContext.latest_briefing_id

        // 생성 전 ID와 다른 새 브리핑 ID가 생기면 생성이 완료된 것이다.
        if (
          nextBriefingId &&
          nextBriefingId !== previousBriefingId
        ) {
          return fetchAiBriefing(
            accessToken,
            nextBriefingId,
          )
        }
      } catch (error) {
        /*
         * 일시적인 네트워크 오류로 context 조회 한 번이 실패하더라도
         * 전체 생성을 실패 처리하지 않고 다음 조회 주기까지 기다린다.
         * 최종적으로 10분을 넘기면 아래의 안내 오류를 표시한다.
         */
        console.warn(
          '브리핑 생성 상태를 다시 확인합니다.',
          error,
        )
      }
    }

    throw new Error(
      '브리핑 생성 시간이 길어지고 있습니다. 잠시 후 최근 브리핑에서 확인해 주세요.',
    )
  }

  /* async function handleGenerate() {
    if (!accessToken || !source || !ref) return
    setIsGenerating(true)
    setActionError(null)
    try {
      // analysis_id를 함께 보내 프리필이 보여준 그 뉴스로 고정한다 — 안 보내면 서버가 다시 고르고,
      // 그 사이 수집 스케줄러가 새 분석을 넣으면 상단 외부신호와 결과가 어긋난다.
      const created = await generateAiBriefing(
        accessToken, source, ref, true, context?.analysis_id ?? null)
      setDetailState({ key: created.briefing_id, value: created })
      const next = new URLSearchParams(searchParams)
      next.set('briefing', created.briefing_id)
      setSearchParams(next, { replace: true })
      refreshRecent()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'AI 브리핑 생성에 실패했습니다.')
    } finally {
      setIsGenerating(false)
    }
  } */

  /**
   * LLM 브리핑 생성을 시작한다.
   *
   * 정상 시간 안에 응답이 오면 응답으로 받은 브리핑을 바로 표시한다.
   * CloudFront 타임아웃이 발생하면 오류를 표시하지 않고 context API를
   * 반복 조회하여 백엔드가 저장한 새 브리핑을 자동으로 표시한다.
   */
  async function handleGenerate() {
    if (!accessToken || !source || !ref) return

    // 생성이 완료될 때까지 버튼과 본문에 "실행 중" 상태를 표시한다.
    setIsGenerating(true)

    // 이전 요청에서 표시된 오류가 있으면 생성 시작 시 지운다.
    setActionError(null)

    /*
     * 기존에 저장된 브리핑 ID를 기억한다.
     * 폴링 중 이 값과 다른 ID가 나타나면 새로운 생성이 완료된 것이다.
     */
    const previousBriefingId =
      context?.latest_briefing_id ?? null

    try {
      let created: AiBriefingDetail

      try {
        /*
         * 우선 기존 생성 API를 그대로 호출한다.
         * 제한 시간 안에 끝나면 이 응답으로 즉시 화면을 갱신한다.
         */
        created = await generateAiBriefing(
          accessToken,
          source,
          ref,
          true,
          context?.analysis_id ?? null,
        )
      } catch (error) {
        /*
         * 권한 오류나 실제 서버 오류는 기존처럼 실패 처리한다.
         * 응답 시간 초과만 백엔드 작업이 계속 진행 중인 것으로 간주한다.
         */
        if (!isUpstreamTimeout(error)) {
          throw error
        }

        /*
         * CloudFront 요청은 끝났지만 isGenerating을 false로 바꾸지 않는다.
         * 따라서 화면에는 계속 "멀티에이전트 실행 중…"이 표시된다.
         */
        created = await waitForGeneratedBriefing(
          previousBriefingId,
        )
      }

      // 새 브리핑이 확인되면 완성된 상세 내용을 화면에 넣는다.
      setDetailState({
        key: created.briefing_id,
        value: created,
      })

      // 새로고침하거나 링크를 공유해도 같은 브리핑을 열도록 URL에 ID를 넣는다.
      const next = new URLSearchParams(searchParams)
      next.set('briefing', created.briefing_id)
      setSearchParams(next, { replace: true })

      // 우측 최근 브리핑 목록에도 새 항목을 반영한다.
      refreshRecent()
    } catch (error) {
      /*
       * 타임아웃은 위에서 폴링으로 처리했으므로 여기에는 권한 오류,
       * 실제 생성 실패, 10분 초과 같은 최종 오류만 도달한다.
       */
      setActionError(
        error instanceof Error
          ? error.message
          : 'AI 브리핑 생성에 실패했습니다.',
      )
    } finally {
      /*
       * 직접 응답 또는 폴링으로 브리핑을 찾았거나,
       * 최종 실패가 확정된 경우에만 실행 중 상태를 종료한다.
       */
      setIsGenerating(false)
    }
  }

  /**
   * "브리핑 상세 보기". 본문만 바꾸지 않고 **대상까지 함께 옮긴다** — 그러지 않으면 상단
   * "분석 대상 · ERP 연결"이 이전 대상으로 남아 본문과 다른 것을 가리킨다.
   */
  function handleOpen(item: AiBriefingListItem) {
    setActionError(null)
    const next = new URLSearchParams(searchParams)
    next.set('source', item.source_type)
    next.set('ref', item.source_ref)
    next.set('briefing', item.briefing_id)
    setSearchParams(next)
  }

  /**
   * "PDF 다운로드". 서버가 저장된 브리핑을 그대로 그리므로 LLM이 다시 돌지 않는다 — 몇 번을
   * 받아도 화면과 같은 내용, 같은 파일이 나온다.
   *
   * 실패는 화면 상단 오류 줄에 띄운다. 파일 저장은 조용히 실패할 수 있는 동작이라(권한 만료 등)
   * 아무 일도 안 일어난 것처럼 보이면 사용자가 버튼을 계속 누른다.
   */
  async function handleDownload() {
    if (!accessToken || !detail) return
    setActionError(null)
    setIsDownloading(true)
    try {
      const file = await downloadAiBriefingReport(accessToken, detail.briefing_id)
      if ('error' in file) {
        setActionError(file.message)
      } else {
        saveBlob(file.blob, file.fileName)
      }
    } finally {
      setIsDownloading(false)
    }
  }

  /**
   * 필터를 바꾸면 페이지를 처음으로 되돌린다. 3페이지를 보다가 조건을 좁히면 결과가 그만큼
   * 없어서 빈 화면이 나오는데, 사용자는 "필터에 걸리는 게 없다"로 읽는다.
   */
  function applyFilter(patch: Partial<RecentFilters>) {
    setRecentLoading(true)
    setFilters((previous) => ({ ...previous, ...patch }))
    setRecentPage(0)
  }

  function changeRecentPage(next: number) {
    setRecentLoading(true)
    setRecentPage(next)
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>AI 구매 브리핑</h1>
            <p className={styles.subheading}>
              ERP와 계약 근거를 바탕으로 검증된 구매 위험 브리핑을 생성합니다
            </p>
          </div>

          {!apiConfigured && (
            <p className={styles.notice}>
              백엔드 API가 설정되지 않았습니다(<code>VITE_API_BASE_URL</code>).
              실 데이터를 보려면 <code>npm run dev:live</code>로 실행하세요.
            </p>
          )}

          <TargetBar
            context={displayContext}
            hasTarget={Boolean(source && ref) || Boolean(detail)}
            isGenerating={isGenerating}
            onGenerate={() => void handleGenerate()}
          />
          {/*
           * 앞 화면으로 돌아가는 링크. 생성이 끝난 뒤 강조하는 이유는, 그때가 등급 변화를
           * 확인하러 돌아갈 시점이기 때문이다. returnTo에 eventId가 실려 있어 같은 기사가 다시 열린다.
           */}
          {returnTo && (
            <Link
              to={returnTo}
              className={detail ? `${styles.returnLink} ${styles.returnLinkReady}` : styles.returnLink}
            >
              ← 리스크 모니터링으로 돌아가기
              {detail && <span className={styles.returnHint}>갱신된 등급 확인</span>}
            </Link>
          )}
          {contextError && <p className={styles.error}>{contextError}</p>}
          {displayContext && !displayContext.generate_available && displayContext.generate_blocked_reason && (
            <p className={styles.blockedReason}>{displayContext.generate_blocked_reason}</p>
          )}
          {actionError && <p className={styles.error}>{actionError}</p>}

          <div className={styles.split}>
            <section className={styles.briefingPanel} aria-labelledby="briefing-heading">
              <div className={styles.panelHeader}>
                <h2 id="briefing-heading" className={styles.panelHeading}>
                  구매 위험 브리핑
                </h2>
                {/* 브리핑이 떠 있을 때만 낸다 — 내려받을 것이 없는데 버튼이 있으면 눌러 보고
                    아무 일도 안 일어나는 것을 확인하게 된다. */}
                {detail && (
                  <button
                    type="button"
                    className={styles.downloadAction}
                    onClick={() => void handleDownload()}
                    disabled={isDownloading}
                  >
                    {isDownloading ? '내려받는 중…' : 'PDF 다운로드'}
                  </button>
                )}
              </div>
              {/* {isGenerating && <p className={styles.notice}>멀티에이전트 실행 중…</p>} */}
              {isGenerating && (
                <p
                  className={styles.notice}
                  role="status"
                  aria-live="polite"
                >
                  멀티에이전트 실행 중… 완료되면 브리핑이 자동으로 표시됩니다.
                </p>
              )}
              {!isGenerating && !detail && briefingId && (
                <div aria-busy="true" aria-label="브리핑 불러오는 중">
                  <SkeletonText lines={7} lastLineWidth="60%" />
                </div>
              )}
              {!isGenerating && !detail && !briefingId && (
                <p className={`${styles.notice} ${styles.noticeEmpty}`}>
                  {source && ref
                    ? '"LLM 브리핑 생성"을 누르면 ERP · 계약 근거를 모아 브리핑을 만듭니다.'
                    : '리스크 이벤트 · 원자재 위험 · 계약 · RAG 화면에서 대상을 골라 오거나, 최근 브리핑을 열어 보세요.'}
                </p>
              )}
              {detail && <BriefingResult detail={detail} />}
            </section>

            <div className={styles.sideColumn}>
              <EvidencePanel detail={detail} />
              <RecentPanel
                items={recent}
                isLoading={recentLoading}
                onOpen={handleOpen}
                filters={filters}
                onFilterChange={applyFilter}
                page={recentPage}
                pageSize={RECENT_PAGE_SIZE}
                total={recentTotal}
                onPageChange={changeRecentPage}
                selectedId={briefingId}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

/**
 * 상세만 들고 들어왔을 때 쓰는 머리말. `?briefing={id}` 링크(대시보드 우측 "브리핑" 목록)로
 * 오면 URL에 `source`/`ref`가 없어 프리필을 부를 수 없고, 그렇다고 상세의 `source_ref`로
 * 다시 부르는 것도 확실하지 않다 — 자동 생성 브리핑은 `source_ref`가 분석 UUID인데
 * `raw_events.triggered_analysis_id`가 채워지지 않은 분석이 실제로 있어(수집을 거치지 않고
 * 직접 만들어진 분석) 되찾지 못한다.
 *
 * 상세에 이미 같은 값이 전부 들어 있으므로 그걸로 머리말을 채운다. 본문은 보이는데 머리말만
 * '선택된 대상이 없습니다'로 남아 다른 브리핑을 보는 것처럼 읽히던 문제가 이걸로 사라진다.
 * 생성 버튼만 잠근다 — 대상을 다시 특정할 수 없으니 여기서 재생성을 허용하면 엉뚱한 것을
 * 만들 수 있다(재생성은 목록의 "브리핑 상세 보기"로 들어오면 열린다).
 */
function contextFromDetail(detail: AiBriefingDetail): AiBriefingContext {
  return {
    source_type: detail.source_type,
    source_ref: detail.source_ref,
    subject_title: detail.subject_title,
    news_id: detail.news_id,
    analysis_id: detail.analysis_id,
    source_headline: detail.source_headline,
    erp_material_id: detail.erp_material_id,
    erp_supplier_id: detail.erp_supplier_id,
    erp_contract_id: detail.erp_contract_id,
    contract_id: detail.contract_id,
    material_name: detail.material_name,
    material_category: detail.material_category,
    country_code: null,
    impact_domain: detail.impact_domain,
    external_signal_level: detail.evidence_chain?.external_signal?.level ?? null,
    external_signal_score: detail.evidence_chain?.external_signal?.score ?? null,
    generate_available: false,
    generate_blocked_reason: '저장된 브리핑을 열람 중입니다. 다시 생성하려면 목록에서 대상을 선택하세요.',
    latest_briefing_id: detail.briefing_id,
  }
}

/** 상단 "분석 대상 · ERP 연결 · LLM 브리핑 생성". 프리필이 비어도 자리를 유지해 화면이 흔들리지 않는다. */
function TargetBar({
  context,
  hasTarget,
  isGenerating,
  onGenerate,
}: {
  context: AiBriefingContext | null
  hasTarget: boolean
  isGenerating: boolean
  onGenerate: () => void
}) {
  const erpLink = context
    ? [context.erp_material_id, context.erp_supplier_id, context.erp_contract_id]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <section className={styles.targetBar} aria-label="분석 대상">
      <div className={styles.targetField}>
        <span className={styles.targetLabel}>분석 대상</span>
        <span className={styles.targetValue}>
          {context?.subject_title ?? (hasTarget ? '불러오는 중…' : '선택된 대상이 없습니다')}
        </span>
        {context?.news_id && <span className={styles.targetMeta}>{context.news_id}</span>}
      </div>
      <div className={styles.targetField}>
        <span className={styles.targetLabel}>ERP 연결</span>
        <span className={styles.targetValue}>{erpLink || '—'}</span>
        {/* 자재·계약에서 넘어오면 분석 대상과 외부신호 기사가 다르다 — 무엇을 근거로 삼았는지 밝힌다. */}
        {context?.source_headline && context.source_headline !== context.subject_title && (
          <span className={styles.targetMeta}>외부신호 출처: {context.source_headline}</span>
        )}
      </div>
      <button
        type="button"
        className={styles.primaryAction}
        onClick={onGenerate}
        disabled={!context?.generate_available || isGenerating}
      >
        {isGenerating ? '생성 중…' : 'LLM 브리핑 생성'}
      </button>
    </section>
  )
}

/** 좌측 본문 — 등급·브리핑 문구·ERP 노출 근거·계약 근거·권고 조치·검증 메타데이터. */
function BriefingResult({ detail }: { detail: AiBriefingDetail }) {
  const evidence = detail.erp_evidence
  const verification = detail.verification
  const firstFinding = detail.contract_findings[0] as
    | { contract_id?: number; page?: number; evidence_text?: string }
    | undefined

  return (
    <div className={styles.briefingBody}>
      {detail.composite ? (
        <p className={levelClass(detail.procurement_risk_level)}>
          {detail.procurement_risk_level} · {Math.round(detail.procurement_risk_score)}점
        </p>
      ) : (
        /*
          조기 종료된 실행은 0점·NORMAL로 응답이 나가므로 등급으로 보여주면 안 된다.

          예전 문구("ERP · 계약 노드까지 가지 못해")는 실패처럼 읽혔다. 실제로는 그래프가
          공급망 영향을 확인하고 **더 볼 필요가 없다고 판단해** 계약 조회와 LLM을 건너뛴
          것이라, 실패가 아니라 결론이다. 무엇을 보고 그렇게 판단했는지는 바로 아래
          `detail.briefing`("[정상] …")이 문장으로 말하므로 여기서 겹쳐 말하지 않는다.
        */
        <div className={styles.skippedNotice}>
          <p className={styles.skippedTitle}>종합 위험 점수를 산출하지 않았습니다</p>
          <p className={styles.skippedDetail}>
            공급망 영향을 확인하는 단계에서 더 볼 필요가 없다고 판단해 계약 조회와 LLM 분석을
            건너뛴 실행입니다. 점수가 없는 것이지 위험이 0이라는 뜻은 아닙니다.
          </p>
        </div>
      )}

      {detail.briefing && <p className={styles.briefingText}>{detail.briefing}</p>}

      {evidence && evidence.exposure_score !== null && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>ERP 노출 근거</h3>
          <p className={styles.sectionText}>
            ERP 노출도 {Math.round(evidence.exposure_score)} · 현재 재고{' '}
            {formatDays(evidence.inventory_days)} · 안전재고 {formatDays(evidence.safety_stock_days)}
            <br />
            예상 입고{' '}
            {evidence.next_inbound_eta_days === null
              ? '—'
              : `${evidence.next_inbound_eta_days}일 후`}{' '}
            · 공급 공백 {formatDays(evidence.expected_supply_gap_days)} · 공급사 의존도{' '}
            {formatRatio(evidence.supplier_dependency_ratio)}
          </p>
          {evidence.stockout_before_eta && (
            <p className={styles.footnote}>
              다음 입고 전에 재고가 소진될 가능성이 있어 점수와 무관하게 심각으로 격상되었습니다.
            </p>
          )}
        </section>
      )}

      {firstFinding && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>계약서에서 확인된 근거</h3>
          <p className={styles.sectionText}>
            계약 ID {firstFinding.contract_id ?? '—'}, 페이지 {firstFinding.page ?? '—'}
            <br />
            {firstFinding.evidence_text ?? '조항 본문이 없습니다.'}
          </p>
        </section>
      )}

      {detail.recommended_actions.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>구매팀 권고 조치</h3>
          <ul className={styles.actionList}>
            {detail.recommended_actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>
      )}

      {detail.risk_reasons.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>판단 근거</h3>
          <ul className={styles.reasonList}>
            {detail.risk_reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.metaBox} aria-label="검증 메타데이터">
        <h3 className={styles.sectionTitle}>검증 메타데이터</h3>
        <p className={styles.metaText}>
          review_passed: {String(verification.review_passed)} · llm_used:{' '}
          {String(verification.llm_used)} · warnings: {verification.warning_count}
          <br />
          contract_id: {verification.contract_id ?? '—'} · page: {verification.contract_page ?? '—'}{' '}
          · {verification.weight_version ?? 'rule version 미기록'}
        </p>
        {verification.llm_error && (
          <p className={styles.footnote}>LLM 문구 생성 실패: {verification.llm_error}</p>
        )}
        {verification.warnings.map((warning) => (
          <p key={warning} className={styles.footnote}>
            {warning}
          </p>
        ))}
      </section>
    </div>
  )
}

/** 우측 "분석 근거" 4칸. 외부 이벤트 → ERP → 계약 RAG → 브리핑이 곧 실행 순서다. */
function EvidencePanel({ detail }: { detail: AiBriefingDetail | null }) {
  return (
    <section className={styles.sidePanel} aria-labelledby="evidence-heading">
      <h2 id="evidence-heading" className={styles.panelHeading}>
        분석 근거
      </h2>
      {!detail && <p className={styles.notice}>브리핑을 생성하면 근거가 채워집니다.</p>}
      {detail && (
        <>
          <EvidenceRow label="외부 이벤트" step={detail.evidence_chain.external_signal} />
          <EvidenceRow label="ERP 노출" step={detail.evidence_chain.erp_exposure} />
          <EvidenceRow label="계약 RAG" step={detail.evidence_chain.contract_rag} />
          {/*
            조기 종료된 실행의 최종 위험은 계산된 값이 아니라 상수 0·NORMAL이다
            (fastapi-ai/app/multi_agent/kg/node.py의 build_no_shortage_briefing). 위 세 칸 중
            안 잰 것들은 이미 "—"로 정직하게 비어 있는데 최종만 숫자로 채워지면, 넷 중 유일하게
            지어낸 값이 유일하게 측정값처럼 보인다.
          */}
          <EvidenceRow
            label="최종 위험"
            step={detail.evidence_chain.final_risk}
            highlight
            unmeasured={!detail.composite}
          />
          <p className={styles.footnote}>외부 이벤트 → ERP → 계약 RAG → 브리핑</p>
        </>
      )}
    </section>
  )
}

function EvidenceRow({
  label,
  step,
  highlight = false,
  unmeasured = false,
}: {
  label: string
  step: { level: string | null; score: number | null; note: string | null }
  highlight?: boolean
  /** 값이 실려 오더라도 재지 않은 칸. 응답의 자리채움을 측정값처럼 보이게 두지 않는다. */
  unmeasured?: boolean
}) {
  // 계약 RAG처럼 등급이 없는 칸은 note("3개 조항")가 값을 대신한다.
  const value = unmeasured
    ? '—'
    : step.level
      ? `${step.level}${step.score === null ? '' : ` · ${Math.round(step.score)}`}`
      : (step.note ?? '—')

  return (
    <div className={styles.evidenceRow}>
      <span className={styles.evidenceLabel}>{label}</span>
      {/* 안 잰 칸에는 등급 색을 입히지 않는다 — 초록 NORMAL로 칠하면 "안전 판정"으로 읽힌다. */}
      <span
        className={
          highlight && !unmeasured ? levelClass(step.level ?? '') : styles.evidenceValue
        }
      >
        {value}
      </span>
    </div>
  )
}

/**
 * 우측 하단 "최근 브리핑". 팀 전체 공용이라 다른 사람이 만든 것도 보인다.
 *
 * 예전에는 50건을 세로로 쌓아서, 브리핑이 늘수록 패널이 끝없이 길어지고 위쪽 "분석 근거"가
 * 화면 밖으로 밀렸다. 최신 뉴스(`LatestNewsPanel`)와 같은 좌우 화살표 방식으로 바꿨다 —
 * 두 화면이 같은 조작으로 목록을 넘기게 하려는 것이기도 하다.
 *
 * **필터는 서버가 적용한다.** 여기서 `items`를 다시 거르면 안 된다 — 이미 한 페이지만 받아
 * 왔으므로 조건에 맞는데 뒷 페이지에 있는 브리핑이 사라진다.
 */
function RecentPanel({
  items,
  isLoading,
  onOpen,
  filters,
  onFilterChange,
  page,
  pageSize,
  total,
  onPageChange,
  selectedId,
}: {
  items: AiBriefingListItem[]
  isLoading: boolean
  /** 항목 전체를 넘긴다 — 상세를 열 때 `source_type`·`source_ref`로 상단 대상까지 맞춰야 한다. */
  onOpen: (item: AiBriefingListItem) => void
  filters: RecentFilters
  onFilterChange: (patch: Partial<RecentFilters>) => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** 지금 본문에 떠 있는 브리핑. 목록에서 어느 것을 보고 있는지 표시한다. */
  selectedId: string | null
}) {
  const lastPage = total === 0 ? 0 : Math.ceil(total / pageSize) - 1
  const hasPaging = total > pageSize
  const filtered =
    filters.source !== null ||
    filters.level !== null ||
    filters.reviewStatus !== null ||
    filters.days !== null

  return (
    <ScrollCard
      headingId="recent-heading"
      title="최근 브리핑"
      actions={
        hasPaging ? (
          <div className={styles.pager}>
            <span className={styles.pageLabel}>
              {page * pageSize + 1}–{page * pageSize + items.length} / {total}
            </span>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => onPageChange(page - 1)}
              // 넘기는 중에는 잠근다 — 연타하면 늦게 도착한 응답이 최신 페이지를 덮는다.
              disabled={page === 0 || isLoading}
              aria-label="이전 브리핑"
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.pageButton}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= lastPage || isLoading}
              aria-label="다음 브리핑"
            >
              ›
            </button>
          </div>
        ) : undefined
      }
      pinnedTop={
        /* 필터는 스크롤 밖에 고정한다 — 목록을 내리다 조건을 바꾸려는데 필터가 위로 사라지면
           다시 올라가야 한다. */
        <div className={styles.recentFilters}>
          <FilterSelect
            label="대상"
            value={filters.source}
            options={SOURCE_FILTERS}
            onChange={(value) => onFilterChange({ source: value })}
          />
          <FilterSelect
            label="등급"
            value={filters.level}
            options={LEVEL_FILTERS}
            onChange={(value) => onFilterChange({ level: value })}
          />
          <FilterSelect
            label="검증"
            value={filters.reviewStatus}
            options={REVIEW_FILTERS}
            onChange={(value) => onFilterChange({ reviewStatus: value })}
          />
          <FilterSelect
            label="기간"
            value={filters.days}
            options={PERIOD_FILTERS}
            onChange={(value) => onFilterChange({ days: value })}
          />
        </div>
      }
      /*
        높이를 고정하지 않는다. `maxBodyHeight`는 "4개 높이로 고정 + 5번째부터 스크롤" 규칙용인데
        (design-tokens.md "카드 레이아웃·스크롤 규칙" d) 이 목록은 한 페이지가 정확히
        RECENT_PAGE_SIZE(4)개라 5번째가 없다. 360px 고정 때문에 마지막 한 장이 잘려, 페이지당
        4건인데 3건만 보이고 나머지는 스크롤해야 했다.
      */
    >
      {/* 처음 불러올 때는 보여줄 것이 없으니 골격을 세운다. */}
      {isLoading && items.length === 0 && (
        <div aria-busy="true" aria-label="최근 브리핑 불러오는 중">
          <SkeletonText lines={6} lastLineWidth="45%" />
        </div>
      )}
      {!isLoading && items.length === 0 && (
        <p className={styles.notice}>
          {filtered
            ? '조건에 맞는 브리핑이 없습니다. 필터를 넓혀 보세요.'
            : '저장된 브리핑이 아직 없습니다.'}
        </p>
      )}
      {/*
        페이지를 넘기는 중에는 목록을 지우지 않고 흐리게만 한다. 골격으로 갈아치우면 응답이
        빠를 때(로컬은 수십 ms) 깜빡임만 남고 자리가 튀어, 오히려 무슨 일이 일어났는지
        알기 어렵다. 이전 페이지를 둔 채 "바뀌는 중"만 알리는 편이 읽힌다.
      */}
      {items.length > 0 && (
        <div
          className={isLoading ? styles.recentListRefreshing : undefined}
          aria-busy={isLoading || undefined}
        >
          {items.map((item) => (
          /*
            카드 전체가 버튼이다. 예전에는 카드마다 검정 막대 버튼이 아래 붙어 있어서, 목록을
            훑을 때 브리핑 제목보다 막대가 먼저 눈에 들어왔다 — 카드에서 가장 강한 요소가
            "여길 누르세요"였던 셈이다. 카드 안에 다른 누를 것이 없으므로 통째로 버튼으로
            두는 데 걸림돌도 없다(계약·RAG 화면의 조항 카드와 같은 방식).
          */
          <button
            type="button"
            key={item.briefing_id}
            className={
              item.briefing_id === selectedId
                ? `${styles.recentCard} ${styles.recentCardSelected}`
                : styles.recentCard
            }
            onClick={() => onOpen(item)}
            aria-pressed={item.briefing_id === selectedId}
          >
            <span className={styles.recentTitle}>{item.subject_title ?? item.news_id}</span>
            <span className={styles.recentMeta}>
              {/*
                조기 종료(composite=false)도 응답 원값 그대로 등급·점수를 표시한다 —
                level·score가 NORMAL·0으로 실려오므로 "NORMAL · 0"으로 뜬다(색은 level 기준).
              */}
              <span className={levelClass(item.procurement_risk_level)}>
                {`${item.procurement_risk_level} · ${Math.round(item.procurement_risk_score)}`}
              </span>
              {item.review_passed !== null && ` · ${item.review_passed ? '검증 통과' : '검증 실패'}`}
            </span>
            <span className={styles.recentFoot}>
              <span className={styles.recentDate}>{formatDateTime(item.created_at)}</span>
              {/*
                카드가 눌린다는 신호. 카드 전체가 이미 버튼이라 보조 장치이므로 스크린리더에는
                읽히지 않게 둔다 — 버튼 이름은 제목·등급·시각으로 충분하다.
              */}
              <span className={styles.recentOpen} aria-hidden="true">
                상세 보기 →
              </span>
            </span>
          </button>
          ))}
        </div>
      )}
    </ScrollCard>
  )
}

/**
 * 필터 셀렉트 한 칸. 값이 `null`("전체")인 옵션을 빈 문자열로 실어 `<select>`가 다룰 수 있게 한다 —
 * DOM 값은 문자열뿐이라 `null`을 그대로 쓸 수 없다.
 */
function FilterSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { label: string; value: T | null }[]
  onChange: (value: T | null) => void
}) {
  return (
    <label className={styles.filterField}>
      <span className={styles.filterLabel}>{label}</span>
      <select
        className={styles.filterSelect}
        value={options.findIndex((option) => option.value === value)}
        onChange={(event) => onChange(options[Number(event.target.value)].value)}
      >
        {options.map((option, index) => (
          <option key={option.label} value={index}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function levelClass(level: string): string {
  if (level === 'CRITICAL') return `${styles.levelTag} ${styles.toneCritical}`
  if (level === 'WARNING') return `${styles.levelTag} ${styles.toneWarning}`
  if (level === 'NORMAL') return `${styles.levelTag} ${styles.toneNormal}`
  return `${styles.levelTag} ${styles.toneNeutral}`
}

/** null은 "0"이 아니라 "—"로 — 값이 없는 것과 0인 것은 다르다(다른 1계층 화면과 같은 방침). */
function formatDays(value: number | null): string {
  return value === null || value === undefined ? '—' : `${value}일`
}

function formatRatio(value: number | null): string {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
