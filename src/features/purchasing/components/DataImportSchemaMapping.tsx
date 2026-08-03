import type { ErpImportFileAnalysis } from '../../../api/types'
import styles from './DataImportSchemaMapping.module.css'

interface DataImportSchemaMappingProps {
  /** 검증 결과 표에서 고른 파일. 없으면 패널을 그리지 않는다. */
  file: ErpImportFileAnalysis | null
}

/**
 * 3단계 "스키마 자동 매핑 결과". 업로드 파일의 컬럼이 시스템 필드 어디로 들어가는지 보여준다.
 *
 * <b>조회 전용이다.</b> 사용자가 대상 필드를 바꿀 수 없다 — 매핑을 고치려면 그 매핑으로 다시
 * 검증해야 하는데(타입·FK가 필드마다 다르다), 그 재검증 경로가 아직 없다. 바꿀 수 있게 해놓고
 * 검증을 안 하면 화면에서는 맞아 보이는데 반영 단계에서 터진다.
 *
 * 무시되는 컬럼(IGNORED)을 굳이 드러내는 이유는, 조용히 버리면 사용자가 그 값도 반영됐다고
 * 믿기 때문이다. 파일에 값이 들어 있는데 DB에는 없는 상태를 나중에 알아채기는 매우 어렵다.
 */
export function DataImportSchemaMapping({ file }: DataImportSchemaMappingProps) {
  if (!file) return null

  const mapped = file.columns.filter((column) => column.status === 'MAPPED').length
  const missing = file.columns.filter((column) => column.status === 'MISSING').length
  const ignored = file.columns.filter((column) => column.status === 'IGNORED').length

  return (
    <section className={styles.panel} aria-labelledby="schema-mapping-heading">
      <div className={styles.header}>
        <h2 id="schema-mapping-heading" className={styles.heading}>
          3. 스키마 자동 매핑 결과
          <span className={styles.target}>{file.file_name}</span>
        </h2>
        <p className={styles.headerNote}>
          매핑 {mapped} · 무시 {ignored}
          {missing > 0 && <span className={styles.missingCount}> · 누락 {missing}</span>}
        </p>
      </div>

      {missing > 0 && (
        <p className={styles.missingNote}>
          필수 컬럼이 {missing}개 빠져 있습니다. 파일에 컬럼을 추가한 뒤 다시 검사해 주세요.
        </p>
      )}

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>{file.file_name} 스키마 매핑</caption>
          <thead>
            <tr>
              <th scope="col">원본 파일 컬럼</th>
              <th scope="col">대상 시스템 필드</th>
              <th scope="col">필드 설명</th>
              <th scope="col">샘플 값</th>
              <th scope="col">필수 여부</th>
              <th scope="col">매핑 상태</th>
            </tr>
          </thead>
          <tbody>
            {file.columns.map((column) => (
              <tr key={column.source_column}>
                <td className={styles.sourceCell}>{column.source_column}</td>
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

      {file.sample_rows.length > 0 && (
        <details className={styles.sample}>
          <summary className={styles.sampleSummary}>
            실제로 읽힌 값 {file.sample_rows.length}행 보기
            (전체 {file.row_count.toLocaleString()}행 중 앞부분)
          </summary>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <caption className={styles.srOnly}>{file.file_name} 미리보기</caption>
              <thead>
                <tr>
                  {Object.keys(file.sample_rows[0]).map((header) => (
                    <th key={header} scope="col">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {file.sample_rows.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(file.sample_rows[0]).map((header) => (
                      <td key={header} className={styles.sampleCell}>{row[header] || '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  )
}

function MappingBadge({ status }: { status: ErpImportFileAnalysis['columns'][number]['status'] }) {
  const label = status === 'MAPPED' ? '매핑됨' : status === 'IGNORED' ? '무시됨' : '누락'
  return <span className={styles[`mapping${status}`]}>{label}</span>
}
