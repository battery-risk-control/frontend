import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import styles from './QueryState.module.css'

interface QueryStateProps<T> {
  query: UseQueryResult<T>
  children: (data: T) => ReactNode
}

/**
 * 2계층 7탭+드릴다운 공용 로딩/에러 래퍼. isPending이면 스켈레톤 블록, isError면 안내 텍스트,
 * 성공 시 children(data) 렌더 — 각 페이지는 기존 JSX를 이 컴포넌트의 자식으로 한 단 들여쓰기만 하면 된다.
 */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <div className={styles.skeleton} role="status" aria-label="데이터를 불러오는 중">
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
      </div>
    )
  }

  if (query.isError) {
    return <p className={styles.errorText}>데이터를 불러오지 못했습니다.</p>
  }

  return <>{children(query.data as T)}</>
}
