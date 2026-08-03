import { useState } from 'react'
import type { ErpImportFileAnalysis, ErpImportPreview } from '../../../api/types'
import styles from './DataImportErpAnalysis.module.css'

interface DataImportErpAnalysisProps {
  preview: ErpImportPreview
}

/**
 * ERP CSV 분석 결과. 위쪽은 파일 전체 요약과 파일별 검증 표, 아래쪽은 고른 파일 한 개의
 * "내용 분석"(실제로 읽힌 행 + 컬럼 매핑 + 걸린 항목)이다.
 *
 * 파일별 표에서 파일을 골라 아래를 바꾼다 — 6개 파일의 매핑 표를 한 화면에 다 펼치면
 * 스크롤만 길어지고 정작 무엇이 문제인지 눈에 안 들어온다. 기본 선택은 **오류가 있는 첫 파일**이다.
 */
export function DataImportErpAnalysis({ preview }: DataImportErpAnalysisProps) {
  const initial = preview.files.find((file) => file.error_count > 0) ?? preview.files[0]
  const [selectedName, setSelectedName] = useState<string | null>(initial?.file_name ?? null)
  const selected = preview.files.find((file) => file.file_name === selectedName) ?? initial

  const successCount = preview.files.filter((file) => file.result === 'SUCCESS').length
  const warningCount = preview.files.filter((file) => file.result === 'WARNING').length
  const errorCount = preview.files.filter((file) => file.result === 'ERROR').length

  return (
    <section className={styles.panel} aria-labelledby="erp-analysis-heading">
      <div className={styles.header}>
        <h2 id="erp-analysis-heading" className={styles.heading}>2. 데이터 검증 결과</h2>
        <p className={styles.headerNote}>DB에는 아직 아무것도 반영되지 않았습니다</p>
      </div>

      <ul className={styles.statRow}>
        <MiniStat label="전체 파일" value={preview.files.length} />
        <MiniStat label="성공" value={successCount} tone="normal" />
        <MiniStat label="경고" value={warningCount} tone="warning" />
        <MiniStat label="오류" value={errorCount} tone="critical" />
      </ul>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>파일별 검증 결과</caption>
          <thead>
            <tr>
              <th scope="col">파일명</th>
              <th scope="col">데이터 유형</th>
              <th scope="col">행 수</th>
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
                className={file.file_name === selected?.file_name ? styles.selectedRow : undefined}
              >
                <td className={styles.fileNameCell}>{file.file_name}</td>
                <td>{file.target_label ?? <span className={styles.unknown}>판별 실패</span>}</td>
                <td>{file.row_count.toLocaleString()}</td>
                <td><ResultBadge result={file.result} /></td>
                <td className={file.error_count > 0 ? styles.critical : undefined}>{file.error_count}</td>
                <td className={file.warning_count > 0 ? styles.warning : undefined}>{file.warning_count}</td>
                <td>{file.duplicate_count}</td>
                <td>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => setSelectedName(file.file_name)}
                  >
                    상세 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <FileDetail file={selected} />}
    </section>
  )
}

/** 파일 한 개의 내용 분석. 읽힌 행 → 컬럼 매핑 → 걸린 항목 순으로 본다. */
function FileDetail({ file }: { file: ErpImportFileAnalysis }) {
  const headers = file.sample_rows.length > 0 ? Object.keys(file.sample_rows[0]) : []
  return (
    <div className={styles.detail}>
      <h3 className={styles.detailHeading}>
        3. 내용 분석 및 매핑 · {file.file_name}
        {file.target_label && <span className={styles.detailTarget}>→ {file.target_label}</span>}
      </h3>

      {headers.length > 0 ? (
        <>
          <p className={styles.detailNote}>
            실제로 읽힌 값 {file.sample_rows.length}행 (전체 {file.row_count.toLocaleString()}행 중 앞부분)
          </p>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>{file.file_name} 미리보기</caption>
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={header} scope="col">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {file.sample_rows.map((row, index) => (
                  <tr key={index}>
                    {headers.map((header) => (
                      <td key={header} className={styles.sampleCell}>{row[header] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className={styles.detailNote}>읽어 들인 데이터 행이 없습니다.</p>
      )}

      {file.columns.length > 0 && (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>{file.file_name} 컬럼 매핑</caption>
            <thead>
              <tr>
                <th scope="col">업로드 컬럼</th>
                <th scope="col">대상 필드</th>
                <th scope="col">설명</th>
                <th scope="col">샘플</th>
                <th scope="col">필수</th>
                <th scope="col">매핑 상태</th>
              </tr>
            </thead>
            <tbody>
              {file.columns.map((column) => (
                <tr key={column.source_column}>
                  <td className={styles.fileNameCell}>{column.source_column}</td>
                  <td>{column.target_field ?? '—'}</td>
                  <td className={styles.muted}>{column.description}</td>
                  <td className={styles.muted}>{column.sample ?? '—'}</td>
                  <td>{column.required ? <span className={styles.requiredTag}>필수</span> : '—'}</td>
                  <td><MappingBadge status={column.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {file.issues.length > 0 && (
        <>
          <h4 className={styles.issueHeading}>확인이 필요한 항목</h4>
          <ul className={styles.issueList}>
            {file.issues.map((issue, index) => (
              <li key={index} className={styles.issue}>
                <span className={styles[`issue${issue.level}`]}>
                  {issue.level === 'ERROR' ? '오류' : issue.level === 'DUPLICATE' ? '중복' : '경고'}
                </span>
                {issue.row_number != null && <span className={styles.issueRow}>{issue.row_number}행</span>}
                {issue.column && <span className={styles.issueColumn}>{issue.column}</span>}
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'normal' | 'warning' | 'critical'
}) {
  // 0건일 때는 색을 빼서 "빨간 0"처럼 읽히지 않게 한다.
  const toneClass = tone && value > 0 ? styles[tone] : undefined
  return (
    <li className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${toneClass ?? ''}`}>{value}</span>
    </li>
  )
}

function ResultBadge({ result }: { result: ErpImportFileAnalysis['result'] }) {
  const label = result === 'SUCCESS' ? '성공' : result === 'WARNING' ? '경고' : '오류'
  return <span className={styles[`badge${result}`]}>{label}</span>
}

function MappingBadge({ status }: { status: ErpImportFileAnalysis['columns'][number]['status'] }) {
  const label = status === 'MAPPED' ? '매핑됨' : status === 'IGNORED' ? '무시됨' : '누락'
  return <span className={styles[`mapping${status}`]}>{label}</span>
}
