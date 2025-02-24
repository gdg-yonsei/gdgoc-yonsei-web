import 'server-only'
import db from '@/db'
import { users } from '@/db/schema/users'
import { asc, eq } from 'drizzle-orm'
import { PgColumn } from 'drizzle-orm/pg-core'
import { usersToParts } from '@/db/schema/users-to-parts'
import { parts } from '@/db/schema/parts'

/**
 * 사용자 목록 가져오는 함수
 * @param orderBy - Drizzle ORM OrderBy Type
 */
export async function getUsers(orderBy: PgColumn = users.registeredAt) {
  return db
    .select()
    .from(users)
    .orderBy(asc(orderBy))
    .leftJoin(usersToParts, eq(usersToParts.userId, users.id))
    .leftJoin(parts, eq(usersToParts.partId, parts.id))
}

export type GetUsersType = Awaited<ReturnType<typeof getUsers>>
