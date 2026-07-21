import { useParams } from 'react-router-dom'
import { fetchRiskEventBriefing } from '../../../api/purchasing.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { SideNav } from '../../../components/layout/SideNav'
import { Breadcrumb } from '../../../components/layout/Breadcrumb'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import styles from './BriefingDetailPage.module.css'

const SIDE_NAV_ITEMS = [
  { label: '리스크 현황판', href: '/purchasing#risk-board' },
  // 별도 목록 화면이 없어 대시보드 내 각 리스크 항목의 "브리핑 보기" 링크로 진입한다.
  // href는 SideNav의 React key 중복을 피하기 위해 /purchasing 뒤에 서로 다른 해시를 붙였다.
  { label: '브리핑 자료', href: '/purchasing#briefing' },
]

/**
 * 1계층 브리핑 자료 열람 (Seq 24 "내부 브리핑 자료 열람 화면").
 * risk_event의 rag_view(계약조항 요약, 협상포인트)와 output_artifacts를 보여준다.
 */
export function BriefingDetailPage() {
  const { riskEventId } = useParams<{ riskEventId: string }>()
  const briefing = riskEventId ? fetchRiskEventBriefing(riskEventId) : null

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.body}>
        <SideNav items={SIDE_NAV_ITEMS} />
        <main id="main-content" className={styles.main}>
          <Breadcrumb items={[{ label: '구매팀 대시보드', href: '/purchasing' }, { label: '브리핑 자료' }]} />
          {briefing ? (
            <>
              <div className={styles.titleRow}>
                <h1 className={styles.heading}>{briefing.material} 브리핑 자료</h1>
                <RiskGradeBadge grade={briefing.grade} />
                <ConfidenceBadge label={briefing.confidence_label} />
              </div>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>계약 조항 요약</h2>
                <p className={styles.summaryText}>{briefing.rag_view.contract_clause_summary}</p>
              </section>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>협상 포인트</h2>
                {briefing.rag_view.negotiation_points.length > 0 ? (
                  <ul className={styles.pointList}>
                    {briefing.rag_view.negotiation_points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.empty}>등록된 협상 포인트가 없습니다.</p>
                )}
              </section>
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>산출물</h2>
                <p className={styles.artifactNote}>
                  렌더 모드: {briefing.output_artifacts.render_mode.toUpperCase()}
                  {briefing.output_artifacts.fallback_to_json &&
                    ' — 데모 단계는 화면 내 JSON 렌더링만 제공하며 실제 파일 다운로드는 범위 밖입니다.'}
                </p>
              </section>
            </>
          ) : (
            <p className={styles.empty}>해당 리스크 이벤트를 찾을 수 없습니다.</p>
          )}
        </main>
      </div>
      <Footer />
    </div>
  )
}
