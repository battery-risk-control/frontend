import { useMemo, useState } from 'react'
import type { ErpImportFileAnalysis, ErpImportIssue, ErpImportPreview } from '../../../api/types'
import styles from './DataImportErpAnalysis.module.css'

/** 이슈 한 건 + 어느 파일에서 나왔는지. 백엔드 응답은 파일별로 나뉘어 있어 여기서 합친다. */
interface MergedIssue extends ErpImportIssue {
  fileName: string
}

type LevelFilter = 'ALL' | 'ERROR' | 'WARNING' | 'DUPLICATE'

/** 한 쪽에 보여줄 이슈 수. 수백 건을 한 번에 그리면 스크롤만 길어지고 아무것도 눈에 안 들어온다. */
const PAGE_SIZE = 20

interface DataImportErpAnalysisProps {
  preview: ErpImportPreview
  /** 스키마 매핑 표가 볼 파일. 표에서 "상세 보기"를 누르면 바뀐다. */
  selectedFileName: string | null
  onSelectFile: (fileName: string) => void
}

/**
 * 2단계 "데이터 품질검사 결과". 위에서 아래로 <b>전체 요약 → 파일별 판정 → 개별 지적사항</b> 순이다.
 *
 * 지적사항은 파일별로 나눠 보여주지 않고 <b>전부 합쳐서</b> 필터·검색·페이지로 다룬다. 파일이
 * 6개면 표를 6번 펼쳐 봐야 하는데, 정작 사용자가 하려는 건 "오류부터 순서대로 고치기"이기
 * 때문이다. 파일별로 좁혀 보고 싶으면 표의 "상세 보기"가 그 파일로 필터를 걸어준다.
 *
 * 이 화면의 모든 수치는 서버 응답을 그대로 쓴다 — 화면에서 다시 세면 보고서 PDF와 값이
 * 어긋나고, 그때 어느 쪽이 맞는지 판단할 근거가 없어진다.
 */
