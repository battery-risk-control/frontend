import { formatAsOf } from '../../../lib/formatAsOf'
import styles from './PurchasingDashboardHeader.module.css'

interface PurchasingDashboardHeaderProps {
  /**
   * 화면 데이터의 **최종 갱신 시각**(ISO-8601 타임스탬프, 예: `2026-07-31T14:00:00Z`). 없으면
   * 칩을 숨긴다.
   *
   * 예전에는 환율 고시일(`exchangeRates.rate_date`, `yyyy-MM-dd`)을 물렸는데, 고시환율은 영업일당
   * 한 번만 공표되는 "일환율"이라 60초마다 새로고침해도 날짜가 종일 그대로였다(출근 즉시 최신
   * 여부를 알 수 없었다). 그래서 원자재 위험 개요의 `summary.as_of`(계산 시점 실제 시각, 서버
   * 60초 캐시)로 바꿔 시각(HH:mm)까지 보여준다. 이 개요 조회는 라이브 리프레시(60초·탭 포커스)에
   * 물려 있어 칩도 함께 움직인다. 조회 API는 DB만 읽어 외부 API를 두드리지 않으므로 새로고침이
   * 잦아도 레이트리밋과 무관하다.
   */
  asOf?: string | null
}

/**
 * 구매팀 대시보드 페이지 헤더 — 목업의 제목줄("구매 위험 관제 대시보드" + 부제 + 기준 시각).
 *
 * 공용 `Header`(브랜드·계정·로그아웃·알림 벨)는 그대로 두고 그 아래에 놓이는 **페이지 단위**
 * 제목줄이다. 목업에는 상단 바가 없고 브랜드가 사이드바에 올라가 있지만, `Header`·`SideNav`는
 * 공개/경영기획/경영진 화면과 공유하는 컴포넌트라 이 화면 하나 때문에 바꾸면 나머지 세 화면이
 * 함께 바뀐다 — 그래서 목업의 제목줄만 페이지 쪽에 따로 만든다.
 *
 * 사용 예:
 *   <PurchasingDashboardHeader asOf={materialAsOf} />
 */
export function PurchasingDashboardHeader({ asOf }: PurchasingDashboardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>구매 위험 관제 대시보드</h1>
        <p className={styles.subtitle}>외부 위험 · ERP · 계약 근거 통합</p>
      </div>
      {asOf && (
        <span className={styles.asOf}>
          {formatAsOf(asOf)} <span className={styles.asOfSuffix}>기준</span>
        </span>
      )}
    </div>
  )
}
