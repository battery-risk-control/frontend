import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfidenceBadge } from '../../../components/ui/ConfidenceBadge'
import { RiskGradeBadge } from '../../../components/ui/RiskGradeBadge'
import { ScrollCard } from '../../../components/ui/ScrollCard/ScrollCard'
import { useScrollOverflowHint } from '../../../lib/useScrollOverflowHint'
import { toNewsEventRef } from '../../../lib/newsEventRef'
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
  /** 이미 `buildDashboardAlerts`로 걸러지고 정렬된 목록 — 이 컴포넌트는 순서를 바꾸지 않는다. */
  alerts: DashboardAlert[]
  briefings: AiBriefingListItem[]
  expanded: boolean
  isPreviewing: boolean
  onPreviewMouseEnter: () => void
  onPreviewMouseLeave: () => void
}

/** `2026-08-01T08:40:38Z` → `08-01 17:40`(현지). 목록에 초까지 보일 이유가 없다. */
function formatCollectedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function NewsDetail({ news }: { news: SelectedArticle | null }) {
  if (!news) {
    return (
      <p className={styles.empty}>
        "최신 뉴스"에서 기사를 고르거나 위험 지도의 마커를 클릭하면 상세가 표시됩니다.
      </p>
    )
  }
  const briefingRef = toNewsEventRef(news.id)
  return (
    <div className={styles.newsDetail}>
      <span className={styles.detailCaption}>
        {news.origin === 'MAP' ? '지도에서 선택한 이벤트' : '선택 기사'}
      </span>
      <p className={styles.detailHeadline}>{news.headline}</p>
      <p className={styles.detailMeta}>
        {/* 지도에서 온 항목에는 수집 시각이 없다(공개 지도 응답에 없는 필드) — 지어내지 않고 뺀다.
            대신 국가 한글명이 있어 코드보다 그쪽을 먼저 쓴다. */}
        {[
          news.country_name ?? news.country_code,
          news.material,
          news.collected_at ? formatCollectedAt(news.collected_at) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {/* 번역본이 떠 있을 때만 원문을 함께 보여준다. 번역이 없으면 headline이 곧 원문이라
          같은 문장을 두 번 쓰게 된다. */}
      {news.translated && <p className={styles.detailOriginal}>{news.headline_original}</p>}

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
        {briefingRef === null ? (
          /* 이 기사의 `risk_event_id`가 분석 UUID라 브리핑이 받는 숫자 ref를 되찾을 수 없다
             (`toNewsEventRef` 주석 참고). 눌러도 400이 나는 버튼을 두느니 이벤트를 고를 수 있는
             화면으로 보낸다. */
          <Link to="/purchasing/risk-monitoring" className={styles.secondaryAction}>
            리스크 모니터링에서 브리핑 생성
          </Link>
        ) : (
          <Link
            to={`/purchasing/ai-briefing?source=NEWS&ref=${briefingRef}`}
            className={styles.secondaryAction}
          >
            이 기사로 브리핑 생성
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
  )
}

/**
 * 데이터 업로드 카드. 목업 우측 하단 자리다.
 *
 * **업로드를 여기서 처리하지 않고 기존 화면으로 보낸다.** 계약서는 계약·RAG 화면이 이미
 * 업로드·재처리·인덱싱 상태까지 다루고 있어 같은 기능을 두 곳에 두면 갈라진다. ERP CSV는
 * 백엔드에 업로드 엔드포인트 자체가 없어(`contract-rag` 쪽만 있다) 파일 선택창을 띄우면
 * 고를 수는 있는데 보낼 곳이 없는 상태가 된다.
 */
function UploadCard() {
  return (
    <ScrollCard headingId="data-upload-heading" title="데이터 업로드">
      <div className={styles.uploadBody}>
        <Link to="/purchasing/contract-rag" className={styles.uploadItem}>
          <span className={styles.uploadTitle}>계약서 PDF / TXT</span>
          <span className={styles.uploadHint}>계약 · RAG 화면에서 업로드 →</span>
        </Link>
        <div className={`${styles.uploadItem} ${styles.uploadDisabled}`}>
          <span className={styles.uploadTitle}>ERP CSV</span>
          <span className={styles.uploadHint}>업로드 API 준비 중 — 현재는 DB 적재로 반영됩니다</span>
        </div>
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
  alerts,
  briefings,
  expanded,
  isPreviewing,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
}: DashboardSidePanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('news')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { hasOverflowTop, hasOverflowBottom } = useScrollOverflowHint(scrollRef, expanded)

  const wrapperClassName = [styles.wrapper, !expanded && styles.collapsed, isPreviewing && styles.previewing]
    .filter(Boolean)
    .join(' ')

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
              {activeTab === 'news' && <NewsDetail news={selectedNews} />}
              {activeTab === 'alerts' && (
                <>
                  <div className={styles.panelHead}>
                    <span className={styles.panelTitle}>주요 알림</span>
                    {/* 목업의 "전체 보기". 이 목록은 심각·주의만 추린 것이라, 전체는 등급 필터가
                        있는 리스크 모니터링 화면에서 본다. */}
                    <Link to="/purchasing/risk-monitoring" className={styles.panelMore}>
                      전체 보기
                    </Link>
                  </div>
                  <AlertList alerts={alerts} />
                </>
              )}
              {activeTab === 'briefings' && <BriefingList briefings={briefings} />}
            </div>

            <UploadCard />
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
