import type { AiBriefingDetail } from '../../../api/types'
import styles from './ExecutiveEvidencePanel.module.css'

export type EvidenceTab = 'summary' | 'erp' | 'contract' | 'verification'

interface Props {
  item: AiBriefingDetail | null
  tab?: EvidenceTab
  onTabChange?: (tab: EvidenceTab) => void
}

export function ExecutiveEvidencePanel({ item, tab = 'summary', onTabChange }: Props) {
  if (!item) {
    return (
      <aside className={styles.panel}>
        <h2>상세 근거</h2>
        <div className={styles.empty}>위험 사건이나 검증 항목을 선택하면 ERP·계약·AI 검증 근거가 표시됩니다.</div>
      </aside>
    )
  }

  const tabs: Array<[EvidenceTab, string]> = [
    ['summary', '요약'],
    ['erp', 'ERP 근거'],
    ['contract', '계약 RAG'],
    ['verification', 'AI 검증'],
  ]

  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>의사결정 근거</span>
          <h2>{item.subject_title ?? item.source_headline ?? item.material_name ?? '공급망 위험'}</h2>
        </div>
        <strong className={styles[item.procurement_risk_level.toLowerCase()] ?? styles.normal}>
          {item.procurement_risk_level} {item.procurement_risk_score.toFixed(0)}점
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
          <h3>경영 요약</h3>
          <p>{item.briefing ?? '생성된 브리핑이 없습니다.'}</p>
          <h3>권고 조치</h3>
          <ul>{item.recommended_actions.map((action) => <li key={action}>{action}</li>)}</ul>
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
            <article className={styles.finding} key={`${index}-${String(finding.contract_id ?? '')}`}>
              <strong>계약 {String(finding.contract_id ?? '-')} · {String(finding.page ?? '-')}페이지</strong>
              <span>{String(finding.clause_name_kr ?? finding.clause_type ?? '관련 조항')}</span>
              <p>{String(finding.evidence_text ?? finding.content ?? finding.text ?? '검색된 계약 근거')}</p>
            </article>
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

function format(value: number | null, suffix: string) {
  return value == null ? '-' : `${value.toFixed(1)}${suffix}`
}
