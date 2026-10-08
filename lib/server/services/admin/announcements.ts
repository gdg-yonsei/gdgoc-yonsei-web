import 'server-only'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { announcementReads, announcements } from '@/db/schema/announcements'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import { authorize } from '@/lib/server/services/admin/authorize'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { announcementValidation } from '@/lib/validations/announcement'

const NOT_FOUND = 'Announcement not found'

function isUuid(value: string) {
  return z.uuid().safeParse(value).success
}

/** 작성자는 자기 공지를 이미 본 것으로 기록해 작성 직후 모달이 뜨지 않게 한다. */
export async function createAnnouncement(
  actor: Actor,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'post', 'announcements')
  if (!authorization.ok) return authorization

  const parsed = announcementValidation.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  return withDbErrors('admin.announcements.create', async () => {
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(announcements)
        .values({ ...parsed.data, authorId: actor.userId })
        .returning({ id: announcements.id })
      if (!row) {
        throw new Error('Failed to create announcement')
      }
      await tx
        .insert(announcementReads)
        .values({ announcementId: row.id, userId: actor.userId })
      return row
    })
    return ok({ id: created.id })
  })
}

export async function deleteAnnouncement(
  actor: Actor,
  announcementId: string
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'delete', 'announcements')
  if (!authorization.ok) return authorization
  if (!isUuid(announcementId)) return fail('NOT_FOUND', NOT_FOUND)

  return withDbErrors('admin.announcements.delete', async () => {
    const [deleted] = await db
      .delete(announcements)
      .where(eq(announcements.id, announcementId))
      .returning({ id: announcements.id })
    return deleted ? ok(deleted) : fail('NOT_FOUND', NOT_FOUND)
  })
}

/** 로그인한 멤버 누구나 자기 읽음 기록만 남긴다. 같은 공지를 다시 닫아도 오류가 아니다. */
export async function markAnnouncementRead(
  actor: Actor,
  announcementId: string
): Promise<ServiceResult<null>> {
  if (actor.role === 'UNVERIFIED') {
    return fail('FORBIDDEN', 'You do not have permission for this operation.')
  }
  if (!isUuid(announcementId)) return fail('NOT_FOUND', NOT_FOUND)

  return withDbErrors('admin.announcements.read', async () => {
    const existing = await db.query.announcements.findFirst({
      where: eq(announcements.id, announcementId),
      columns: { id: true },
    })
    if (!existing) return fail('NOT_FOUND', NOT_FOUND)

    await db
      .insert(announcementReads)
      .values({ announcementId, userId: actor.userId })
      .onConflictDoNothing()
    return ok(null)
  })
}
