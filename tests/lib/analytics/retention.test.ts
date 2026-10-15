import { beforeEach, describe, expect, it, vi } from 'vitest'

const testDb = vi.hoisted(() => ({
  current: null as null | Awaited<
    ReturnType<
      typeof import('@/tests/helpers/analytics-test-db').createAnalyticsTestDb
    >
  >,
}))

vi.mock('@/db', () => ({
  get db() {
    return testDb.current!.db
  },
}))

import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'
import {
  claimPruneSlot,
  pruneExpiredAnalytics,
  retentionCutoff,
} from '@/lib/server/analytics/collect/retention'

const NOW = new Date('2026-10-14T05:00:00.000Z')

async function insertSession(id: string, lastSeenAt: string) {
  await testDb.current!.client.query(
    `insert into analytics_sessions (id, "visitorId", "startedAt", "lastSeenAt", "isNewVisitor", "isInternal",
      "landingPath", channel, "deviceType", browser, os, country)
     values ($1, $1, $2, $2, true, false, '/ko', 'Direct', 'desktop', 'Chrome', 'macOS', 'KR')`,
    [id, lastSeenAt]
  )
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
})

describe('retention', () => {
  it('cuts off 26 months before now', () => {
    expect(retentionCutoff(NOW).toISOString()).toBe('2024-08-14T05:00:00.000Z')
  })

  it('deletes only sessions last seen before the cutoff', async () => {
    await insertSession(
      '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
      '2024-08-14 04:59:59'
    )
    await insertSession(
      '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22',
      '2024-08-14 05:00:01'
    )

    await expect(pruneExpiredAnalytics(NOW)).resolves.toBe(1)
    const left = await testDb.current!.client.query<{ id: string }>(
      'select id from analytics_sessions'
    )
    expect(left.rows.map((row) => row.id)).toEqual([
      '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22',
    ])
  })

  it('grants one prune slot per day per instance', () => {
    expect(claimPruneSlot(NOW)).toBe(true)
    expect(claimPruneSlot(new Date(NOW.getTime() + 60_000))).toBe(false)
    expect(claimPruneSlot(new Date(NOW.getTime() + 24 * 60 * 60 * 1000))).toBe(
      true
    )
  })
})
