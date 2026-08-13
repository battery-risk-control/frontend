import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchRiskMonitoringEvent, fetchRiskMonitoringEvents } from '../../../api/publicRiskMonitoring.api'
import type { RiskExternalSignal, RiskGrade, RiskMonitoringDetail, RiskMonitoringEvent } from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { Pagination } from '../../../components/ui/Pagination/Pagination'
import { useAuthState } from '../../../lib/useAuthState'
import { PUBLIC_SIDE_NAV_ITEMS } from '../../../lib/publicNav'
import styles from './PublicRiskMonitoringPage.module.css'

/** 필터 "전체"를 뜻하는 값. 백엔드에는 파라미터를 생략해서 보낸다. */
const ALL = '전체'

/** 화면 상단 기간 필터. 백엔드 days 파라미터 상한(180)을 넘지 않는다. */
const PERIOD_OPTIONS = [
  { label: '최근 24시간', days: 1 },
  { label: '최근 7일', days: 7 },
  { label: '최근 30일', days: 30 },
  { label: '최근 180일', days: 180 },
]

const GRADE_OPTIONS = [ALL, '심각', '주의', '정상']

/** 신뢰도(확정/경고/참고) 필터. 백엔드 confidence_label 값과 정확히 일치해야 서버 필터가 먹는다. */
const CONFIDENCE_OPTIONS = [ALL, '확정', '경고', '참고']

/**
 * 자재 필터. 백엔드 {@code RiskEventService.MATERIAL_NAME_KO}의 8종과 같은 값이며 <b>닫힌 집합</b>이라
 * 데이터에서 뽑지 않고 고정한다 — 수집된 뉴스에 없는 자재도 선택할 수 있어야 "흑연 관련 뉴스가
 * 아직 없다"는 것 자체를 확인할 수 있다. 국가와 달리 후보가 8개뿐이라 목록이 길어지지도 않는다.
 */
const MATERIAL_OPTIONS = [
  ALL, '리튬', '코발트', '니켈', '흑연', '망간', '구리', '알루미늄', '희토류',
]

const DEFAULT_DAYS = 7

/** 이벤트 목록 한 페이지 건수. */
const EVENTS_PER_PAGE = 6

/** 조회 시점에 확정된 필터 값. effect가 최신 state를 인자로 받아 쓰도록 묶어 둔다. */
interface AppliedFilters {
  grade: string
  confidence: string
  country: string
  material: string
  days: number
}

/** 국가 필터 후보. 좌표표는 93개국이지만 실제로 뉴스가 붙는 국가는 소수라 결과에서 뽑는다. */
interface CountryOption {
  code: string
  name: string
}

