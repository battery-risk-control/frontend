import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchContractEvidence,
  fetchMaterialRiskDetail,
  fetchMaterialRiskOverview,
  isMaterialRiskApiConfigured,
} from '../../../api/materialRisk.api'
import type {
  ContractEvidence,
  MaterialRiskDetail,
  MaterialRiskItem,
  MaterialRiskSummary,
} from '../../../api/types'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { useAuthState } from '../../../lib/useAuthState'
import { PURCHASING_SIDE_NAV_ITEMS } from '../../../lib/purchasingNav'
import styles from './MaterialRiskPage.module.css'

/**
 * 1계층 구매팀 원자재 위험. 상단 KPI 4장 + 좌측 자재 목록 + 우측 자재 상세 2단 구성.
 *
 * 원천이 **ERP 테이블**이라 뉴스가 한 건도 없어도 값이 나온다 — 리스크 모니터링(뉴스가 원천)과
 * 대비되는 화면이다. 점수·등급은 멀티에이전트의 ERP Exposure Agent가 계산한 값을 그대로 쓴다.
 *
 * 상세 하단 버튼 두 개는 성격이 다르다.
 * - "계약 RAG 근거 보기" — 조회다. 여러 번 눌러도 부담이 없어 결과를 패널 안에 펼친다.
 * - "AI 브리핑 생성" — 여기서 돌리지 않고 **AI 브리핑 화면으로 이동**한다
 *   (`?source=MATERIAL&ref={erp_material_id}`). 멀티에이전트 실행·저장·근거 표시가 전부 그 화면의
 *   몫이다. 그래도 실행 가능 여부는 `briefing_available`로 미리 받아 버튼을 비활성화한다 —
 *   못 돌릴 대상으로 이동시키면 빈 화면만 보여주는 셈이 된다.
 */
