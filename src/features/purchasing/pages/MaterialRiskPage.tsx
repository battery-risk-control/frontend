import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import { hasMeaningfulPageNumbers } from '../../../lib/clausePages'
import { dataQualityLabel, dataQualityTone } from '../../../lib/dataQuality'
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
  const [searchParams, setSearchParams] = useSearchParams()
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
    // 첫 진입은 백엔드 캐시를 그대로 쓰고, "새로고침"을 눌렀을 때만 다시 계산시킨다 —
    // 눌렀는데 같은 숫자가 나오면 버튼이 고장 난 것으로 보인다.
    async function load(token: string, forceRefresh: boolean) {
      try {
        const overview = await fetchMaterialRiskOverview(token, forceRefresh)
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
    void load(accessToken, reloadToken > 0)
    return () => {
      cancelled = true
    }
  }, [accessToken, apiConfigured, reloadToken])

  const requestReload = useCallback(() => {
    setIsLoading(true)
    setReloadToken((previous) => previous + 1)
  }, [])

  const requestedMaterialId = searchParams.get('material')
  useEffect(() => {
    if (!requestedMaterialId || !accessToken || selected?.erp_material_id === requestedMaterialId) return
    let cancelled = false
    fetchMaterialRiskDetail(accessToken, requestedMaterialId)
      .then((detail) => {
        if (cancelled) return
        setDetailError(null)
        setSelected(detail)
      })
      .catch((err) => {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : '자재 상세를 불러오지 못했습니다.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, requestedMaterialId, selected?.erp_material_id])

  function selectMaterial(erpMaterialId: string) {
    setSearchParams({ material: erpMaterialId })
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
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

          <SummaryCards summary={summary} materials={materials} />

          <div className={styles.split}>
            <section className={styles.listPanel} aria-labelledby="material-list-heading">
              <h2 id="material-list-heading" className={styles.panelHeading}>
                자재별 위험 현황
              </h2>
              {isLoading && (
                <div aria-busy="true" aria-label="자재별 위험 현황 불러오는 중">
                  <SkeletonText lines={6} lastLineWidth="50%" />
                </div>
              )}
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
                        role="button"
                        tabIndex={0}
                        aria-selected={selected?.erp_material_id === material.erp_material_id}
                        onClick={() => selectMaterial(material.erp_material_id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            selectMaterial(material.erp_material_id)
                          }
                        }}
                      >
                        <td>
                          <span className={styles.rowButton}>
                            {material.material_name}
                          </span>
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

/** 데이터 품질 색 등급 → 이 화면의 CSS 클래스. */
const QUALITY_TONE_CLASS: Record<ReturnType<typeof dataQualityTone>, string> = {
  normal: styles.toneNormal,
  warning: styles.toneWarning,
  critical: styles.toneCritical,
  neutral: styles.toneNeutral,
}

/**
 * 데이터 품질 KPI 한 장.
 *
 * 서버가 주는 `data_quality_status`는 **점수가 나온 자재** 중 가장 나쁜 값이다(평가하지 못한
 * 자재는 빠져 있고, 그쪽은 각주와 목록의 "평가 불가"가 맡는다). 그것만 띄우면 몇 종이 걸린
 * 것인지 알 수 없어 같은 상태인 자재 수를 세어 붙인다.
 *
 * 세는 대상을 `score !== null`로 좁히는 이유: 서버가 이 상태를 고른 모집단과 같아야 한다.
 * 전체에서 세면 카드는 "정상"인데 건수만 결측 자재를 포함해 커지는 앞뒤 안 맞는 값이 나온다.
 *
 * VALID일 때는 건수를 붙이지 않는다. "정상 9종"은 옆 카드(평가 자재 9)와 같은 말이다.
 */
function qualityCardValue(summary: MaterialRiskSummary, materials: MaterialRiskItem[]): string {
  const label = dataQualityLabel(summary.data_quality_status)
  if (summary.data_quality_status === 'VALID') return label
  const affected = materials.filter(
    (material) =>
      material.score !== null && material.data_quality_status === summary.data_quality_status,
  ).length
  return affected > 0 ? `${label} ${affected}종` : label
}

/** 상단 KPI 4장. 목록과 같은 응답에서 오므로 별도 조회를 하지 않는다. */
function SummaryCards({
  summary,
  materials,
}: {
  summary: MaterialRiskSummary | null
  materials: MaterialRiskItem[]
}) {
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
    {
      label: '데이터 품질',
      value: summary ? qualityCardValue(summary, materials) : '—',
      tone: summary
        ? QUALITY_TONE_CLASS[dataQualityTone(summary.data_quality_status)]
        : styles.toneNeutral,
    },
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

      {/*
        표시 조건이 "점수가 있는가"가 아니라 "ERP Context를 만들었는가"다. 점수는 없는데
        재고·의존도는 아는 경우가 실제로 있고(예: 일평균 사용량 누락 → Agent가 점수를 만들지 않음),
        점수 유무로 막으면 확인할 수 있는 정보까지 통째로 감춘다.
      */}
      {hasErpContext(detail) && (
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
              {dataQualityLabel(detail.data_quality_status)}
            </p>
          )}
        </section>
      )}

      {/* ERP Agent가 남긴 경고 + 재고 노후 판정. 숫자를 믿어도 되는지 판단할 근거다. */}
      {detail.warnings.length > 0 && (
        <ul className={styles.warningList}>
          {detail.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
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
          {/*
            사람이 읽는 계약명을 앞에 세운다. 예전에는 `CTR-016 · contract_id 17`이 굵게 오고
            계약명이 회색 각주로 밀려 있었는데, contract_id는 DB PK라 구매 담당자에게 아무
            뜻이 없다 — RAG 검색 필터로는 계속 쓰이지만 그건 화면 밖의 일이다.
          */}
          <p className={styles.detailText}>
            <b>{contract.contract_name ?? contract.erp_contract_id ?? '이름 없는 계약'}</b>
            <br />
            <span className={styles.footnote}>
              {[contract.erp_contract_id, contractStatusLabel(contract.status)]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </p>
        </section>
      )}

      {/*
        "확인이 필요하다"에서 멈추지 않고 **무엇을** 확인해야 하는지까지 말한다. 그 목록은 ERP
        Agent가 이미 만들어 상세 응답에 담아 보낸 것이다 — erp_rules.yaml의 contractQuestionRules가
        발주 지연 상태와 대체 공급사 상태를 보고 고른 질문이라, 이 자재가 왜 걸렸는지가 질문의
        내용에 그대로 드러난다. 지금까지는 이 값이 버튼을 눌러야만 보였다.

        어떤 규칙이 켜졌는지를 화면이 역으로 추론하지는 않는다. 규칙은 erp_rules.yaml에 있고,
        그걸 프론트에서 흉내 내면 규칙이 바뀔 때 화면만 조용히 틀린 말을 하게 된다.

        근거를 불러온 뒤에는 목록을 감춘다 — 아래 결과 영역이 같은 질문을 답과 함께 다시
        보여주므로, 좁은 패널에 같은 목록이 두 번 쌓이지 않게 한다.
      */}
      {detail.contract_review_required && contract && (
        <div
          className={
            // 심각(CRITICAL) 자재는 등급 색(빨강)과 맞춰 안내 박스도 빨간색으로 강조한다.
            detail.exposure_level === 'CRITICAL'
              ? `${styles.reviewRequired} ${styles.reviewRequiredCritical}`
              : styles.reviewRequired
          }
        >
          <p className={styles.reviewRequiredTitle}>
            ERP 상황상 계약 조항 확인이 필요한 자재입니다.
          </p>
          {evidence === null && detail.contract_questions.length > 0 && (
            <ul className={styles.reviewRequiredList}>
              {detail.contract_questions.map((question) => (
                <li key={question.question_code}>{question.question}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={
            detail.contract_review_required
              ? `${styles.secondaryAction} ${styles.secondaryActionUrgent}`
              : styles.secondaryAction
          }
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
  // 지금 적재된 계약서가 전부 txt라 페이지가 늘 1이다. 뜻이 있을 때만 보여준다.
  const showPages = hasMeaningfulPageNumbers(evidence.results.map((item) => item.page_number))
  return (
    <section className={styles.resultSection} aria-label="계약 RAG 근거">
      <h4 className={styles.detailSectionTitle}>계약 근거</h4>
      {/*
        건수를 제목에 붙이지 않는다. 예전 제목이 "계약 근거 · 5건"이었는데 바로 아래 질문이
        공교롭게 5개라 "5건 = 이 질문들"로 읽혔다. 세는 숫자는 그 대상 목록 바로 위에 둔다.

        무엇을 물었는지 밝히지 않으면 왜 이 조항이 걸렸는지 알 수 없다.
      */}
      <p className={styles.evidenceLabel}>검색한 질문</p>
      <ul className={styles.questionList}>
        {evidence.questions.map((question) => (
          <li key={question.question_code}>{question.question}</li>
        ))}
      </ul>
      {evidence.mock && (
        <p className={styles.footnote}>mock 임베딩이라 조항 순서를 신뢰할 수 없습니다.</p>
      )}
      {evidence.results.length === 0 ? (
        <p className={styles.notice}>이 계약에서 해당 조항을 찾지 못했습니다.</p>
      ) : (
        <p className={styles.evidenceLabel}>찾은 조항 {evidence.results.length}건</p>
      )}
      <ul className={styles.clauseList}>
        {evidence.results.map((item, index) => (
          <li key={`${item.document_id}-${item.chunk_index}`} className={styles.clause}>
            {/*
              제목을 먼저 세운다. 청크 하나가 4.01·4.02·4.03을 통째로 담고 있어서 영문 원문만
              깔면 무엇에 관한 조항인지 읽기 전에는 알 수 없다. 백엔드가 본문 머리에서 뽑아
              한글 라벨까지 입혀 보낸다.
            */}
            <span className={styles.clauseTitle}>{item.clause_title}</span>
            {/*
              유사도 원값(0.474 같은)을 그대로 보여주지 않는다. 구매 담당자에게 그 숫자는
              높은 건지 낮은 건지 알 수 없고, 임베딩 모델이 바뀌면 같은 관련도라도 값이
              달라진다. 대신 벡터 검색이 이미 매긴 순서를 순위로 보여준다.
              원값은 title에 남겨 개발 중 확인할 수 있게 한다.
            */}
            <span
              className={styles.clauseMeta}
              title={`유사도 ${item.similarity_score.toFixed(3)}`}
            >
              {index + 1}순위
              {showPages && ` · p.${item.page_number}`}
            </span>
            <span className={styles.clauseText}>{highlightFigures(item.content)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * ERP Context를 만들 수 있었는지. 백엔드가 자재를 찾긴 했지만 재고 행이 없어 계산을 시작조차
 * 못 한 경우(unavailable_reason만 채워진 응답)와, 계산은 했는데 점수만 없는 경우를 가른다.
 */
function hasErpContext(detail: MaterialRiskDetail): boolean {
  return detail.unit !== null || detail.primary_supplier !== null
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.fact}>
      <dt className={styles.factLabel}>{label}</dt>
      <dd className={styles.factValue}>{value}</dd>
    </div>
  )
}

/**
 * 조항 본문에서 눈에 걸려야 하는 수치. 위약금률·상한·납기일수처럼 **판단이 걸리는 숫자**만
 * 잡는다("3.0%", "30.0%", "90 days", "fifteen (15) Business Days", "USD 1,200.00").
 *
 * 조항 하나가 문단 여럿을 담고 있어서, 정작 물어본 것의 답인 수치가 영문 문장 속에 묻힌다.
 * 번역·요약은 LLM이 필요하지만 "어디를 봐야 하는가"는 이 정도로 짚어진다.
 *
 * 캡처 그룹이 하나라 `split`이 [본문, 수치, 본문, 수치, …]로 돌려준다 — 홀수 자리가 수치다.
 */
const FIGURE_PATTERN =
  /(\d+(?:\.\d+)?\s?%|\d+(?:,\d{3})*(?:\.\d+)?\s+(?:Business\s+)?(?:days?|weeks?|months?|years?)|USD\s?\d[\d,]*(?:\.\d+)?)/i

function highlightFigures(text: string) {
  return text
    .split(FIGURE_PATTERN)
    .map((part, index) =>
      index % 2 === 1 ? (
        <b key={index} className={styles.figure}>
          {part}
        </b>
      ) : (
        part
      ),
    )
}

/** 계약 상태 코드 → 한글. 모르는 코드는 원문 그대로 둔다 — 임의로 뭉뚱그리면 새 상태가 묻힌다. */
const CONTRACT_STATUS_LABEL: Record<string, string> = {
  DRAFT: '초안',
  ACTIVE: '유효',
  EXPIRED: '만료',
  TERMINATED: '해지',
}

function contractStatusLabel(status: string | null): string | null {
  if (!status) return null
  return CONTRACT_STATUS_LABEL[status] ?? status
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
