import 'server-only'

import { asc, eq, inArray, sql } from 'drizzle-orm'
import db from '@/db'
import { projectsToTags } from '@/db/schema/projects-to-tags'
import { tags } from '@/db/schema/tags'
import { replaceRelationRows } from '@/lib/server/actions/admin'

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
async function resolveTagIds(names: readonly string[]): Promise<number[]> {
  if (names.length === 0) return []

  const lookup = () =>
    db
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
    await db
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

/** Points a project at exactly `names` (already deduped and validated). */
export async function syncProjectTags(
  projectId: string,
  names: readonly string[]
) {
  const tagIds = await resolveTagIds(names)
  await replaceRelationRows({
    deleteRows: () =>
      db.delete(projectsToTags).where(eq(projectsToTags.projectId, projectId)),
    rows: tagIds.map((tagId) => ({ projectId, tagId })),
    insertRows: (rows) => db.insert(projectsToTags).values(rows),
  })
}
