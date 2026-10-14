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

/** 테스트마다 새 DB를 만든다. `vi.mock('@/db')`에서 `db`로 넘겨 서비스 코드를 그대로 실행한다. */
export async function createAnalyticsTestDb() {
  const client = new PGlite()
  for (const statement of await analyticsMigrationSql()) {
    await client.exec(statement)
  }
  return { client, db: drizzle(client, { schema: analyticsSchema }) }
}
