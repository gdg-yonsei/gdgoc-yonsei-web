/** 분석 SQL을 실제 Postgres 문법으로 검증하는 메모리 DB. 생성된 분석 마이그레이션 파일만 적용해 빠르게 뜬다. */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as analyticsSchema from '@/db/schema/analytics'

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle')

async function analyticsMigrationSql(): Promise<string[]> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) =>
    file.endsWith('.sql')
  )
  const statements: string[] = []
  for (const file of files.sort()) {
    const content = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    if (content.includes('CREATE TABLE "analytics_')) {
      statements.push(...content.split('--> statement-breakpoint'))
    }
  }
  return statements.map((statement) => statement.trim()).filter(Boolean)
}

async function startDb() {
  const client = new PGlite()
  for (const statement of await analyticsMigrationSql()) {
    await client.exec(statement)
  }
  return { client, db: drizzle(client, { schema: analyticsSchema }) }
}

let shared: ReturnType<typeof startDb> | null = null

/**
 * 테스트마다 빈 분석 테이블을 돌려준다. `vi.mock('@/db')`에서 `db`로 넘겨 서비스 코드를 그대로 실행한다.
 * WASM Postgres는 시작이 느려(부하가 걸리면 10초 이상) 테스트 파일마다 한 번만 띄우고 테이블만 비운다.
 */
export async function createAnalyticsTestDb() {
  shared ??= startDb()
  const instance = await shared
  await instance.client.exec(
    'TRUNCATE analytics_events, analytics_page_views, analytics_sessions RESTART IDENTITY CASCADE'
  )
  return instance
}