export function MaterialRiskPage() {
  const { accessToken } = useAuthState()
  const [summary, setSummary] = useState<MaterialRiskSummary | null>(null)
  const [materials, setMaterials] = useState<MaterialRiskItem[]>([])
  const [selected, setSelected] = useState<MaterialRiskDetail | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  // 첫 렌더부터 조회가 걸리므로 true로 시작한다(RiskMonitoringPage와 같은 방식).
  const [isLoading, setIsLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  const apiConfigured = isMaterialRiskApiConfigured()

  useEffect(() => {
    if (!accessToken || !apiConfigured) {
      return
    }
    // 새로고침을 연타하면 이전 요청이 늦게 도착해 최신 결과를 덮어쓸 수 있다.
    let cancelled = false
    async function load(token: string) {
      try {
        const overview = await fetchMaterialRiskOverview(token)
        if (cancelled) return
        setSummary(overview.summary)
        setMaterials(overview.materials)
        setListError(null)
      } catch (err) {
        if (cancelled) return
        setSummary(null)
        setMaterials([])
        setListError(err instanceof Error ? err.message : '자재 위험 목록을 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load(accessToken)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured, reloadToken])

  const requestReload = useCallback(() => {
    setIsLoading(true)
    setReloadToken((previous) => previous + 1)
  }, [])

  async function handleSelect(erpMaterialId: string) {
    if (!accessToken) return
    setDetailError(null)
    try {
      setSelected(await fetchMaterialRiskDetail(accessToken, erpMaterialId))
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : '자재 상세를 불러오지 못했습니다.')
    }
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PURCHASING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.heading}>원자재 위험</h1>
              <p className={styles.subheading}>
                ERP 재고와 공급사 의존도를 기준으로 자재별 노출도를 확인합니다
              </p>
            </div>
            <button type="button" className={styles.refreshButton} onClick={requestReload}>
              새로고침
            </button>
          </div>

          {!apiConfigured && (
            <p className={styles.notice}>
              백엔드 API가 설정되지 않았습니다(<code>VITE_API_BASE_URL</code>).
              실 데이터를 보려면 <code>npm run dev:live</code>로 실행하세요.
            </p>
          )}

          <SummaryCards summary={summary} />

          <div className={styles.split}>
            <section className={styles.listPanel} aria-labelledby="material-list-heading">
              <h2 id="material-list-heading" className={styles.panelHeading}>
                자재별 위험 현황
              </h2>
              {isLoading && <p className={styles.notice}>불러오는 중…</p>}
              {listError && <p className={styles.error}>{listError}</p>}
              {!isLoading && !listError && materials.length === 0 && (
                <p className={styles.notice}>평가할 ERP 자재가 없습니다.</p>
              )}
              {materials.length > 0 && (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">자재명</th>
                      <th scope="col">단계</th>
                      <th scope="col" className={styles.numeric}>점수</th>
                      <th scope="col" className={styles.numeric}>재고</th>
                      <th scope="col" className={styles.numeric}>안전재고</th>
                      <th scope="col" className={styles.numeric}>공급사 의존도</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => (
                      <tr
                        key={material.erp_material_id}
                        className={
                          selected?.erp_material_id === material.erp_material_id
                            ? `${styles.row} ${styles.rowSelected}`
                            : styles.row
                        }
                        aria-current={selected?.erp_material_id === material.erp_material_id}
                      >
                        <td>
                          <button
                            type="button"
                            className={styles.rowButton}
                            onClick={() => void handleSelect(material.erp_material_id)}
                          >
                            {material.material_name}
                          </button>
                        </td>
                        <td>
                          {material.grade ? (
                            <RiskGradeBadge grade={material.grade} />
                          ) : (
                            <span className={styles.unavailable}>평가 불가</span>
                          )}
                        </td>
                        <td className={styles.numeric}>{formatScore(material.score)}</td>
                        <td className={styles.numeric}>{formatDays(material.inventory_days)}</td>
                        <td className={styles.numeric}>{formatDays(material.safety_stock_days)}</td>
                        <td className={styles.numeric}>
                          {formatRatio(material.supplier_dependency_ratio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* 평가하지 못한 자재의 사유는 표 밖에 모아둔다 — 셀에 넣으면 표가 읽히지 않는다. */}
              {materials.some((material) => material.unavailable_reason) && (
                <ul className={styles.unavailableList}>
                  {materials
                    .filter((material) => material.unavailable_reason)
                    .map((material) => (
                      <li key={material.erp_material_id}>
                        <b>{material.material_name}</b> — {material.unavailable_reason}
                      </li>
                    ))}
                </ul>
              )}
            </section>

            <section className={styles.detailPanel} aria-labelledby="material-detail-heading">
              <h2 id="material-detail-heading" className={styles.panelHeading}>
                자재 상세
              </h2>
              {detailError && <p className={styles.error}>{detailError}</p>}
              {!selected && <p className={styles.notice}>목록에서 자재를 선택하세요.</p>}
              {selected && (
                <MaterialDetailView
                  key={selected.erp_material_id}
                  detail={selected}
                  accessToken={accessToken}
                />
              )}
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}

/** 상단 KPI 4장. 목록과 같은 응답에서 오므로 별도 조회를 하지 않는다. */
function SummaryCards({ summary }: { summary: MaterialRiskSummary | null }) {
  const cards = [
    { label: '평가 자재', value: summary ? String(summary.assessed_material_count) : '—', tone: styles.toneNeutral },
    { label: '심각', value: summary ? String(summary.critical_count) : '—', tone: styles.toneCritical },
    {
      label: '평균 재고일수',
      value: summary?.average_inventory_days === null || summary === null
        ? '—'
        : String(summary.average_inventory_days),
      tone: styles.toneInfo,
    },
    { label: '데이터 품질', value: summary?.data_quality_status ?? '—', tone: styles.toneNormal },
  ]
  return (
    <section className={styles.summaryRow} aria-label="원자재 위험 요약">
      {cards.map((card) => (
        <div key={card.label} className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{card.label}</span>
          <strong className={`${styles.summaryValue} ${card.tone}`}>{card.value}</strong>
        </div>
      ))}
      {/* 평가하지 못한 자재가 있으면 KPI가 전체를 대표하지 않는다는 사실을 함께 밝힌다. */}
      {summary && summary.unavailable_count > 0 && (
        <p className={styles.summaryFootnote}>
          데이터 부족으로 평가하지 못한 자재 {summary.unavailable_count}종은 위 집계에서 제외했습니다.
        </p>
      )}
    </section>
  )
}

function MaterialDetailView({
  detail,
  accessToken,
}: {
  detail: MaterialRiskDetail
  accessToken: string | null
}) {
  const navigate = useNavigate()
  const [evidence, setEvidence] = useState<ContractEvidence | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const supplier = detail.primary_supplier
  const contract = detail.linked_contract

  async function handleContractEvidence() {
    if (!accessToken) return
    setIsSearching(true)
    setActionError(null)
    try {
      setEvidence(await fetchContractEvidence(accessToken, detail.erp_material_id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '계약 근거를 불러오지 못했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  /** 이 자재를 AI 브리핑 화면으로 넘긴다. 실행은 그 화면의 "LLM 브리핑 생성"이 맡는다. */
  function handleBriefing() {
    navigate(
      `/purchasing/ai-briefing?source=MATERIAL&ref=${encodeURIComponent(detail.erp_material_id)}`,
    )
  }

  return (
    <div className={styles.detailBody}>
      <h3 className={styles.detailTitle}>{detail.material_name}</h3>
      <p className={styles.detailLevel}>
        <span className={levelClass(detail.exposure_level)}>
          {detail.exposure_level}
          {detail.score !== null && ` · ${formatScore(detail.score)}점`}
        </span>
        {detail.forced_critical && (
          <span className={styles.forcedNote}>점수와 무관하게 CRITICAL로 격상된 건입니다</span>
        )}
      </p>

      {detail.unavailable_reason && <p className={styles.blockedReason}>{detail.unavailable_reason}</p>}

      {detail.score !== null && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>ERP 노출 정보</h4>
          <dl className={styles.factList}>
            <Fact label="현재 재고" value={formatDays(detail.inventory_days)} />
            <Fact label="안전 재고" value={formatDays(detail.safety_stock_days)} />
            <Fact
              label="예상 입고"
              value={detail.next_eta_days === null ? '—' : `${detail.next_eta_days}일 후`}
            />
            <Fact label="공급 공백" value={formatDays(detail.expected_supply_gap_days)} />
            <Fact label="공급사 의존도" value={formatRatio(detail.supplier_dependency_ratio)} />
          </dl>
          {/* 재고 숫자가 언제 기준인지 밝힌다 — ERP 시드가 고정 스냅샷이라 오늘 값이 아니다. */}
          {detail.inventory_snapshot_at && (
            <p className={styles.footnote}>
              재고 기준 {formatDate(detail.inventory_snapshot_at)} · 데이터 품질{' '}
              {detail.data_quality_status}
            </p>
          )}
        </section>
      )}

      {supplier && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>주 공급사</h4>
          <p className={styles.detailText}>
            {supplier.supplier_name ?? '—'}
            <br />
            <span className={styles.footnote}>
              {supplier.erp_supplier_id} · 상태 {supplier.supplier_status} · 대체 공급사{' '}
              {ALTERNATIVE_LABEL[supplier.alternative_supplier_status ?? ''] ??
                supplier.alternative_supplier_status ??
                '—'}
            </span>
          </p>
        </section>
      )}

      {contract && (
        <section className={styles.detailSection}>
          <h4 className={styles.detailSectionTitle}>연결 계약</h4>
          <p className={styles.detailText}>
            <b>
              {contract.erp_contract_id} · contract_id {contract.contract_id}
            </b>
            <br />
            <span className={styles.footnote}>
              {contract.contract_name} · {contract.status}
            </span>
          </p>
        </section>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryAction}
          onClick={() => void handleContractEvidence()}
          disabled={!contract || isSearching}
        >
          {isSearching ? '검색 중…' : '계약 RAG 근거 보기'}
        </button>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={handleBriefing}
          disabled={!detail.briefing_available}
        >
          AI 브리핑 생성
        </button>
      </div>
      {!detail.briefing_available && detail.briefing_blocked_reason && (
        <p className={styles.blockedReason}>{detail.briefing_blocked_reason}</p>
      )}
      {actionError && <p className={styles.error}>{actionError}</p>}

      {evidence && <ContractEvidenceView evidence={evidence} />}
    </div>
  )
}

function ContractEvidenceView({ evidence }: { evidence: ContractEvidence }) {
  return (
    <section className={styles.resultSection} aria-label="계약 RAG 근거">
      <h4 className={styles.detailSectionTitle}>계약 근거 · {evidence.results.length}건</h4>
      {/* 무엇을 물었는지 밝히지 않으면 왜 이 조항이 걸렸는지 알 수 없다. */}
      <ul className={styles.questionList}>
        {evidence.questions.map((question) => (
          <li key={question.question_code}>{question.question}</li>
        ))}
      </ul>
      {evidence.mock && (
        <p className={styles.footnote}>mock 임베딩이라 유사도 점수를 신뢰할 수 없습니다.</p>
      )}
      {evidence.results.length === 0 && (
        <p className={styles.notice}>이 계약에서 해당 조항을 찾지 못했습니다.</p>
      )}
      <ul className={styles.clauseList}>
        {evidence.results.map((item) => (
          <li key={`${item.document_id}-${item.chunk_index}`} className={styles.clause}>
            <span className={styles.clauseMeta}>
              p.{item.page_number} · 유사도 {item.similarity_score.toFixed(3)}
            </span>
            <span className={styles.clauseText}>{item.content}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{value}</dd>
    </div>
  )
}

const ALTERNATIVE_LABEL: Record<string, string> = {
  APPROVED: '확보',
  CONDITIONAL: '조건부',
  PENDING: '승인 대기',
  NONE: '없음',
}

function levelClass(exposureLevel: string): string {
  if (exposureLevel === 'CRITICAL') return `${styles.levelTag} ${styles.toneCritical}`
  if (exposureLevel === 'WARNING') return `${styles.levelTag} ${styles.toneWarning}`
  if (exposureLevel === 'NORMAL') return `${styles.levelTag} ${styles.toneNormal}`
  return `${styles.levelTag} ${styles.toneNeutral}`
}

/** null은 "0"이 아니라 "—"로 — 값이 없는 것과 0인 것은 다르다(RiskMonitoringPage와 같은 방침). */
function formatScore(value: number | null): string {
  return value === null || value === undefined ? '—' : String(Math.round(value))
}

function formatDays(value: number | null): string {
  return value === null || value === undefined ? '—' : `${value}일`
}

function formatRatio(value: number | null): string {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}
