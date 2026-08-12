import type { SelectedArticle } from '../../../api/types'
import styles from './ExecutiveEvidencePanel.module.css'

export function ExecutiveNewsDetail({ article }: { article: SelectedArticle }) {
  return (
    <aside className={styles.panel}>
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}>뉴스 상세</span><h2>{article.headline}</h2></div>
      </div>
      <div className={`${styles.content} ${styles.newsContent}`}>
        <h3>관련 정보</h3>
        <dl className={styles.metrics}>
          <div><dt>원자재</dt><dd>{article.material}</dd></div>
          <div><dt>국가</dt><dd>{article.country_name ?? article.country_code ?? '-'}</dd></div>
          <div><dt>위험 등급</dt><dd>{article.grade ?? '-'}</dd></div>
          <div><dt>판정 신뢰도</dt><dd>{article.confidence_label}</dd></div>
        </dl>
        {article.headline_original && article.headline_original !== article.headline && <><h3>원문 제목</h3><p>{article.headline_original}</p></>}
        {article.url && (
          <a
            className={styles.primaryAction}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            기사 원문 열기 ↗
          </a>
        )}
      </div>
    </aside>
  )
}
