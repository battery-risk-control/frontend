import styles from './SecurityBadge.module.css'

/**
 * 로그인/회원가입 화면 하단 엔터프라이즈향 보안 배지 (Seq 36).
 * IP 접근 제어 및 2차 인증(OTP) 활성화 구간임을 알린다.
 *
 * 사용 예:
 *   <SecurityBadge />
 */
export function SecurityBadge() {
  return <p className={styles.badge}>IP 접근 제어 및 2차 인증(OTP) 활성화 구간</p>
}
