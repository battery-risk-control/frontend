import type {
  SelectedDetail,
} from '../../../components/widgets/GlobalRiskBoard'
import styles from './ExecutiveRiskDetailPanel.module.css'

interface ExecutiveRiskDetailPanelProps {
  selectedDetail: SelectedDetail | null
  onClear: () => void
}

export function ExecutiveRiskDetailPanel({
  selectedDetail,
  onClear,
}: ExecutiveRiskDetailPanelProps) {
  return (
    <aside
      className={styles.panel}
      aria-labelledby="executive-risk-detail-heading"
    >
      <div className={styles.header}>
        <div>
          <h2
            id="executive-risk-detail-heading"
            className={styles.heading}
          >
            위험 상세
          </h2>
        </div>

        {selectedDetail && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="선택한 위험 상세 닫기"
          >
            닫기
          </button>
        )}
      </div>

      {!selectedDetail ? (
        <div className={styles.empty}>
          <span
            className={styles.emptyIcon}
            aria-hidden="true"
          >
            ◎
          </span>

          <strong>
            지도에서 국가를 선택하세요
          </strong>

          <p>
            선택한 국가의 원자재,
            위험 등급과 사건 요약을
            확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.location}>
            <span>선택 지역</span>
            <strong>
              {selectedDetail.label}
            </strong>
          </div>

          <div className={styles.eventList}>
            {selectedDetail.events.map(
              (event) => (
                <article
                  key={event.risk_event_id}
                  className={styles.eventCard}
                >
                  <div
                    className={styles.eventHeader}
                  >
                    <span
                      className={
                        styles[
                          gradeTone(
                            event.grade,
                          )
                        ]
                      }
                    >
                      {event.grade}
                    </span>

                    <small>
                      {event.confidence_label}
                    </small>
                  </div>

                  <h3>{event.material}</h3>

                  <p>
                    {event.event_summary}
                  </p>

                  <dl>
                    <div>
                      <dt>국가</dt>
                      <dd>
                        {event.country_name ??
                          event.country_code ??
                          '추가 확인 필요'}
                      </dd>
                    </div>
                  </dl>

                  {event.source_url && (
                    <a
                      className={styles.primaryAction}
                      href={event.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      기사 원문 열기 ↗
                    </a>
                  )}
                </article>
              ),
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

function gradeTone(
  grade: string,
): 'critical' | 'warning' | 'normal' {
  if (grade === '심각') {
    return 'critical'
  }

  if (grade === '주의') {
    return 'warning'
  }

  return 'normal'
}