export function DataImportErpAnalysis({
  preview,
  selectedFileName,
  onSelectFile,
}: DataImportErpAnalysisProps) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const successFiles = preview.files.filter((file) => file.result === 'SUCCESS').length
  const warningFiles = preview.files.filter((file) => file.result === 'WARNING').length
  const errorFiles = preview.files.filter((file) => file.result === 'ERROR').length

  const merged = useMemo<MergedIssue[]>(
    () => preview.files.flatMap((file) =>
      file.issues.map((issue) => ({ ...issue, fileName: file.file_name }))),
    [preview],
  )

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return merged.filter((issue) => {
      if (levelFilter !== 'ALL' && issue.level !== levelFilter) return false
      if (keyword && !issue.fileName.toLowerCase().includes(keyword)) return false
      return true
    })
  }, [merged, levelFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  // 필터를 좁혀 결과가 줄면 현재 쪽이 범위를 벗어날 수 있다. 그때는 마지막 쪽을 보여준다.
  const safePage = Math.min(page, pageCount - 1)
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function applyFilter(next: LevelFilter) {
    setLevelFilter(next)
    setPage(0)
  }

  function applySearch(next: string) {
    setSearch(next)
    setPage(0)
  }

  return (
    <section className={styles.panel} aria-labelledby="erp-analysis-heading">
      <div className={styles.header}>
        <h2 id="erp-analysis-heading" className={styles.heading}>2. 데이터 품질검사 결과</h2>
        <p className={styles.headerNote}>DB에는 아직 아무것도 반영되지 않았습니다</p>
      </div>

      <ul className={styles.statRow}>
        <MiniStat label="전체 파일" value={preview.files.length} />
        <MiniStat label="전체 행" value={preview.total_rows} />
        <MiniStat label="성공" value={successFiles} tone="normal" />
        <MiniStat label="경고" value={warningFiles} tone="warning" />
        <MiniStat label="오류" value={errorFiles} tone="critical" />
      </ul>

      <ul className={styles.statRow}>
        <MiniStat label="오류 건수" value={preview.total_errors} tone="critical" />
        <MiniStat label="경고 건수" value={preview.total_warnings} tone="warning" />
        <MiniStat label="중복 건수" value={preview.total_duplicates} />
        <MiniStat label="품질점수" value={preview.quality_score} suffix="/100" />
        <li className={styles.statCard}>
          <span className={styles.statLabel}>DB 반영 가능 여부</span>
          <span className={preview.committable ? styles.committableYes : styles.committableNo}>
            {preview.committable ? '반영 가능' : '반영 불가'}
          </span>
        </li>
      </ul>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>파일별 검증 결과</caption>
          <thead>
            <tr>
              <th scope="col">파일명</th>
              <th scope="col">대상 ERP 테이블</th>
              <th scope="col">데이터 유형</th>
              <th scope="col">크기</th>
              <th scope="col">행 수</th>
              <th scope="col">컬럼 수</th>
              <th scope="col">검증 결과</th>
              <th scope="col">오류</th>
              <th scope="col">경고</th>
              <th scope="col">중복</th>
              <th scope="col">작업</th>
            </tr>
          </thead>
          <tbody>
            {preview.files.map((file) => (
              <tr
                key={file.file_name}
                className={file.file_name === selectedFileName ? styles.selectedRow : undefined}
              >
                <td className={styles.fileNameCell}>{file.file_name}</td>
                <td className={styles.muted}>
                  {file.target_table ?? <span className={styles.unknown}>판별 실패</span>}
                </td>
                <td>{file.target_label ?? <span className={styles.unknown}>판별 실패</span>}</td>
                <td className={styles.muted}>{formatBytes(file.size_bytes)}</td>
                <td>{file.row_count.toLocaleString()}</td>
                <td className={styles.muted}>{file.column_count}</td>
                <td><ResultBadge result={file.result} /></td>
                <td className={file.error_count > 0 ? styles.critical : undefined}>{file.error_count}</td>
                <td className={file.warning_count > 0 ? styles.warning : undefined}>{file.warning_count}</td>
                <td>{file.duplicate_count}</td>
                <td>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => {
                      onSelectFile(file.file_name)
                      // 이 파일의 지적사항만 남긴다 — "상세 보기"가 아래 목록까지 좁혀주지 않으면
                      // 사용자가 직접 파일명을 다시 입력해야 한다.
                      applySearch(file.file_name)
                    }}
                  >
                    상세 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.detail}>
        <div className={styles.detailHeader}>
          <h3 className={styles.detailHeading}>
            지적사항 {filtered.length.toLocaleString()}건
            {filtered.length !== merged.length && (
              <span className={styles.detailTarget}>전체 {merged.length.toLocaleString()}건 중</span>
            )}
          </h3>
          <div className={styles.filterRow}>
            {(['ALL', 'ERROR', 'WARNING', 'DUPLICATE'] as const).map((level) => (
              <button
                key={level}
                type="button"
                aria-pressed={levelFilter === level}
                className={levelFilter === level ? styles.filterActive : styles.filter}
                onClick={() => applyFilter(level)}
              >
                {LEVEL_LABELS[level]}
              </button>
            ))}
            <input
              type="search"
              className={styles.search}
              placeholder="파일명 검색"
              value={search}
              onChange={(event) => applySearch(event.target.value)}
              aria-label="파일명으로 지적사항 검색"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className={styles.detailNote}>
            {merged.length === 0
              ? '지적된 항목이 없습니다. 그대로 반영할 수 있습니다.'
              : '조건에 맞는 항목이 없습니다.'}
          </p>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>지적사항 목록</caption>
                <thead>
                  <tr>
                    <th scope="col">수준</th>
                    <th scope="col">파일명</th>
                    <th scope="col">행 번호</th>
                    <th scope="col">컬럼</th>
                    <th scope="col">내용</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((issue, index) => (
                    <tr key={`${issue.fileName}-${issue.row_number}-${issue.column}-${index}`}>
                      <td><LevelBadge level={issue.level} /></td>
                      <td className={styles.muted}>{issue.fileName}</td>
                      <td>{issue.row_number ?? '—'}</td>
                      <td className={styles.fileNameCell}>{issue.column ?? '—'}</td>
                      <td>{issue.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 && (
              <div className={styles.pager}>
                <button
                  type="button"
                  className={styles.pagerButton}
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 0}
                >
                  이전
                </button>
                <span className={styles.pagerLabel}>{safePage + 1} / {pageCount}</span>
                <button
                  type="button"
                  className={styles.pagerButton}
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= pageCount - 1}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

const LEVEL_LABELS: Record<LevelFilter, string> = {
  ALL: '전체',
  ERROR: '오류',
  WARNING: '경고',
  DUPLICATE: '중복',
}

function MiniStat({
  label,
  value,
  tone,
  suffix,
}: {
  label: string
  value: number
  tone?: 'normal' | 'warning' | 'critical'
  suffix?: string
}) {
  // 0건일 때는 색을 빼서 "빨간 0"처럼 읽히지 않게 한다.
  const toneClass = tone && value > 0 ? styles[tone] : undefined
  return (
    <li className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${toneClass ?? ''}`}>
        {value.toLocaleString()}
        {suffix && <span className={styles.statSuffix}>{suffix}</span>}
      </span>
    </li>
  )
}

function ResultBadge({ result }: { result: ErpImportFileAnalysis['result'] }) {
  const label = result === 'SUCCESS' ? '성공' : result === 'WARNING' ? '경고' : '오류'
  return <span className={styles[`badge${result}`]}>{label}</span>
}

function LevelBadge({ level }: { level: ErpImportIssue['level'] }) {
  const label = level === 'ERROR' ? '오류' : level === 'DUPLICATE' ? '중복' : '경고'
  return <span className={styles[`issue${level}`]}>{label}</span>
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
