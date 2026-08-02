import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
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
  AiBriefingSource,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { useAuthState } from '../../../lib/useAuthState'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import styles from './AiBriefingPage.module.css'

const SOURCES: AiBriefingSource[] = ['NEWS', 'MATERIAL', 'CONTRACT']

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
  const [actionError, setActionError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
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
    async function load(token: string) {
      try {
        const items = await fetchRecentAiBriefings(token)
        if (!cancelled) setRecent(items)
      } catch {
        // 최근 목록이 비어도 생성은 할 수 있어야 하므로 화면을 막지 않는다.
        if (!cancelled) setRecent([])
      }
    }
    void load(accessToken)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured, recentToken])

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

  const refreshRecent = useCallback(() => setRecentToken((previous) => previous + 1), [])

  async function handleGenerate() {
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
            context={context}
            hasTarget={Boolean(source && ref)}
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
          {context && !context.generate_available && context.generate_blocked_reason && (
            <p className={styles.blockedReason}>{context.generate_blocked_reason}</p>
          )}
          {actionError && <p className={styles.error}>{actionError}</p>}

          <div className={styles.split}>
            <section className={styles.briefingPanel} aria-labelledby="briefing-heading">
              <h2 id="briefing-heading" className={styles.panelHeading}>
                구매 위험 브리핑
              </h2>
              {isGenerating && <p className={styles.notice}>멀티에이전트 실행 중…</p>}
              {!isGenerating && !detail && briefingId && (
                <p className={styles.notice}>브리핑을 불러오는 중…</p>
              )}
              {!isGenerating && !detail && !briefingId && (
                <p className={styles.notice}>
                  {source && ref
                    ? '"LLM 브리핑 생성"을 누르면 ERP · 계약 근거를 모아 브리핑을 만듭니다.'
                    : '리스크 이벤트 · 원자재 위험 · 계약 · RAG 화면에서 대상을 골라 오거나, 최근 브리핑을 열어 보세요.'}
                </p>
              )}
              {detail && <BriefingResult detail={detail} />}
            </section>

            <div className={styles.sideColumn}>
              <EvidencePanel detail={detail} />
              <RecentPanel items={recent} onOpen={handleOpen} />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
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
        // 조기 종료된 실행은 0점·NORMAL로 응답이 나가므로 등급으로 보여주면 안 된다 — 사유만 밝힌다.
        <p className={styles.blockedReason}>
          멀티에이전트가 ERP · 계약 노드까지 가지 못해 종합 점수가 나오지 않았습니다.
        </p>
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
          <EvidenceRow label="최종 위험" step={detail.evidence_chain.final_risk} highlight />
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
}: {
  label: string
  step: { level: string | null; score: number | null; note: string | null }
  highlight?: boolean
}) {
  // 계약 RAG처럼 등급이 없는 칸은 note("3개 조항")가 값을 대신한다.
  const value = step.level
    ? `${step.level}${step.score === null ? '' : ` · ${Math.round(step.score)}`}`
    : (step.note ?? '—')

  return (
    <div className={styles.evidenceRow}>
      <span className={styles.evidenceLabel}>{label}</span>
      <span className={highlight ? levelClass(step.level ?? '') : styles.evidenceValue}>{value}</span>
    </div>
  )
}

/** 우측 하단 "최근 브리핑". 팀 전체 공용이라 다른 사람이 만든 것도 보인다. */
function RecentPanel({
  items,
  onOpen,
}: {
  items: AiBriefingListItem[]
  /** 항목 전체를 넘긴다 — 상세를 열 때 `source_type`·`source_ref`로 상단 대상까지 맞춰야 한다. */
  onOpen: (item: AiBriefingListItem) => void
}) {
  return (
    <section className={styles.sidePanel} aria-labelledby="recent-heading">
      <h2 id="recent-heading" className={styles.panelHeading}>
        최근 브리핑
      </h2>
      {items.length === 0 && <p className={styles.notice}>저장된 브리핑이 아직 없습니다.</p>}
      {items.map((item) => (
        <article key={item.briefing_id} className={styles.recentCard}>
          <p className={styles.recentTitle}>{item.subject_title ?? item.news_id}</p>
          <p className={styles.recentMeta}>
            <span className={levelClass(item.composite ? item.procurement_risk_level : '')}>
              {item.composite
                ? `${item.procurement_risk_level} · ${Math.round(item.procurement_risk_score)}`
                : '평가 미완료'}
            </span>
            {item.review_passed !== null && ` · ${item.review_passed ? '검증 통과' : '검증 실패'}`}
          </p>
          <p className={styles.recentDate}>{formatDateTime(item.created_at)}</p>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => onOpen(item)}
          >
            브리핑 상세 보기
          </button>
        </article>
      ))}
    </section>
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
