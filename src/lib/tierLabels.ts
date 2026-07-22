import type { OrgTier } from '../api/types'

/** org_tier별 한글 라벨. Header(계정 정보 표시)와 RequireAuth(계층 불일치 안내 모달)에서 공용으로 쓴다. */
export const TIER_LABEL: Record<OrgTier, string> = {
  purchasing: '구매팀',
  planning: '경영기획팀',
  executive: '경영진',
}
