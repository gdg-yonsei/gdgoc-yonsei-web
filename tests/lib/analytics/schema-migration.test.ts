import { describe, expect, it } from 'vitest'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

describe('analytics migration', () => {
  it('creates the three analytics tables with cascading deletes', async () => {
    const { client } = await createAnalyticsTestDb()
    const tables = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_name like 'analytics_%' order by table_name`
    )
    expect(tables.rows.map((row) => row.table_name)).toEqual([
      'analytics_events',
      'analytics_page_views',
      'analytics_sessions',
    ])

    await client.exec(`
      insert into analytics_sessions (id, "visitorId", "startedAt", "lastSeenAt", "isNewVisitor", "isInternal",
        "landingPath", channel, "deviceType", browser, os, country)
      values ('0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11', '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22', now(), now(),
        true, false, '/ko', 'Direct', 'desktop', 'Chrome', 'macOS', 'KR');
      insert into analytics_page_views (id, "sessionId", "visitorId", "occurredAt", sequence, path, locale)
      values ('9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33', '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
        '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22', now(), 1, '/ko', 'ko');
      delete from analytics_sessions;
    `)
    const remaining = await client.query<{ count: number }>(
      'select count(*)::int as count from analytics_page_views'
    )
    expect(remaining.rows[0]?.count).toBe(0)
  })
})
