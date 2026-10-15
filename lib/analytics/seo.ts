/**
 * SEO 개선 기회 판정(명세 10장). 기준값은 이 파일에만 둔다.
 * 순위별 일반 클릭률은 공개된 업계 평균을 반올림한 참고치다. 정확한 기대값이 아니라 "눈에 띄게 낮은지" 거르는 데 쓴다.
 */

export type SearchMetrics = {
  clicks: number
  impressions: number
  ctr: number
  position: number
}
export type QueryPageRow = SearchMetrics & { query: string; page: string }
export type LandingEngagement = {
  path: string
  sessions: number
  engagementRate: number
  avgEngagementSeconds: number
}

export const LOW_CTR_MIN_IMPRESSIONS = 50
export const STRIKING_MIN_IMPRESSIONS = 20
export const STRIKING_MIN_POSITION = 8
export const STRIKING_MAX_POSITION = 20
export const LOW_ENGAGEMENT_MIN_SESSIONS = 5
export const LOW_ENGAGEMENT_MAX_RATE = 0.5
export const OPPORTUNITY_LIMIT = 20

// 1~10위. 11위부터는 두 번째 페이지라 1%로 본다.
const EXPECTED_CTR_BY_POSITION = [
  0.28, 0.15, 0.11, 0.08, 0.07, 0.05, 0.04, 0.03, 0.03, 0.025,
]

export function expectedCtr(position: number): number {
  const rank = Math.max(1, Math.round(position))
  return EXPECTED_CTR_BY_POSITION[rank - 1] ?? 0.01
}

/** Search Console 페이지 주소를 우리 수집 경로 모양으로 맞춘다(호스트·쿼리·해시·끝 슬래시 제거). */
export function pathFromSearchConsolePage(page: string): string {
  try {
    const path = new URL(page).pathname.replace(/\/+$/, '')
    return path || '/'
  } catch {
    return page
  }
}

const byImpressions = <T extends { impressions: number }>(a: T, b: T) =>
  b.impressions - a.impressions

export function findLowCtr(
  rows: QueryPageRow[]
): Array<QueryPageRow & { expectedCtr: number }> {
  return rows
    .map((row) => ({ ...row, expectedCtr: expectedCtr(row.position) }))
    .filter(
      (row) =>
        row.impressions >= LOW_CTR_MIN_IMPRESSIONS &&
        row.ctr < row.expectedCtr / 2
    )
    .sort(byImpressions)
    .slice(0, OPPORTUNITY_LIMIT)
}

export function findStrikingDistance(rows: QueryPageRow[]): QueryPageRow[] {
  return rows
    .filter(
      (row) =>
        row.position >= STRIKING_MIN_POSITION &&
        row.position <= STRIKING_MAX_POSITION &&
        row.impressions >= STRIKING_MIN_IMPRESSIONS
    )
    .sort(byImpressions)
    .slice(0, OPPORTUNITY_LIMIT)
}

/** 검색에 노출되지 않은 페이지도 남긴다(노출 0). 참여가 낮다는 사실 자체가 개선 대상이다. */
export function findLowEngagementLandings(
  landings: LandingEngagement[],
  pages: Array<SearchMetrics & { page: string }>
): Array<LandingEngagement & { impressions: number; clicks: number }> {
  const searchByPath = new Map(
    pages.map((page) => [pathFromSearchConsolePage(page.page), page])
  )
  return landings
    .filter(
      (row) =>
        row.sessions >= LOW_ENGAGEMENT_MIN_SESSIONS &&
        row.engagementRate < LOW_ENGAGEMENT_MAX_RATE
    )
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, OPPORTUNITY_LIMIT)
    .map((row) => {
      const search = searchByPath.get(row.path)
      return {
        ...row,
        impressions: search?.impressions ?? 0,
        clicks: search?.clicks ?? 0,
      }
    })
}
