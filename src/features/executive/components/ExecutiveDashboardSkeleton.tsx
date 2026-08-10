import { Skeleton } from '../../../components/ui/Skeleton/Skeleton'
import { LatestNewsPanel } from '../../purchasing/components/LatestNewsPanel'
import { ExecutiveKpiPanelSkeleton } from './ExecutiveKpiPanel'
import { ExecutivePriorityAlertSkeleton } from './ExecutivePriorityAlert'
import pageStyles from '../pages/ExecutiveDashboardPage.module.css'

/** 지도 자리 높이. 실제 GlobalRiskBoard(ExecutiveDashboardPage의 MAP_HEIGHT)와 같아야 세로 점프가 없다. */
const MAP_HEIGHT = 220

/**
 * 경영진 메인 대시보드 로딩 자리표시자. 로딩이 끝나면 뜰 4개 영역(KPI 타일 행 · 우선순위 알림 ·
 * 글로벌 위험 지도 · 최신 뉴스)을 실제와 같은 레이아웃으로 미리 그려, 데이터 도착 시 화면이 튀지
 * 않게 한다. 각 영역은 실제 컴포넌트의 스켈레톤/CSS를 그대로 재사용한다.
 *
 * <p>지도(GlobalRiskBoard)는 무거운 leaflet이고 마커 없는 빈 지도가 "위험 없음"으로 오독되므로
 * 스켈레톤을 넣지 않고, 같은 높이의 블록 자리로 대체한다. 뉴스는 이미 isLoading 스켈레톤을
 * 가진 {@link LatestNewsPanel}을 빈 목록·로딩 상태로 그대로 재사용한다.
 */
export function ExecutiveDashboardSkeleton() {
  return (
    <>
      <ExecutiveKpiPanelSkeleton />
      <ExecutivePriorityAlertSkeleton />

      <section
        className={pageStyles.mapSection}
        aria-busy="true"
        aria-label="글로벌 위험 지도 불러오는 중"
      >
        <Skeleton variant="block" width="100%" height={`${MAP_HEIGHT}px`} />
      </section>

      <LatestNewsPanel
        items={[]}
        isLoading
        onSelect={() => undefined}
        page={0}
        pageSize={5}
        total={0}
        onPageChange={() => undefined}
      />
    </>
  )
}
