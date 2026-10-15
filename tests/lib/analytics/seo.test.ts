import { describe, expect, it } from 'vitest'
import {
  expectedCtr,
  findLowCtr,
  findLowEngagementLandings,
  findStrikingDistance,
  pathFromSearchConsolePage,
  type QueryPageRow,
} from '@/lib/analytics/seo'

const row = (overrides: Partial<QueryPageRow>): QueryPageRow => ({
  query: 'gdgoc',
  page: 'https://gdgoc.yonsei.ac.kr/ko',
  clicks: 0,
  impressions: 100,
  ctr: 0,
  position: 1,
  ...overrides,
})

describe('expectedCtr', () => {
  it('uses the reference curve and floors past page one', () => {
    expect(expectedCtr(1)).toBe(0.28)
    expect(expectedCtr(1.4)).toBe(0.28)
    expect(expectedCtr(3)).toBe(0.11)
    expect(expectedCtr(15)).toBe(0.01)
    expect(expectedCtr(0.4)).toBe(0.28)
  })
})

describe('pathFromSearchConsolePage', () => {
  it('normalizes Search Console page URLs to site paths', () => {
    expect(
      pathFromSearchConsolePage('https://gdgoc.yonsei.ac.kr/ko/session/')
    ).toBe('/ko/session')
    expect(
      pathFromSearchConsolePage('https://www.gdgoc.yonsei.ac.kr/en?utm=x#top')
    ).toBe('/en')
    expect(pathFromSearchConsolePage('https://gdgoc.yonsei.ac.kr/')).toBe('/')
    expect(pathFromSearchConsolePage('not a url')).toBe('not a url')
  })
})

describe('findLowCtr', () => {
  it('keeps rows with enough impressions and under half the typical CTR, by impressions', () => {
    const rows = [
      row({ query: 'a', impressions: 400, ctr: 0.05, position: 2 }),
      row({ query: 'b', impressions: 900, ctr: 0.1, position: 2 }),
      row({ query: 'c', impressions: 40, ctr: 0, position: 1 }),
      row({ query: 'd', impressions: 600, ctr: 0.02, position: 1 }),
    ]
    expect(
      findLowCtr(rows).map((item) => [item.query, item.expectedCtr])
    ).toEqual([
      ['d', 0.28],
      ['a', 0.15],
    ])
  })
})

describe('findStrikingDistance', () => {
  it('keeps positions 8 to 20 with at least 20 impressions', () => {
    const rows = [
      row({ query: 'a', position: 7.9, impressions: 500 }),
      row({ query: 'b', position: 8, impressions: 30 }),
      row({ query: 'c', position: 20, impressions: 300 }),
      row({ query: 'd', position: 12, impressions: 10 }),
      row({ query: 'e', position: 21, impressions: 900 }),
    ]
    expect(findStrikingDistance(rows).map((item) => item.query)).toEqual([
      'c',
      'b',
    ])
  })
})

describe('findLowEngagementLandings', () => {
  it('joins search impressions onto low-engagement organic landing pages', () => {
    const landings = [
      {
        path: '/ko/session',
        sessions: 12,
        engagementRate: 0.3,
        avgEngagementSeconds: 8,
      },
      {
        path: '/ko',
        sessions: 40,
        engagementRate: 0.7,
        avgEngagementSeconds: 50,
      },
      {
        path: '/en/project',
        sessions: 4,
        engagementRate: 0.1,
        avgEngagementSeconds: 3,
      },
      {
        path: '/ko/calendar',
        sessions: 6,
        engagementRate: 0.2,
        avgEngagementSeconds: 5,
      },
    ]
    const pages = [
      {
        page: 'https://gdgoc.yonsei.ac.kr/ko/session/',
        clicks: 10,
        impressions: 300,
        ctr: 0.03,
        position: 6,
      },
    ]
    expect(findLowEngagementLandings(landings, pages)).toEqual([
      {
        path: '/ko/session',
        sessions: 12,
        engagementRate: 0.3,
        avgEngagementSeconds: 8,
        impressions: 300,
        clicks: 10,
      },
      {
        path: '/ko/calendar',
        sessions: 6,
        engagementRate: 0.2,
        avgEngagementSeconds: 5,
        impressions: 0,
        clicks: 0,
      },
    ])
  })
})
