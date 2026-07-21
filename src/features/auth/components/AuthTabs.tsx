import styles from './AuthTabs.module.css'

export type AuthTabKey = 'login' | 'signup'

interface AuthTabsProps {
  activeTab: AuthTabKey
  onChange: (tab: AuthTabKey) => void
}

const TABS: { key: AuthTabKey; label: string }[] = [
  { key: 'login', label: '시스템 로그인' },
  { key: 'signup', label: '권한 신청' },
]

/**
 * [시스템 로그인]/[권한 신청] 비동기 탭 토글 (Seq 33). 새로고침 없이 activeTab 상태만 바꿔 전환한다.
 *
 * 사용 예:
 *   <AuthTabs activeTab={activeTab} onChange={setActiveTab} />
 */
export function AuthTabs({ activeTab, onChange }: AuthTabsProps) {
  return (
    <div className={styles.tabs}>
      <div className={styles.tabRow} role="tablist" aria-label="로그인/권한 신청 전환">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={styles.tabButton}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.indicatorTrack}>
        <div
          className={styles.indicator}
          style={{ transform: activeTab === 'signup' ? 'translateX(100%)' : 'translateX(0%)' }}
        />
      </div>
    </div>
  )
}
