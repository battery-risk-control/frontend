import { useState, type FormEvent } from 'react'
import styles from './Pagination.module.css'

interface PaginationProps {
  /** 0-indexed 현재 페이지. */
  page: number
  /** 전체 페이지 수(1 이상). 1 이하이면 아무것도 렌더하지 않는다. */
  pageCount: number
  /** 페이지 이동 요청. 항상 0..pageCount-1 범위로 클램프된 0-indexed 값이 전달된다. */
  onChange: (page: number) => void
  /** «/» 버튼이 한 번에 건너뛸 페이지 수. 기본 10. */
  jump?: number
  /** 현재 페이지 좌우로 함께 보여줄 번호 개수. 기본 2. */
  siblingCount?: number
}

/**
 * 현재 페이지(1-indexed) 주변 창 + 처음/끝 + 생략(…)을 계산한다.
 * 반환은 페이지 번호(1-indexed) 또는 'ellipsis' 마커.
 */
function buildItems(current: number, total: number, sibling: number): (number | 'ellipsis')[] {
  const pages = new Set<number>()
  pages.add(1)
  pages.add(total)
  for (let p = current - sibling; p <= current + sibling; p += 1) {
    if (p >= 1 && p <= total) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const items: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) items.push('ellipsis')
    items.push(p)
    prev = p
  }
  return items
}

/**
 * 목록용 페이지네이션. 번호 버튼(생략 … 포함) + 한 칸 이동(‹ ›) + 여러 칸 점프(« »)
 * + 페이지 번호 직접 입력으로 이동한다. 페이지가 1개뿐이면 렌더하지 않는다.
 *
 * `page`/`onChange`는 0-indexed로 주고받되 화면에는 1-indexed로 표시한다 — 다른 목록
 * (뉴스 등)이 이미 0-indexed page 상태를 쓰므로 호출부와 결이 맞는다.
 *
 * 사용 예:
 *   <Pagination page={page} pageCount={pageCount} onChange={setPage} />
 */
export function Pagination({
  page,
  pageCount,
  onChange,
  jump = 10,
  siblingCount = 2,
}: PaginationProps) {
  const [input, setInput] = useState('')

  if (pageCount <= 1) return null

  const current = page + 1
  const items = buildItems(current, pageCount, siblingCount)

  function go(target1Indexed: number) {
    const clamped = Math.min(Math.max(target1Indexed, 1), pageCount)
    onChange(clamped - 1)
  }

  function submitInput(event: FormEvent) {
    event.preventDefault()
    const parsed = Number(input)
    if (Number.isFinite(parsed) && parsed >= 1) {
      go(Math.trunc(parsed))
    }
    setInput('')
  }

  const atFirst = current <= 1
  const atLast = current >= pageCount

  return (
    <nav className={styles.pagination} aria-label="페이지 이동">
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.step}
          onClick={() => go(current - jump)}
          disabled={atFirst}
          aria-label={`${jump}페이지 이전`}
        >
          «
        </button>
        <button
          type="button"
          className={styles.step}
          onClick={() => go(current - 1)}
          disabled={atFirst}
          aria-label="이전 페이지"
        >
          ‹
        </button>

        <ul className={styles.pages}>
          {items.map((item, index) =>
            item === 'ellipsis' ? (
              <li key={`ellipsis-${index}`} className={styles.ellipsis} aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <button
                  type="button"
                  className={item === current ? `${styles.page} ${styles.pageActive}` : styles.page}
                  onClick={() => go(item)}
                  aria-current={item === current ? 'page' : undefined}
                  aria-label={`${item}페이지${item === current ? ' (현재)' : ''}`}
                >
                  {item}
                </button>
              </li>
            ),
          )}
        </ul>

        <button
          type="button"
          className={styles.step}
          onClick={() => go(current + 1)}
          disabled={atLast}
          aria-label="다음 페이지"
        >
          ›
        </button>
        <button
          type="button"
          className={styles.step}
          onClick={() => go(current + jump)}
          disabled={atLast}
          aria-label={`${jump}페이지 다음`}
        >
          »
        </button>
      </div>

      <form className={styles.jumpForm} onSubmit={submitInput}>
        <input
          type="number"
          min={1}
          max={pageCount}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={String(current)}
          aria-label="이동할 페이지 번호"
          className={styles.jumpInput}
        />
        <button type="submit" className={styles.jumpButton}>
          이동
        </button>
        <span className={styles.total}>/ {pageCount}페이지</span>
      </form>
    </nav>
  )
}
