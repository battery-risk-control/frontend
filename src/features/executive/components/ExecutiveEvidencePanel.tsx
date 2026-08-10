import type { AiBriefingDetail } from '../../../api/types'
import styles from './ExecutiveEvidencePanel.module.css'

export type EvidenceTab = 'summary' | 'erp' | 'contract' | 'verification'

interface Props {
  item: AiBriefingDetail | null
  tab?: EvidenceTab
  onTabChange?: (tab: EvidenceTab) => void
  sourceUrl?: string | null
  /** 브리핑 화면은 의사결정 요약, 검증 화면은 근거 일관성 확인에 집중한다. */
  mode?: 'briefing' | 'verification' | 'full'
}

export function ExecutiveEvidencePanel({
  item,
  tab = 'summary',
  onTabChange,
  sourceUrl,
  mode = 'full',
}: Props) {
  if (!item) {
    return (
      <aside className={styles.panel}>
        <h2>상세 근거</h2>
        <div className={styles.empty}>위험 사건이나 검증 항목을 선택하면 ERP·계약·AI 검증 근거가 표시됩니다.</div>
      </aside>
    )
  }

  const allTabs: Array<[EvidenceTab, string]> = [
    ['summary', '요약'],
    ['erp', 'ERP 근거'],
    ['contract', '계약 RAG'],
    ['verification', 'AI 검증'],
  ]
  const tabs = allTabs.filter(([key]) => {
    if (mode === 'briefing') return key !== 'verification'
    if (mode === 'verification') return key !== 'summary'
    return true
  })
  const decisionActions = executiveDecisionActions(item)
  const verificationMode = mode === 'verification'

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>{verificationMode ? '검증 결과' : '의사결정 브리핑'}</span>
          <h2>{item.subject_title ?? item.source_headline ?? item.material_name ?? '공급망 위험'}</h2>
        </div>
        <strong className={verificationMode
          ? (item.verification.review_passed ? styles.normal : styles.warning)
          : (styles[item.procurement_risk_level.toLowerCase()] ?? styles.normal)}>
          {verificationMode
            ? (item.verification.review_passed ? '검증 통과' : '검토 필요')
            : `${item.procurement_risk_level} ${item.procurement_risk_score.toFixed(0)}점`}
        </strong>
      </div>

      <div className={styles.tabs}>
        {tabs.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? styles.active : ''} onClick={() => onTabChange?.(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'summary' && (
        <div className={styles.content}>
          <section className={styles.summaryCard}>
            <span className={styles.sectionLabel}>경영 요약</span>
            <div className={styles.riskHeadline}>
              <span>위험 등급</span>
              <strong className={styles[item.procurement_risk_level.toLowerCase()] ?? styles.normal}>
                {levelLabel(item.procurement_risk_level)}
              </strong>
              <b>최종 위험 점수 {item.procurement_risk_score.toFixed(0)}점</b>
            </div>
            <p className={styles.scoreBreakdown}>
              외부 신호 {stepScore(item.evidence_chain.external_signal.score)} · ERP 노출 {stepScore(item.evidence_chain.erp_exposure.score)} · 계약 보호 공백 {stepScore(item.evidence_chain.contract_rag.score)}
            </p>
          </section>
          <div className={styles.summaryMetrics}>
            <SummaryMetric label="최종 위험" value={`${levelLabel(item.procurement_risk_level)} ${item.procurement_risk_score.toFixed(0)}점`} />
            <SummaryMetric label="영향 원자재" value={item.material_name ?? item.material_category ?? '-'} />
            <SummaryMetric
              label="현재 재고"
              value={item.erp_evidence?.inventory_days == null ? '정보 없음' : `${item.erp_evidence.inventory_days.toFixed(1)}일`}
            />
            <SummaryMetric
              label="예상 공급 공백"
              value={item.erp_evidence?.expected_supply_gap_days == null ? '정보 없음' : `${item.erp_evidence.expected_supply_gap_days.toFixed(1)}일`}
            />
          </div>
          <section className={styles.decisionCard}>
            <span>경영진 의사결정</span>
            <strong>{decisionActions[0]}</strong>
            <small>
              검증 {item.verification.review_passed ? '통과' : '검토 필요'} · 계약 근거 {item.contract_findings.length}건
            </small>
          </section>
          <section className={styles.actionCard}>
            <h3>경영진 권고 조치</h3>
            <ol>{decisionActions.map((action) => <li key={action}>{action}</li>)}</ol>
          </section>
          <section className={styles.actionCard}>
            <h3>구매팀 점검 결과</h3>
            {item.recommended_actions.length > 0
              ? <ul>{item.recommended_actions.slice(0, 3).map((action) => <li key={action}>{action}</li>)}</ul>
              : <p className={styles.muted}>저장된 구매팀 권고 조치가 없습니다.</p>}
          </section>
          {sourceUrl && (
            <a className={styles.primaryAction} href={sourceUrl} target="_blank" rel="noopener noreferrer">
              기사 원문 열기 ↗
            </a>
          )}
        </div>
      )}

      {tab === 'erp' && (
        <div className={styles.content}>
          <h3>구매·재고 영향</h3>
          {item.erp_evidence ? (
            <dl className={styles.metrics}>
              <Metric label="ERP 영향도" value={format(item.erp_evidence.exposure_score, '점')} />
              <Metric label="현재 재고" value={format(item.erp_evidence.inventory_days, '일')} />
              <Metric label="안전 재고" value={format(item.erp_evidence.safety_stock_days, '일')} />
              <Metric label="다음 입고" value={format(item.erp_evidence.next_inbound_eta_days, '일 후')} />
              <Metric label="예상 공급 공백" value={format(item.erp_evidence.expected_supply_gap_days, '일')} />
              <Metric label="공급사 의존도" value={item.erp_evidence.supplier_dependency_ratio == null ? '-' : `${(item.erp_evidence.supplier_dependency_ratio * 100).toFixed(1)}%`} />
            </dl>
          ) : <p className={styles.empty}>연결된 ERP 근거가 없습니다.</p>}
        </div>
      )}

      {tab === 'contract' && (
        <div className={styles.content}>
          <h3>계약 조항 근거</h3>
          {item.contract_findings.length > 0 ? item.contract_findings.map((finding, index) => (
            <details className={styles.finding} key={`${index}-${String(finding.contract_id ?? '')}`}>
              <summary>
                <span>{String(finding.clause_name_kr ?? finding.clause_type ?? '관련 조항')}</span>
                <small>계약 {String(finding.contract_id ?? '-')} · {String(finding.page ?? '-')}페이지</small>
              </summary>
              <p>{String(finding.evidence_text ?? finding.content ?? finding.text ?? '검색된 계약 근거')}</p>
            </details>
          )) : <p className={styles.empty}>검색된 계약 RAG 근거가 없습니다.</p>}
        </div>
      )}

      {tab === 'verification' && (
        <div className={styles.content}>
          <h3>멀티에이전트 검증 결과</h3>
          <dl className={styles.metrics}>
            <Metric label="검증 상태" value={item.verification.review_passed ? '통과' : '검토 필요'} />
            <Metric label="LLM 사용" value={item.verification.llm_used ? '사용' : '미사용'} />
            <Metric label="계약 인용" value={item.verification.contract_id == null ? '-' : `${item.verification.contract_id}번 · ${item.verification.contract_page ?? '-'}페이지`} />
            <Metric label="가중치 버전" value={item.verification.weight_version ?? '-'} />
          </dl>
          {item.verification.warnings.length > 0 && <ul>{item.verification.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
        </div>
      )}
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>
}

function format(value: number | null, suffix: string) {
  return value == null ? '-' : `${value.toFixed(1)}${suffix}`
}

function stepScore(value: number | null) {
  return value == null ? '미산정' : `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}점`
}

function levelLabel(level: string) {
  if (level === 'CRITICAL') return '심각'
  if (level === 'WARNING') return '주의'
  return '정상'
}

function executiveDecisionActions(item: AiBriefingDetail) {
  const actions: string[] = item.recommended_actions.map(toExecutiveAction)

  if (item.erp_evidence?.stockout_before_eta || (item.erp_evidence?.expected_supply_gap_days ?? 0) > 0) {
    actions.unshift('생산 차질 시나리오와 고객 납품 영향 보고를 요청하고 대응 우선순위를 결정하세요.')
  }

  if (item.procurement_risk_level === 'CRITICAL') {
    actions.unshift('대체 조달 전환과 긴급 예산 투입 여부를 즉시 결정하세요.')
  }

  const unique = [...new Set(actions)]
  return unique.length > 0
    ? unique.slice(0, 3)
    : ['구매·생산·재무 담당 부서의 대응 계획과 예상 손실을 보고받고 모니터링 주기를 결정하세요.']
}

function toExecutiveAction(action: string): string {
  if (/발주|납기|수량|입고/.test(action)) {
    return '구매팀의 점검 결과를 근거로 대체 조달 또는 생산계획 조정 여부를 결정하세요.'
  }
  if (/대체 공급|대체 조달/.test(action)) {
    return '대체 공급사 전환 여부와 추가 비용 한도를 결정하세요.'
  }
  if (/계약|재협상|갱신|법무/.test(action)) {
    return '계약 재협상과 법무 검토 착수 여부를 결정하세요.'
  }
  if (/재고|모니터링/.test(action)) {
    return '구매·생산 합동 모니터링 강화와 경영 보고 주기를 지시하세요.'
  }
  return '담당 부서의 실행안과 사업 영향을 보고받고 대응 우선순위를 결정하세요.'
}