function collectCountries(events: RiskMonitoringEvent[]): CountryOption[] {
  const byCode = new Map<string, string>()
  for (const event of events) {
    if (event.country_code) {
      byCode.set(event.country_code, event.country_name ?? event.country_code)
    }
  }
  return [...byCode]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

/**
 * 비로그인 `/public/risk-monitoring` — 구매팀 1계층 "리스크 모니터링"을
 * `origin/minji-tier1-dashboard`의 `RiskMonitoringPage.tsx` 기준으로 이식했다(2026-08-03,
 * 지난 `5bfd7db`가 구버전 `origin/minji` 기준이었던 것을 정정 — `?eventId=` URL 복원,
 * `returnTo` 왕복, 동적 버튼 라벨(`resolveAction`), `hasSignalInputs` 예외 처리, 자재별
 * 세부 breakdown이 이번에 새로 반영됐다).
 *
 * **원본과의 차이(완전 공개 + mock 폴백)**: 원본은 `accessToken` 필수 + `RequireAuth
 * tier="purchasing"` 게이트가 있어 로그인하지 않으면 화면이 비어 있었다. 이 화면은
 * `publicRiskMonitoring.api.ts`가 ①단계(mock)에서 항상 데이터를 반환하도록 바꿔, 로그인
 * 여부와 무관하게 접근 가능하다 — 그래서 원본에 있던 `apiConfigured` 가드·안내 문구를
 * 제거했다(mock이 항상 있어 "API 미설정" 상태 자체가 없다). ②/③단계(실 백엔드)에서
 * 비로그인으로 접근하면 이 화면들에 대응하는 공개(비인증) 엔드포인트가 없어
 * `publicRiskMonitoring.api.ts`가 `LOGIN_REQUIRED_MESSAGE`를 던지고, 그 메시지가 기존
 * `listError`/`detailError` 표시 경로 그대로 화면에 나타난다.
 *
 * 목록은 GDELT 15분 스케줄러가 수집·번역한 뉴스이고, 각 기사에 분석·멀티에이전트 결과가
 * 붙은 만큼 등급이 얹힌다. **잠정/확정 구분이 이 화면의 핵심이다** —
 *
 * - 멀티에이전트 실행 전: 외부신호(XGBoost 트리아지 + LLM)만으로 매긴 등급 + 신뢰도 배지(참고/경고)
 * - 멀티에이전트 실행 후: 종합 위험도로 등급이 갱신되고 신뢰도가 "확정"이라 배지가 사라진다
 *
 * "ERP·계약 영향 분석" 버튼은 여기서 분석을 돌리지 않고 **AI 브리핑 화면으로 이동**한다
 * (`/public/ai-briefing?source=NEWS&ref={event_id}&returnTo=...`, 원본은 `/purchasing/...`).
 * 실행은 그 화면의 "LLM 브리핑 생성"이 맡는다.
 */
export function PublicRiskMonitoringPage() {
  const { accessToken } = useAuthState()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<RiskMonitoringEvent[]>([])
  const [selected, setSelected] = useState<RiskMonitoringDetail | null>(null)
  const [grade, setGrade] = useState(ALL)
  const [confidence, setConfidence] = useState(ALL)
  const [country, setCountry] = useState(ALL)
  const [material, setMaterial] = useState(ALL)
  const [days, setDays] = useState(DEFAULT_DAYS)
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  // 첫 렌더부터 조회가 걸리므로 true로 시작한다. 이후 true로 되돌리는 건 조회를 유발하는
  // 조작(필터 변경·새로고침)의 몫이고, 아래 effect는 끝났을 때 false로 내리기만 한다 —
  // effect 본문에서 동기 setState를 하지 않아야 cascading render 없이 동작한다.
  const [isLoading, setIsLoading] = useState(true)
  /** 같은 필터로 다시 조회(새로고침)하려면 의존성이 실제로 바뀌어야 한다. */
  const [reloadToken, setReloadToken] = useState(0)
  /** 이벤트 목록 현재 페이지(0-indexed). 필터 변경·새로고침 시 0으로 되돌린다. */
  const [page, setPage] = useState(0)

  useEffect(() => {
    // 필터를 빠르게 바꾸면 이전 요청이 늦게 도착해 최신 결과를 덮어쓸 수 있다.
    let cancelled = false
    async function load(token: string | null, filters: AppliedFilters) {
      try {
        const result = await fetchRiskMonitoringEvents(token, {
          days: filters.days,
          grade: filters.grade === ALL ? undefined : filters.grade,
          confidence: filters.confidence === ALL ? undefined : filters.confidence,
          country: filters.country === ALL ? undefined : filters.country,
          material: filters.material === ALL ? undefined : filters.material,
          // 백엔드 상한(200)까지 요청한다 — 기존 50은 프론트에서만 걸던 제한이라 그 이상 존재하는
          // 이벤트가 잘려 보였다(7일 내 실제 79건 등).
          limit: 200,
        })
        if (cancelled) return
        setEvents(result)
        setListError(null)
        // 국가 후보는 "국가로 좁히지 않은" 응답에서만 갱신한다 — 좁힌 결과로 갱신하면 선택한
        // 국가 하나만 남아 다른 국가로 옮겨갈 수 없게 된다(직접 "전체"로 되돌려야 함).
        if (filters.country === ALL) {
          setCountryOptions(collectCountries(result))
        }
      } catch (err) {
        if (cancelled) return
        setEvents([])
        setListError(err instanceof Error ? err.message : '이벤트 목록을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load(accessToken, { grade, confidence, country, material, days })
    return () => {
      cancelled = true
    }
  }, [accessToken, confidence, country, days, grade, material, reloadToken])

  /**
   * URL의 {@code ?eventId=}로 상세를 복원한다. AI 브리핑에서 돌아왔을 때(returnTo) 같은 기사가
   * 다시 열리게 하는 경로이며, 링크를 공유하거나 새로고침해도 선택이 유지된다.
   *
   * 목록 조회와 독립적으로 돈다 — 상세는 단건 조회라 그 기사가 현재 필터·기간에 걸리지
   * 않아도 열려야 한다.
   */
  useEffect(() => {
    const requested = Number(searchParams.get('eventId'))
    if (!Number.isFinite(requested) || requested <= 0) {
      return
    }
    let cancelled = false
    async function restore(token: string | null, eventId: number) {
      try {
        const detail = await fetchRiskMonitoringEvent(token, eventId)
        if (!cancelled) setSelected(detail)
      } catch (err) {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : '이벤트 상세를 불러오지 못했습니다.')
        }
      }
    }
    void restore(accessToken, requested)
    return () => {
      cancelled = true
    }
    // reloadToken을 넣어, 브리핑을 돌리고 돌아온 뒤 새로고침하면 상세도 함께 다시 읽는다.
  }, [accessToken, searchParams, reloadToken])

  /** 필터 변경·새로고침의 공통 진입점 — 조회를 유발하는 쪽이 로딩 표시를 켠다. */
  const requestReload = useCallback((apply?: () => void) => {
    setIsLoading(true)
    apply?.()
    setPage(0)
    setReloadToken((previous) => previous + 1)
  }, [])

  /** 필터를 한 번에 되돌린다. 하나씩 "전체"로 바꾸면 그때마다 조회가 나간다. */
  function resetFilters() {
    requestReload(() => {
      setGrade(ALL)
      setConfidence(ALL)
      setCountry(ALL)
      setMaterial(ALL)
      setDays(DEFAULT_DAYS)
    })
  }

  const filtersApplied =
    grade !== ALL || confidence !== ALL || country !== ALL || material !== ALL || days !== DEFAULT_DAYS

  // 목록을 6건씩 나눠 보여준다. events가 줄어 현재 페이지가 범위를 벗어나면 마지막 페이지로 클램프한다.
  const pageCount = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE))
  const currentPage = Math.min(page, pageCount - 1)
  const pagedEvents = events.slice(
    currentPage * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE + EVENTS_PER_PAGE,
  )

  /**
   * 선택한 이벤트를 URL에 남긴다 — AI 브리핑에 다녀와도 같은 기사가 열려 있어야 하기 때문이다.
   * {@code replace}로 넣어 뒤로가기 기록을 목록 클릭마다 쌓지 않는다.
   */
  async function handleSelect(eventId: number) {
    setDetailError(null)
    setSearchParams({ eventId: String(eventId) }, { replace: true })
    try {
      setSelected(await fetchRiskMonitoringEvent(accessToken, eventId))
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : '이벤트 상세를 불러오지 못했습니다.')
    }
  }

  /**
   * AI 브리핑 화면으로 이 기사를 넘긴다. {@code returnTo}에 선택한 eventId까지 실어 보내
   * 돌아왔을 때 같은 기사가 열려 있게 한다.
   */
  function handleErpImpact() {
    if (!selected) return
    const returnTo = `/public/risk-monitoring?eventId=${selected.event_id}`
    navigate(
      `/public/ai-briefing?source=NEWS&ref=${selected.event_id}`
        + `&returnTo=${encodeURIComponent(returnTo)}`,
    )
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={PUBLIC_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div>
            <h1 className={styles.heading}>리스크 모니터링</h1>
            <p className={styles.subheading}>
              수집된 외부 이벤트를 국가·등급·원자재별로 확인합니다
            </p>
          </div>

          <section className={styles.filterBar} aria-label="이벤트 필터">
            <label className={styles.filter}>
              <span className={styles.filterLabel}>등급</span>
              <select
                value={grade}
                onChange={(event) => {
                  const next = event.target.value
                  requestReload(() => setGrade(next))
                }}
              >
                {GRADE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={styles.filter}>
              <span className={styles.filterLabel}>신뢰도</span>
              <select
                value={confidence}
                onChange={(event) => {
                  const next = event.target.value
                  requestReload(() => setConfidence(next))
                }}
              >
                {CONFIDENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={styles.filter}>
              <span className={styles.filterLabel}>국가</span>
              <select
                value={country}
                onChange={(event) => {
                  const next = event.target.value
                  requestReload(() => setCountry(next))
                }}
              >
                <option value={ALL}>{ALL}</option>
                {countryOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </label>
            <label className={styles.filter}>
              <span className={styles.filterLabel}>원자재</span>
              <select
                value={material}
                onChange={(event) => {
                  const next = event.target.value
                  requestReload(() => setMaterial(next))
                }}
              >
                {MATERIAL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className={styles.filter}>
              <span className={styles.filterLabel}>기간</span>
              <select
                value={days}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  requestReload(() => setDays(next))
                }}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.days} value={option.days}>{option.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.resetButton}
              onClick={resetFilters}
              disabled={!filtersApplied}
            >
              필터 초기화
            </button>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => requestReload()}
            >
              새로고침
            </button>
          </section>

          <div className={styles.split}>
            <section className={styles.listPanel} aria-labelledby="event-list-heading">
              <h2 id="event-list-heading" className={styles.panelHeading}>
                이벤트 목록 · {events.length}건
              </h2>
              {isLoading && <p className={styles.notice}>불러오는 중…</p>}
              {listError && <p className={styles.error}>{listError}</p>}
              {!isLoading && !listError && events.length === 0 && (
                <p className={styles.notice}>
                  {filtersApplied
                    ? '해당 조건에 수집된 이벤트가 없습니다. 필터를 넓혀 보세요.'
                    : '아직 수집된 공급망 이벤트가 없습니다.'}
                </p>
              )}
              <ul className={styles.eventList}>
                {pagedEvents.map((event) => (
                  <li key={event.event_id}>
                    <button
                      type="button"
                      className={
                        selected?.event_id === event.event_id
                          ? `${styles.eventCard} ${styles.eventCardSelected}`
                          : styles.eventCard
                      }
                      onClick={() => void handleSelect(event.event_id)}
                      aria-current={selected?.event_id === event.event_id}
                    >
                      <span className={styles.eventBadges}>
                        {event.grade ? (
                          <RiskGradeBadge grade={event.grade} />
                        ) : (
                          <span className={styles.unanalyzed}>미분석</span>
                        )}
                        {/* 확정일 때도 띄운다. 예전에는 잠정일 때만 배지를 달았는데, 다른 화면이
                            전부 확정 여부를 명시하는 마당에 여기만 숨기니 "주의 확정"이어야 할
                            자리가 "주의"로만 보였다 — 판정이 안 끝난 것으로 읽힌다. */}
                        <ConfidenceBadge label={event.confidence_label} />
                      </span>
                      <span className={styles.eventTitle}>{event.headline}</span>
                      <span className={styles.eventMeta}>
                        {event.country_name ?? '국가 미상'} · {event.material} ·{' '}
                        {formatDateTime(event.collected_at)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!isLoading && !listError && events.length > 0 && (
                <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
              )}
            </section>

            <section className={styles.detailPanel} aria-labelledby="event-detail-heading">
              <h2 id="event-detail-heading" className={styles.panelHeading}>
                이벤트 상세
              </h2>
              {detailError && <p className={styles.error}>{detailError}</p>}
              {!selected && <p className={styles.notice}>목록에서 이벤트를 선택하세요.</p>}
              {selected && (
                <EventDetailView detail={selected} onErpImpact={handleErpImpact} />
              )}
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

/**
 * 잠정 등급 안내 문구의 왼쪽 테두리 색을 등급색으로 매핑한다(정상 초록/주의 주황/심각 빨강).
 * 이 문구는 등급을 설명하므로 신뢰도 색(참고/경고)이 아니라 등급색을 써야 한다.
 * RiskGradeBadge와 같은 매핑 패턴.
 */
const PROVISIONAL_GRADE_CLASS: Record<RiskGrade, string> = {
  정상: styles.provisionalNoteNormal,
  주의: styles.provisionalNoteWarning,
  심각: styles.provisionalNoteCritical,
}

function EventDetailView({
  detail,
  onErpImpact,
}: {
  detail: RiskMonitoringDetail
  onErpImpact: () => void
}) {
  const signal = detail.external_signal
  const risk = detail.procurement_risk
  const action = resolveAction(detail)
  return (
    <div className={styles.detailBody}>
      <h3 className={styles.detailTitle}>{detail.headline}</h3>
      {detail.translated && (
        <p className={styles.detailOriginal}>원문: {detail.headline_original}</p>
      )}

      <p className={styles.detailBadges}>
        {detail.grade ? <RiskGradeBadge grade={detail.grade} /> : <span className={styles.unanalyzed}>미분석</span>}
        {/* 목록과 같은 규칙이다 — 한쪽만 숨기면 "목록은 참고, 상세는 확정"처럼 보인다. */}
        <ConfidenceBadge label={detail.confidence_label} />
        <span className={styles.detailTags}>
          {detail.country_name ?? '국가 미상'}
          {detail.impact_domain ? ` · ${detail.impact_domain}` : ''}
        </span>
      </p>

      {/* 등급이 아직 잠정인 이유를 문장으로도 밝힌다 — 배지만으론 무엇이 남았는지 알 수 없다. */}
      {!detail.multi_agent_completed && detail.grade && (
        <p className={`${styles.provisionalNote} ${PROVISIONAL_GRADE_CLASS[detail.grade]}`}>
          외부신호(트리아지·LLM)만 반영된 잠정 등급입니다. ERP·계약 영향 분석을 실행하면 종합
          위험도로 갱신됩니다.
        </p>
      )}

      {detail.summary && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>뉴스 요약</h4>
          <p className={styles.detailText}>{detail.summary}</p>
        </section>
      )}

      <section className={styles.detailSection}>
        <h4 className={styles.detailSectionTitle}>영향 원자재</h4>
        <p className={styles.material}>{detail.material}</p>
      </section>

      {signal && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>외부 신호</h4>
          {hasSignalInputs(signal) ? (
            <p className={styles.detailText}>
              Goldstein {formatNumber(signal.goldstein_scale)} · Tone{' '}
              {formatNumber(signal.tone_score)}
              <br />
              관련 뉴스 {signal.news_count ?? '—'}건 · 위험 점수 {formatNumber(signal.risk_score)}
            </p>
          ) : (
            /*
             * 입력값이 하나도 기록되지 않은 분석. 전부 "—"인 줄을 그대로 두면 "입력이 없는데
             * 점수가 나왔다"로 읽혀 점수를 지어낸 것처럼 보인다 — 점수만 남기고 사유를 밝힌다.
             */
            <>
              <p className={styles.detailText}>
                외부신호 위험 점수 {formatNumber(signal.risk_score)}
              </p>
              <p className={styles.inlineNote}>
                트리아지·LLM 단계까지의 점수입니다. 이 뉴스는 세부 입력 신호를 저장하기 전에
                분석돼 Goldstein·Tone·관련 뉴스 건수가 남아 있지 않습니다 — 이후 수집분부터는
                함께 기록됩니다.
              </p>
            </>
          )}
        </section>
      )}

      {risk && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>ERP·계약 종합 평가</h4>
          {risk.completed ? (
            <p className={styles.detailText}>
              종합 위험도 {formatNumber(risk.risk_score)} ({risk.risk_level})
              <br />
              외부신호 {formatNumber(risk.external_signal_score)} · ERP 노출도{' '}
              {formatNumber(risk.erp_exposure_score)} · 계약공백{' '}
              {formatNumber(risk.contract_gap_score)}
            </p>
          ) : (
            // 조기 종료된 실행은 0점·NORMAL로 기록되므로 점수를 보여주면 안 된다 — 사유만 밝힌다.
            <p className={styles.detailText}>분석은 실행됐지만 종합 점수까지 가지 못했습니다.</p>
          )}
          {risk.risk_reasons.length > 0 && (
            <ul className={styles.reasonList}>
              {risk.risk_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}

          {/*
           * 자재별 내역은 대상이 둘 이상일 때만 펼친다 — 하나뿐이면 위 종합 점수와 같은 값이라
           * 같은 숫자를 두 번 보여주는 셈이 된다.
           */}
          {risk.target_material_count > 1 && (
            <div className={styles.materialBreakdown}>
              <p className={styles.detailSectionTitle}>
                자재별 결과 · 유효 {risk.valid_material_count}/{risk.target_material_count}
                {risk.representative_material_id && (
                  <span className={styles.footnote}>
                    {' '}· 대표 {risk.representative_material_id}
                  </span>
                )}
              </p>
              <ul className={styles.materialList}>
                {risk.material_assessments.map((item) => (
                  <li key={item.erp_material_id}>
                    <span
                      className={
                        item.erp_material_id === risk.representative_material_id
                          ? `${styles.materialCode} ${styles.materialCodeRepresentative}`
                          : styles.materialCode
                      }
                    >
                      {item.erp_material_id}
                    </span>
                    {item.valid
                      ? ` ${item.risk_level} ${formatNumber(item.risk_score)}점`
                      : ' 조기 종료 — 종합 점수 없음'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {detail.coordinates && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>좌표</h4>
          <p className={styles.detailText}>
            {detail.coordinates.lat}, {detail.coordinates.lng}
            <span className={styles.footnote}> (국가 기준점)</span>
          </p>
        </section>
      )}

      <div className={styles.actions}>
        {detail.url ? (
          <a
            className={styles.secondaryAction}
            href={detail.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            기사 원문 열기 ↗
          </a>
        ) : (
          <span className={`${styles.secondaryAction} ${styles.disabledAction}`}>
            원문 링크 없음
          </span>
        )}
        <button
          type="button"
          className={styles.primaryAction}
          onClick={onErpImpact}
          disabled={!detail.erp_impact_available}
        >
          {action.label}
        </button>
      </div>
      {!detail.erp_impact_available && detail.erp_impact_blocked_reason && (
        <p className={styles.blockedReason}>{detail.erp_impact_blocked_reason}</p>
      )}
      {detail.erp_impact_available && action.note && (
        <p className={styles.blockedReason}>{action.note}</p>
      )}
    </div>
  )
}

/**
 * 버튼 문구·안내. 백그라운드 점수화 스케줄러가 있어서 사용자가 누르지 않아도 결과가 생길 수 있으므로,
 * 버튼은 "분석 전/후"가 아니라 지금 결과가 어떤 상태인지를 말해야 한다.
 *
 * 재실행 안내를 붙이는 이유: 평가 저장이 append-only라 다시 돌리면 기존 결과를 덮어쓰는 게 아니라
 * 이력이 하나 더 쌓인다. 눌러도 되는지 판단할 근거를 화면이 줘야 한다.
 */
function resolveAction(detail: RiskMonitoringDetail): { label: string; note: string | null } {
  const risk = detail.procurement_risk
  if (!risk || risk.target_material_count === 0) {
    return { label: 'ERP · 계약 영향 분석', note: null }
  }
  if (risk.completed && risk.valid_material_count < risk.target_material_count) {
    return {
      label: '부분 분석 결과 보기 · 재실행',
      note: `자재 ${risk.target_material_count}개 중 ${risk.valid_material_count}개만 평가됐습니다. `
        + '재실행하면 새 평가 이력이 추가됩니다.',
    }
  }
  if (risk.completed) {
    return { label: 'AI 브리핑 보기 · 재생성', note: '재생성하면 새 평가 이력이 추가됩니다.' }
  }
  // 실행은 됐지만 유효 평가가 하나도 없는 경우(전부 KG 게이트 조기 종료).
  return {
    label: '다시 ERP · 계약 영향 분석하기',
    note: '이전 실행은 종합 점수까지 가지 못했습니다. 재실행하면 새 평가 이력이 추가됩니다.',
  }
}

/** 오늘 수집분은 시:분만, 그 이전은 날짜까지 — 목록 한 줄에 들어가야 해서 짧게 쓴다. */
function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  const isToday = new Date().toDateString() === date.toDateString()
  return isToday
    ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

/** null은 "0"이 아니라 "—"로 — 값이 없는 것과 0인 것은 다르다. */
function formatNumber(value: number | null): string {
  return value === null || value === undefined ? '—' : String(value)
}

/**
 * severity 점수를 만든 입력값이 하나라도 기록돼 있는지. 응답에 값이 있는지만 본다.
 * tone은 0.0이 정상값이라 falsy 검사를 쓰면 안 된다 — null만 걸러야 한다.
 */
function hasSignalInputs(signal: RiskExternalSignal): boolean {
  return (
    signal.goldstein_scale !== null
    || signal.tone_score !== null
    || signal.news_count !== null
  )
}
