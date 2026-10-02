/**
 * 프로젝트 태그 서비스(태그 목록, 프로젝트 태그 동기화).
 */
import 'server-only'

import { asc, eq, inArray, sql } from 'drizzle-orm'
import { db, type DbExecutor } from '@/db'
import { projectsToTags } from '@/db/schema/projects-to-tags'
import { tags } from '@/db/schema/tags'
import { replaceRelationRows } from '@/lib/server/services/admin/shared'

/** 모든 태그 이름. 관리자 태그 입력의 자동 완성 후보로 쓴다. */
export async function getTagNames(): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name))
  return rows.map((row) => row.name)
}

const keyOf = (name: string) => name.toLowerCase()

/** 태그 이름을 ID로 바꾸고 없는 태그는 만든다. 대소문자를 구분하지 않는다("next.js"는 "Next.js"를 재사용). */
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
    // 같은 이름을 동시에 넣어도 괜찮다: 충돌은 건너뛰고, 다시 조회해 먼저 들어간 행을 쓴다.
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
