import { Link, useParams } from 'react-router-dom'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { SideNavToggleButton } from '../../../components/layout/SideNavToggleButton'
import { Breadcrumb } from '../../../components/layout/Breadcrumb'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { QueryState } from '../components/QueryState'
import { useAiBriefingDetail } from '../hooks/usePlanningQueries'
import { PLANNING_SIDE_NAV_ITEMS } from '../../../lib/planningNav'
import styles from './AiBriefingDetailPage.module.css'

/**
 * 2계층 AI 브리핑 드릴다운(`/planning/briefing/:analysisId`). 1계층 BriefingDetailPage와
 * 동일 골격 — 목록 캐시 재활용이 아니라 백엔드 `procurement_risk_assessments` 단건 상세를
 * 새로 조회한다(LLM 브리핑 본문·근거·경고까지 포함, 목록 탭엔 없던 필드).
 */
export function AiBriefingDetailPage() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const query = useAiBriefingDetail(analysisId ?? '')

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNavToggleButton />
        <SideNav items={PLANNING_SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <Breadcrumb items={[{ label: '경영기획팀 대시보드', href: '/planning' }, { label: 'AI 브리핑 상세' }]} />
          <Link to="/planning/briefings" className={styles.backLink}>
            ← 브리핑 목록으로
          </Link>
          <QueryState query={query}>
            {(detail) => (
              <>
                <div className={styles.titleRow}>
                  <h1 className={styles.heading}>{detail.material} 브리핑 상세</h1>
                  <RiskGradeBadge grade={detail.grade} />
                  {detail.business_unit && <span className={styles.unit}>{detail.business_unit}</span>}
                  {/* 원문 링크는 제목 줄 우측 끝에 둔다(.sourceButton margin-left:auto). */}
                  {detail.source_url && (
                    <a
                      className={styles.sourceButton}
                      href={detail.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      뉴스 원문 보기 ↗
                    </a>
                  )}
                </div>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>뉴스 요약</h2>
                  {/*
                    경영기획 대시보드 전용 상세 요약(briefing_summary_kr)을 우선 보여준다.
                    아직 생성 전이면 짧은 추출 요약(summary_kr) → 이벤트 본문 순으로 폴백한다.
                  */}
                  <p className={styles.bodyText}>
                    {detail.briefing_summary_kr ?? detail.summary_kr ?? detail.event_content}
                  </p>
                </section>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>AI 브리핑</h2>
                  {detail.briefing ? (
                    <p className={styles.bodyText}>{detail.briefing}</p>
                  ) : (
                    <p className={styles.empty}>아직 생성된 브리핑이 없습니다.</p>
                  )}
                </section>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>권고 조치</h2>
                  {detail.recommended_actions && detail.recommended_actions.length > 0 ? (
                    <ul className={styles.pointList}>
                      {detail.recommended_actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.empty}>등록된 권고 조치가 없습니다.</p>
                  )}
                </section>
                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>계약 근거</h2>
                  {detail.contract_findings && detail.contract_findings.length > 0 ? (
                    <ul className={styles.findingList}>
                      {detail.contract_findings.map((finding, index) => (
                        <li key={index} className={styles.findingCard}>
                          <div className={styles.findingHeader}>
                            <span className={styles.findingClause}>{finding.clause_name_kr ?? '조항'}</span>
                            {typeof finding.similarity_score === 'number' && (
                              <span className={styles.findingScore}>
                                유사도 {Math.round(finding.similarity_score * 100)}%
                              </span>
                            )}
                          </div>
                          <p className={styles.findingText}>{finding.evidence_text ?? JSON.stringify(finding)}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.empty}>연결된 계약 근거가 없습니다.</p>
                  )}
                </section>
                {detail.warnings && detail.warnings.length > 0 && (
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>경고</h2>
                    <ul className={styles.pointList}>
                      {detail.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </QueryState>
        </main>
      </div>
      <Footer />
    </div>
  )
}
