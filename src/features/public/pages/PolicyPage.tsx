import { Link, useLocation } from 'react-router-dom'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import styles from './PolicyPage.module.css'

const CONTENT = {
  '/privacy': { title: '개인정보처리방침', body: '본 서비스는 로그인과 권한 확인에 필요한 계정 정보만 처리하며, API 키와 인증 정보는 화면에 노출하지 않습니다. 프로젝트 데모 데이터는 실제 개인정보가 아닌 테스트 데이터로 구성됩니다.' },
  '/terms': { title: '이용약관', body: '본 서비스의 위험 점수와 AI 브리핑은 구매·경영 의사결정을 지원하는 참고 정보입니다. 최종 계약·구매·공급사 전환 결정은 담당자의 검토와 승인을 거쳐야 합니다.' },
  '/sources': { title: '데이터 출처', body: '외부 위험 신호는 GDELT·GDACS, 환율은 ExchangeRate-API, 내부 판단 근거는 ERP 적재 데이터·계약 문서 RAG·멀티에이전트 분석 결과를 사용합니다.' },
} as const

export function PolicyPage() {
  const location = useLocation()
  const content = CONTENT[location.pathname as keyof typeof CONTENT] ?? CONTENT['/privacy']
  return <div className={styles.page}>
    <Header />
    <main className={styles.main}>
      <Link to="/" className={styles.back}>← 대시보드로 돌아가기</Link>
      <article><h1>{content.title}</h1><p>{content.body}</p><p className={styles.date}>시행일: 2026년 8월 5일</p></article>
    </main>
    <Footer />
  </div>
}
