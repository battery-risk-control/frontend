import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import { Skeleton, SkeletonText } from '../../../components/ui/Skeleton/Skeleton'
import { toNewsEventRef } from '../../../lib/newsEventRef'
import { formatCollectedAt } from '../../../lib/formatCollectedAt'
import type { AiBriefingListItem, DashboardAlert, SelectedArticle } from '../../../api/types'
import styles from './DashboardSidePanel.module.css'

/** 접힌 상태에서 벨 호버 미리보기에 보여줄 알림 수 — 기존 `AlertsPanel`과 같은 4로 둔다. */
const PREVIEW_COUNT = 4

const TABS = [
  { id: 'news', label: '뉴스 상세' },
  { id: 'alerts', label: '주요 알림' },
  { id: 'briefings', label: '브리핑' },
] as const

/** 레벨별 표기 색. `정보`는 등급이 아니라 참고 지표라 등급 색(--color-risk-*)을 쓰지 않는다. */
const LEVEL_CLASS: Record<DashboardAlert['level'], string> = {
  심각: styles.levelCritical,
  주의: styles.levelWarning,
  정보: styles.levelInfo,
}

type TabId = (typeof TABS)[number]['id']

interface DashboardSidePanelProps {
  /**
   * "최신 뉴스" 목록이나 위험 지도 마커에서 고른 항목. 아무것도 안 골랐으면 null이고
   * 안내 문구가 나온다. 두 원천이 필드가 달라 `SelectedArticle`로 모아서 받는다.
   */
  selectedNews: SelectedArticle | null
  /** 국가뷰처럼 한 선택에 여러 기사가 묶인 경우 함께 표시한다. */
  selectedNewsItems?: SelectedArticle[]
  /** 이미 `buildDashboardAlerts`로 걸러지고 정렬된 목록 — 이 컴포넌트는 순서를 바꾸지 않는다. */
  alerts: DashboardAlert[]
  briefings: AiBriefingListItem[]
  /**
   * 탭별 로딩. 세 탭의 원천이 달라 각각 다른 시점에 도착하므로 하나로 묶지 않는다 —
   * 묶으면 이미 온 탭까지 가장 느린 응답을 기다린다.
   */
  isNewsLoading?: boolean
  isAlertsLoading?: boolean
  isBriefingsLoading?: boolean
  expanded: boolean
  /**
   * 헤더 알림 벨을 누를 때마다 1씩 오르는 값. 오르면 "주요 알림" 탭으로 옮긴다.
   *
   * boolean이 아니라 카운터인 이유: 이미 알림 탭에 있다가 브리핑 탭으로 옮긴 뒤 벨을 다시
   * 눌러도 알림으로 돌아와야 하는데, boolean은 값이 그대로라 effect가 다시 돌지 않는다.
   * `selectedNews`가 참조 변경으로 같은 일을 하는 것과 같은 방식이다.
   *
   * 0은 "아직 누른 적 없음"이라 첫 렌더에서는 기본 탭(뉴스 상세)을 밀어내지 않는다.
   */
  focusAlertsToken?: number
  isPreviewing: boolean
  onPreviewMouseEnter: () => void
  onPreviewMouseLeave: () => void
  /** 우측 하단 "데이터 업로드" 카드 표시 여부 (기본값: true). 경영기획팀 등 미사용 화면에서 숨긴다. */
  showUploadCard?: boolean
  /**
   * "주요 알림" 탭의 "전체 보기" 링크 목적지. 기본은 구매팀 리스크 모니터링.
   * 경영기획팀처럼 리스크 모니터링 화면이 없는 계층은 자기 화면(예: AI 브리핑)으로 넘긴다.
   */
  alertsMoreTo?: string
  /** 뉴스 상세의 브리핑 액션 버튼 라벨. 기본 "이 기사로 브리핑 생성". */
  newsBriefingLabel?: string
  /** 뉴스 상세 브리핑 버튼 링크(선택 기사 ref 기준). 기본은 구매팀 브리핑 생성 화면. */
  newsBriefingTo?: (briefingRef: string) => string
}

function AlertIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

/**
 * 주요 알림 목록. 뉴스(심각·주의)와 가격 변동성(정보)이 한 목록에 섞이며, 정렬 규칙은
 * `buildDashboardAlerts`가 정한다 — 이 컴포넌트는 받은 순서대로 그린다.
 */
function AlertList({ alerts, limit }: { alerts: DashboardAlert[]; limit?: number }) {
  if (alerts.length === 0) {
    return (
      <p className={styles.empty}>
        표시할 알림이 없습니다. 멀티에이전트 판정이 심각·주의로 나온 뉴스와 변동성이 큰 자재가
        여기에 표시됩니다.
      </p>
    )
  }
  const shown = limit === undefined ? alerts : alerts.slice(0, limit)
  return (
    <ul className={styles.alertList}>
      {shown.map((alert) => (
        <li key={alert.id} className={styles.alertItem}>
          <span className={`${styles.alertIcon} ${LEVEL_CLASS[alert.level]}`}>
            <AlertIcon />
          </span>
          <div className={styles.alertBody}>
            <div className={styles.alertHead}>
              <span className={`${styles.alertLevel} ${LEVEL_CLASS[alert.level]}`}>{alert.level}</span>
              <span className={styles.alertTime}>{alert.timeLabel}</span>
            </div>
            <Link to={alert.href} className={styles.alertTitle}>
              {alert.title}
            </Link>
            <p className={styles.alertDetail}>{alert.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function NewsDetail({
  news,
  briefingLabel,
  briefingTo,
}: {
  news: SelectedArticle | null
  briefingLabel: string
  briefingTo: (briefingRef: string) => string
}) {
  if (!news) {
    return (
      <p className={styles.empty}>
        "최신 뉴스"에서 기사를 고르거나 위험 지도의 마커를 클릭하면 상세가 표시됩니다.
      </p>
    )
  }
  const briefingRef = toNewsEventRef(news)
  return (
    <div className={styles.newsDetail}>
      <span className={styles.detailCaption}>
        {news.origin === 'MAP' ? '지도에서 선택한 이벤트' : '선택 기사'}
      </span>
      <p className={styles.detailHeadline}>{news.headline}</p>
      <p className={styles.detailMeta}>
        {/* 지도에서 온 항목도 2026-08-03부터 수집 시각이 온다(RiskBoardItem.collected_at).
            실데이터 0건 폴백인 placeholder에는 여전히 없어서 있을 때만 붙인다.
            국가는 한글명이 있으면 코드보다 그쪽을 먼저 쓴다. */}
        {[
          news.country_name ?? news.country_code,
          news.material,
          news.collected_at ? formatCollectedAt(news.collected_at) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {/* 영문 원문 자리에 분석이 만든 한국어 요약(summary_kr)을 보여준다 — 원문 헤드라인보다
          내용 파악에 유용하다. 요약이 없으면(예전 뉴스·미분석·지도에서 온 항목) 번역본이 있을
          때만 원문 헤드라인으로 폴백한다. */}
      {news.summary ? (
        <p className={styles.detailOriginal}>{news.summary}</p>
      ) : (
        news.translated && <p className={styles.detailOriginal}>{news.headline_original}</p>
      )}

      <span className={styles.detailCaption}>관련 원자재</span>
      <span className={styles.materialChip}>{news.material}</span>

      <span className={styles.detailCaption}>판정</span>
      <div className={styles.badges}>
        {news.grade && <RiskGradeBadge grade={news.grade} />}
        <ConfidenceBadge label={news.confidence_label} />
      </div>

      <div className={styles.actions}>
        {news.url && (
          <a
            className={styles.primaryAction}
            href={news.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            기사 원문 열기 ↗
          </a>
        )}
        {briefingRef !== null && (
          <Link to={briefingTo(briefingRef)} className={styles.secondaryAction}>
            {briefingLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

function BriefingList({ briefings }: { briefings: AiBriefingListItem[] }) {
  if (briefings.length === 0) {
    return <p className={styles.empty}>저장된 브리핑이 없습니다.</p>
  }
  return (
    <>
      <p className={styles.listNote}>최근 5건이 표시됩니다</p>
      <ul className={styles.list}>
      {briefings.map((briefing) => (
        <li key={briefing.briefing_id} className={styles.item}>
          <div className={styles.badges}>
            <span className={styles.itemMeta}>{briefing.procurement_risk_level}</span>
            {/* `composite`가 false면 KG 게이트에서 조기 종료돼 점수가 항상 0·정상이다 —
                "평가해보니 정상"이 아니라 "평가하지 못했다"라 점수를 보여주면 오독된다. */}
            {briefing.composite ? (
              <span className={styles.itemMeta}>{Math.round(briefing.procurement_risk_score)}점</span>
            ) : (
              <span className={styles.itemMeta}>평가 미완료</span>
            )}
          </div>
          <Link
            to={`/purchasing/ai-briefing?briefing=${encodeURIComponent(briefing.briefing_id)}`}
            className={styles.itemLink}
          >
            {briefing.subject_title ?? briefing.source_ref}
          </Link>
        </li>
      ))}
      </ul>
    </>
  )
}

/**
 * 데이터 업로드 카드. 목업 우측 하단 자리다.
 *
 * **업로드를 여기서 처리하지 않고 데이터 관리 화면으로 보낸다.** 두 종류 모두 파일을 고르는
 * 것으로 끝나지 않고 검사 → 확인 → 반영 3단계를 거치는데, 좁은 사이드 패널에서 그 과정을
 * 보여줄 수 없다. 같은 기능을 두 곳에 두면 갈라지기도 한다.
 *
 * 링크에 `mode`를 실어 보내 <b>누른 항목에 맞는 탭이 열리게</b> 한다. 그냥 화면만 열면 항상
 * ERP 탭이 뜨는데, "계약서 PDF"를 눌러 CSV 업로드 화면이 나오면 잘못 눌렀나 싶어진다.
 */
function UploadCard() {
  return (
    <ScrollCard headingId="data-upload-heading" title="데이터 업로드">
      <div className={styles.uploadBody}>
        <Link to="/purchasing/data-management?mode=RAG" className={styles.uploadItem}>
          <span className={styles.uploadTitle}>계약서 PDF / TXT</span>
          <span className={styles.uploadHint}>데이터 관리 화면에서 등록 →</span>
        </Link>
        {/* 예전에는 "업로드 API 준비 중"이라 비활성이었다. /api/v1/erp/imports의 preview·commit이
            생기면서 데이터 관리 화면이 검사·반영까지 다루므로 이제 보낼 곳이 있다. */}
        <Link to="/purchasing/data-management?mode=ERP" className={styles.uploadItem}>
          <span className={styles.uploadTitle}>ERP CSV</span>
          <span className={styles.uploadHint}>데이터 관리 화면에서 검사 후 반영 →</span>
        </Link>
      </div>
    </ScrollCard>
  )
}

/**
 * 구매팀 대시보드 우측 패널 — 목업의 탭 3개(뉴스 상세 · 알림 · 브리핑) + 데이터 업로드 카드.
 *
 * 기존 `AlertsPanel`을 대체하되 **바깥 계약은 그대로 유지한다**(`expanded`/`isPreviewing`/
 * `onPreviewMouseEnter`/`onPreviewMouseLeave`). 헤더 벨(`AlertsBellButton`)의 토글·호버
 * 미리보기·Escape 닫기 배선이 `PurchasingDashboardPage`에 이미 있어서, 계약을 바꾸면 그 배선을
 * 전부 다시 만들어야 한다. 접힘/펼침 동작과 미리보기 오버레이 방식도 동일하다.
 *
 * 미리보기 오버레이에는 **알림 탭 내용만** 띄운다 — 트리거가 알림 벨이라, 벨을 호버했는데
 * 브리핑 목록이 뜨면 트리거와 결과가 어긋난다.
 *
 * 사용 예:
 *   <DashboardSidePanel selectedNews={selected} alerts={alerts} briefings={briefings}
 *     expanded={expanded} isPreviewing={isPreviewing}
 *     onPreviewMouseEnter={handleEnter} onPreviewMouseLeave={handleLeave} />
 */
export function DashboardSidePanel({
  selectedNews,
  selectedNewsItems,
  alerts,
  briefings,
  isNewsLoading = false,
  isAlertsLoading = false,
  isBriefingsLoading = false,
  expanded,
  focusAlertsToken = 0,
  isPreviewing,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
  showUploadCard = true,
  alertsMoreTo = '/purchasing/risk-monitoring',
  newsBriefingLabel = '이 기사로 브리핑 생성',
  newsBriefingTo = (briefingRef: string) =>
    `/purchasing/ai-briefing?source=NEWS&ref=${encodeURIComponent(briefingRef)}`,
}: DashboardSidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('news')

  /*
   * 부모가 보낸 신호에 맞춰 탭을 옮긴다 — **effect가 아니라 렌더 중에** 직전 값과 비교한다.
   *
   * 두 가지 전환이 있다.
   *   1. 기사를 고르면 "뉴스 상세"로 돌아온다. 브리핑 탭을 보던 중에 "최신 뉴스"나 위험
   *      지도에서 기사를 눌러도 탭이 그대로라 클릭이 먹지 않은 것처럼 보였다.
   *      id가 아니라 객체 참조를 본다 — 부모가 클릭할 때마다 fromNewsFeedItem/
   *      fromRiskBoardItem으로 새 객체를 만들어 넣으므로 같은 기사를 다시 눌러도 탭이
   *      돌아오고, 목록이 주기적으로 갱신돼도 참조는 그대로라 브리핑 탭을 보는 중에
   *      끌려가지 않는다.
   *   2. 헤더 알림 벨을 누르면 "주요 알림"으로 옮긴다. 벨을 눌렀는데 뉴스 상세가 열리면
   *      트리거와 결과가 어긋난다.
   *
   * **알림 검사를 뉴스 검사보다 뒤에 둔다.** 둘이 같은 렌더에서 함께 바뀌면 나중 것이
   * 이기는데, 벨을 누른 의도가 더 최근이다(예전 effect 두 개의 선언 순서와 같은 규칙).
   *
   * effect로 하면 탭이 한 번 잘못 그려진 뒤 다시 그려진다(그리고 react-hooks/
   * set-state-in-effect에 걸린다). 렌더 중 조정은 React가 그 자리에서 다시 렌더해
   * 중간 상태가 화면에 나가지 않는다 — "props가 바뀔 때 state 조정"의 표준 패턴이다.
   */
  const [prevSelectedNews, setPrevSelectedNews] = useState(selectedNews)
  if (selectedNews !== prevSelectedNews) {
    setPrevSelectedNews(selectedNews)
    if (selectedNews) {
      setActiveTab('news')
    }
  }

  const [prevFocusAlertsToken, setPrevFocusAlertsToken] = useState(focusAlertsToken)
  if (focusAlertsToken !== prevFocusAlertsToken) {
    setPrevFocusAlertsToken(focusAlertsToken)
    if (focusAlertsToken > 0) {
      setActiveTab('alerts')
    }
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(scrollRef, expanded)

  const wrapperClassName = [styles.wrapper, !expanded && styles.collapsed, isPreviewing && styles.previewing]
    .filter(Boolean)
    .join(' ')
  const visibleNewsItems = selectedNewsItems?.length
    ? selectedNewsItems
    : selectedNews
      ? [selectedNews]
      : []

  return (
    <aside className={wrapperClassName} aria-labelledby={expanded ? 'side-panel-heading' : undefined}>
      {expanded && (
        <>
          <div ref={scrollRef} className={styles.panel}>
            <h2 id="side-panel-heading" className={styles.srOnly}>
              뉴스 상세 · 알림 · 브리핑
            </h2>
            <div className={styles.tabs} role="tablist" aria-label="우측 패널 탭">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`side-panel-tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls={`side-panel-tabpanel-${tab.id}`}
                  className={activeTab === tab.id ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.id === 'alerts' && alerts.length > 0 && (
                    <span className={styles.tabCount}>{alerts.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`side-panel-tabpanel-${activeTab}`}
              aria-labelledby={`side-panel-tab-${activeTab}`}
              className={styles.tabPanel}
            >
              {activeTab === 'news' &&
                (isNewsLoading && !selectedNews ? (
                  <div className={styles.newsDetail} aria-busy="true">
                    <Skeleton width="7em" />
                    <SkeletonText lines={2} lastLineWidth="65%" />
                    <Skeleton width="45%" />
                  </div>
                ) : (
                  <div className={styles.newsGroup}>
                    {visibleNewsItems.length > 1 && (
                      <p className={styles.newsGroupLabel}>선택 국가 관련 뉴스 {visibleNewsItems.length}건</p>
                    )}
                    {visibleNewsItems.length === 0 ? (
                      <NewsDetail
                        news={null}
                        briefingLabel={newsBriefingLabel}
                        briefingTo={newsBriefingTo}
                      />
                    ) : (
                      visibleNewsItems.map((news) => (
                        <div key={news.id} className={styles.newsGroupItem}>
                          <NewsDetail
                            news={news}
                            briefingLabel={newsBriefingLabel}
                            briefingTo={newsBriefingTo}
                          />
                        </div>
                      ))
                    )}
                  </div>
                ))}
              {activeTab === 'alerts' && (
                <>
                  <div className={styles.panelHead}>
                    <span className={styles.panelTitle}>주요 알림</span>
                    {/* 목업의 "전체 보기". 기본은 등급 필터가 있는 구매팀 리스크 모니터링 화면.
                        리스크 모니터링이 없는 계층(경영기획팀)은 alertsMoreTo로 자기 화면을 넘긴다. */}
                    <Link to={alertsMoreTo} className={styles.panelMore}>
                      전체 보기
                    </Link>
                  </div>
                  {isAlertsLoading ? (
                    <div aria-busy="true">
                      <SkeletonText lines={5} lastLineWidth="50%" />
                    </div>
                  ) : (
                    <AlertList alerts={alerts} />
                  )}
                </>
              )}
              {activeTab === 'briefings' &&
                (isBriefingsLoading ? (
                  <div aria-busy="true">
                    <SkeletonText lines={6} lastLineWidth="40%" />
                  </div>
                ) : (
                  <BriefingList briefings={briefings} />
                ))}
            </div>

            {showUploadCard && (
              <div className={styles.uploadCard}>
                <UploadCard />
              </div>
            )}
          </div>
          {hasOverflowTop && (
            <div className={styles.overflowHintTop} aria-hidden="true">
              <span className={styles.overflowArrow}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              </span>
            </div>
          )}
          {hasOverflowBottom && (
            <div className={styles.overflowHintBottom} aria-hidden="true">
              <span className={styles.overflowArrow}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
          )}
        </>
      )}
      {!expanded && (
        /* 항상 DOM에 두고 opacity/pointer-events로만 켜고 끈다 — 조건부 마운트면 "from" 상태가
           없어 등장/퇴장 transition이 안 먹는다(AlertsPanel과 같은 이유). */
        <div
          className={isPreviewing ? `${styles.previewOverlay} ${styles.previewVisible}` : styles.previewOverlay}
          onMouseEnter={onPreviewMouseEnter}
          onMouseLeave={onPreviewMouseLeave}
          aria-hidden={!isPreviewing}
        >
          <ScrollCard headingId="alerts-preview-heading" title="주요 알림">
            <AlertList alerts={alerts} limit={PREVIEW_COUNT} />
          </ScrollCard>
        </div>
      )}
    </aside>
  )
}
