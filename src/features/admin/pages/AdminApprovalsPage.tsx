import { useEffect, useState } from 'react'
import {
  approveUser,
  fetchUsers,
  rejectUser,
  reopenUser,
  type AdminUser,
  type AdminUserStatus,
} from '../../../api/auth.api'
import { Header } from '../../../components/layout/Header'
import { Footer } from '../../../components/layout/Footer'
import { useAuthState } from '../../../lib/useAuthState'
import { TIER_LABEL } from '../../../lib/tierLabels'
import type { OrgTier } from '../../../api/types'
import styles from './AdminApprovalsPage.module.css'

/** 승인 완료 탭에서 계층별로 묶어 보여줄 순서(관리자 제외 3계층). */
const TIER_ORDER: Exclude<OrgTier, 'admin'>[] = ['purchasing', 'planning', 'executive']

const TABS: { key: AdminUserStatus; label: string }[] = [
  { key: 'PENDING', label: '승인 대기' },
  { key: 'APPROVED', label: '승인 완료' },
  { key: 'REJECTED', label: '승인 거부' },
]

type DecisionAction = 'approve' | 'reject' | 'reopen'

/**
 * 관리자 가입 관리 화면(시큐어코딩 5 대응). ADMIN 계층만 라우트 가드를 통과한다.
 * - 승인 대기: PENDING 신청을 승인/거부한다.
 * - 승인 완료: 승인된 계정을 계층별로 확인하고, 필요 시 승인 거부한다.
 * - 승인 거부: 거부된 신청을 확인하고, 거부 해제(→ 승인 대기)한다.
 *
 * 상태를 바꾸면 해당 행은 현재 탭 목록에서 사라진다(다른 상태로 이동).
 * 관리자 전용 콘솔이라 이름·이메일은 원문으로 표시하며, 관리자(ADMIN) 계정은 백엔드가 목록에서 제외한다.
 */
export function AdminApprovalsPage() {
  const { accessToken } = useAuthState()
  const [status, setStatus] = useState<AdminUserStatus>('PENDING')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  // 탭(status)·토큰이 바뀌면 렌더 중에 로딩 자리표시자로 전환한다. effect에서 setState하면
  // 연쇄 렌더(react-hooks/set-state-in-effect)가 되고, 그 사이 한 프레임 동안 옛 목록이 노출된다.
  const queryKey = `${accessToken ?? ''}|${status}`
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey)
  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey)
    setLoading(true)
    setError(null)
  }

  // 조회 결과·로딩 해제·에러는 비동기 콜백에서만 setState한다(effect 본문의 동기 setState 회피).
  useEffect(() => {
    if (!accessToken) return
    let cancelled = false
    fetchUsers(accessToken, status)
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accessToken, status])

  async function handleAction(userId: number, action: DecisionAction) {
    if (!accessToken) return
    setBusyId(userId)
    setError(null)
    try {
      if (action === 'approve') await approveUser(accessToken, userId)
      else if (action === 'reject') await rejectUser(accessToken, userId)
      else await reopenUser(accessToken, userId)
      // 상태가 바뀌면 현재 탭 필터에서 벗어나므로 목록에서 제거한다.
      setUsers((prev) => prev.filter((user) => user.user_id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  const emptyMessage: Record<AdminUserStatus, string> = {
    PENDING: '승인 대기 중인 신청이 없습니다.',
    APPROVED: '승인 완료된 계정이 없습니다.',
    REJECTED: '거부된 신청이 없습니다.',
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <h1 className={styles.title}>가입 관리</h1>
        <p className={styles.subtitle}>
          승인 대기 신청을 검토하고, 승인 완료 계정을 계층별로, 거부 이력을 관리합니다.
        </p>

        <div className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={status === tab.key}
              className={status === tab.key ? styles.tabActive : styles.tab}
              onClick={() => setStatus(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>불러오는 중…</p>
        ) : users.length === 0 ? (
          <p className={styles.empty}>{emptyMessage[status]}</p>
        ) : status === 'PENDING' ? (
          <PendingTable users={users} busyId={busyId} onAction={handleAction} />
        ) : status === 'APPROVED' ? (
          <ApprovedByTier users={users} busyId={busyId} onAction={handleAction} />
        ) : (
          <RejectedTable users={users} busyId={busyId} onAction={handleAction} />
        )}
      </main>
      <Footer />
    </div>
  )
}

function tierLabel(orgTier: string): string {
  return TIER_LABEL[orgTier as OrgTier] ?? orgTier
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR')
}

interface ActionProps {
  users: AdminUser[]
  busyId: number | null
  onAction: (userId: number, action: DecisionAction) => void
}

/** 승인 대기 목록 — 승인 / 거부. */
function PendingTable({ users, busyId, onAction }: ActionProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>성명</th>
            <th>아이디</th>
            <th>신청 계층</th>
            <th>소속</th>
            <th>신청일</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{tierLabel(user.org_tier)}</td>
              <td>{user.org_name ?? '-'}</td>
              <td>{formatDate(user.created_at)}</td>
              <td className={styles.actions}>
                <button
                  type="button"
                  className={styles.approveButton}
                  disabled={busyId === user.user_id}
                  onClick={() => onAction(user.user_id, 'approve')}
                >
                  승인
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  disabled={busyId === user.user_id}
                  onClick={() => onAction(user.user_id, 'reject')}
                >
                  거부
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 승인 완료 목록 — 계층별로 분류하고, 각 계정을 승인 거부할 수 있다. */
function ApprovedByTier({ users, busyId, onAction }: ActionProps) {
  return (
    <div className={styles.groups}>
      {TIER_ORDER.map((tier) => {
        const members = users.filter((user) => user.org_tier === tier)
        if (members.length === 0) return null
        return (
          <section key={tier} className={styles.group}>
            <h2 className={styles.groupTitle}>
              {TIER_LABEL[tier]} <span className={styles.groupCount}>{members.length}</span>
            </h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>성명</th>
                    <th>아이디</th>
                    <th>소속</th>
                    <th>가입일</th>
                    <th>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.name}</td>
                      <td>{user.username}</td>
                      <td>{user.org_name ?? '-'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td className={styles.actions}>
                        <button
                          type="button"
                          className={styles.rejectButton}
                          disabled={busyId === user.user_id}
                          onClick={() => onAction(user.user_id, 'reject')}
                        >
                          승인 거부
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}

/** 승인 거부 목록 — 거부 해제 시 다시 승인 대기로 돌아간다. */
function RejectedTable({ users, busyId, onAction }: ActionProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>성명</th>
            <th>아이디</th>
            <th>신청 계층</th>
            <th>소속</th>
            <th>신청일</th>
            <th>처리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{tierLabel(user.org_tier)}</td>
              <td>{user.org_name ?? '-'}</td>
              <td>{formatDate(user.created_at)}</td>
              <td className={styles.actions}>
                <button
                  type="button"
                  className={styles.approveButton}
                  disabled={busyId === user.user_id}
                  onClick={() => onAction(user.user_id, 'reopen')}
                >
                  거부 해제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
