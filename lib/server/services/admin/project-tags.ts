import 'server-only'

import { asc, eq, inArray, sql } from 'drizzle-orm'
import { db, type DbExecutor } from '@/db'
import { projectsToTags } from '@/db/schema/projects-to-tags'
import { tags } from '@/db/schema/tags'
import { replaceRelationRows } from '@/lib/server/services/admin/shared'

/** Every tag name, for the admin chip input's suggestions. */
export async function getTagNames(): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name))
  return rows.map((row) => row.name)
}

const keyOf = (name: string) => name.toLowerCase()

/** Existing tags are matched case-insensitively ("next.js" reuses "Next.js"). */
async function resolveTagIds(
  names: readonly string[],
  executor: DbExecutor
): Promise<number[]> {
  if (names.length === 0) return []

  const lookup = () =>
    executor
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(inArray(sql`lower(${tags.name})`, names.map(keyOf)))

  const byKey = new Map(
    (await lookup()).map((tag) => [keyOf(tag.name), tag.id])
  )
  const missing = names.filter((name) => !byKey.has(keyOf(name)))

  if (missing.length > 0) {
    // A concurrent insert of the same name is fine: conflicts are skipped
    // and the second lookup picks up whichever row won.
    await executor
      .insert(tags)
      .values(missing.map((name) => ({ name })))
      .onConflictDoNothing()
    for (const tag of await lookup()) byKey.set(keyOf(tag.name), tag.id)
  }

  return names.flatMap((name) => {
    const id = byKey.get(keyOf(name))
    return id === undefined ? [] : [id]
  })
}

/**
 * 프로젝트의 태그를 정확히 `names`로 맞춘다(이미 중복 제거·검증된 목록).
 *
 * @param executor - 프로젝트 저장과 같은 트랜잭션에서 실행하려면 트랜잭션 객체를 넘긴다.
 */
export async function syncProjectTags(
  projectId: string,
  names: readonly string[],
  executor: DbExecutor = db
) {
  const tagIds = await resolveTagIds(names, executor)
  await replaceRelationRows({
    deleteRows: () =>
      executor
        .delete(projectsToTags)
        .where(eq(projectsToTags.projectId, projectId)),
    rows: tagIds.map((tagId) => ({ projectId, tagId })),
    insertRows: (rows) => executor.insert(projectsToTags).values(rows),
  })
}
