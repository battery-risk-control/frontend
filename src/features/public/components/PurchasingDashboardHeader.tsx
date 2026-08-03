import styles from './PurchasingDashboardHeader.module.css'

interface PurchasingDashboardHeaderProps {
  /**
   * 화면 데이터의 기준일(`yyyy-MM-dd`). 없으면 날짜 칩을 숨긴다.
   *
   * 목업의 "2026.07.31 ▾" 자리다. **드롭다운(날짜 선택)이 아니라 표시 전용이다** — 이 화면이
   * 쓰는 공개 API 6종 중 조회 기준일을 받는 것이 하나도 없어서, 고를 수 있게 만들면 날짜만
   * 바뀌고 숫자는 그대로인 화면이 된다(`materialPricePeriods`의 "사용자 설정" 탭을 비활성으로
   * 둔 것과 같은 판단). 날짜 필터가 실제로 필요해지면 백엔드 파라미터부터 늘려야 한다.
   */
  asOfDate?: string | null
}

/** `2026-07-31` → `2026.07.31`. 목업 표기를 따른다. */
function formatAsOf(date: string): string {
  return date.replaceAll('-', '.')
}

/**
 * 구매팀 대시보드 페이지 헤더 — 목업의 제목줄("구매 위험 관제 대시보드" + 부제 + 기준일).
 *
 * 공용 `Header`(브랜드·계정·로그아웃·알림 벨)는 그대로 두고 그 아래에 놓이는 **페이지 단위**
 * 제목줄이다. 목업에는 상단 바가 없고 브랜드가 사이드바에 올라가 있지만, `Header`·`SideNav`는
 * 공개/경영기획/경영진 화면과 공유하는 컴포넌트라 이 화면 하나 때문에 바꾸면 나머지 세 화면이
 * 함께 바뀐다 — 그래서 목업의 제목줄만 페이지 쪽에 따로 만든다.
 *
 * 사용 예:
 *   <PurchasingDashboardHeader asOfDate={exchangeRates.rate_date} />
 */
export function PurchasingDashboardHeader({ asOfDate }: PurchasingDashboardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>구매 위험 관제 대시보드</h1>
        <p className={styles.subtitle}>외부 위험 · ERP · 계약 근거 통합</p>
      </div>
      {asOfDate && (
        <span className={styles.asOf}>
          {formatAsOf(asOfDate)} <span className={styles.asOfSuffix}>기준</span>
        </span>
      )}
    </div>
  )
}
