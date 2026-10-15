import { describe, expect, it } from 'vitest'
import {
  SEED_VISITOR_PREFIX,
  buildAnalyticsSeed,
} from '@/scripts/seed/analytics'

const options = {
  now: new Date('2026-10-14T05:00:00.000Z'),
  days: 30,
  seed: 7,
  paths: ['/ko', '/ko/session/25-26', '/en/project/25-26', '/ko/calendar'],
}

describe('buildAnalyticsSeed', () => {
  it('is deterministic for the same seed', () => {
    expect(buildAnalyticsSeed(options)).toEqual(buildAnalyticsSeed(options))
  })

  it('builds consistent rows inside the date range', () => {
    const { sessions, pageViews, events } = buildAnalyticsSeed(options)
    const sessionIds = new Set(sessions.map((session) => session.id))
    const viewIds = new Set(pageViews.map((view) => view.id))
    const earliest = options.now.getTime() - 30 * 24 * 3600 * 1000

    expect(sessions.length).toBeGreaterThan(100)
    expect(
      sessions.every((session) =>
        session.visitorId.startsWith(SEED_VISITOR_PREFIX)
      )
    ).toBe(true)
    expect(
      sessions.every(
        (session) =>
          session.startedAt.getTime() >= earliest &&
          session.startedAt <= options.now
      )
    ).toBe(true)
    expect(pageViews.every((view) => sessionIds.has(view.sessionId))).toBe(true)
    expect(
      events.every(
        (event) =>
          viewIds.has(event.pageViewId) && sessionIds.has(event.sessionId)
      )
    ).toBe(true)
    expect(pageViews.filter((view) => view.sequence === 1)).toHaveLength(
      sessions.length
    )
    expect(events.some((event) => event.name === 'web_vital')).toBe(true)
    expect(events.some((event) => event.name === 'cta')).toBe(true)
  })
})
