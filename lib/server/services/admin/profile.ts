import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import { authorize } from '@/lib/server/services/admin/authorize'
import type { MemberRecord } from '@/lib/server/services/admin/members'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { getGenerationNamesForUserId } from '@/lib/server/services/admin/cache-context'
import { memberValidation } from '@/lib/validations/member'

export async function getMyProfile(
  actor: Actor
): Promise<ServiceResult<MemberRecord>> {
  const authorization = authorize(actor, 'get', 'profilePage')
  if (!authorization.ok) return authorization

  const member = await getMember(actor.userId)
  return member ? ok(member) : fail('NOT_FOUND', 'Member not found')
}

/** 본인 프로필을 갱신한다. 본인 프로필에서는 역할을 바꿀 수 없다. */
export async function updateMyProfile(
  actor: Actor,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'put', 'members', actor.userId)
  if (!authorization.ok) return authorization

  const parsed = memberValidation.safeParse({
    ...(input && typeof input === 'object' ? input : {}),
    role: null,
  })
  if (!parsed.success) return fromZodError(parsed.error)

  const {
    name,
    firstName,
    firstNameKo,
    lastName,
    lastNameKo,
    email,
    githubId,
    instagramId,
    linkedInId,
    major,
    studentId,
    telephone,
    isForeigner,
    profileImage,
  } = parsed.data

  return withDbErrors(
    'admin.profile.update',
    async () => {
      const generationNames = await getGenerationNamesForUserId(actor.userId)

      await db
        .update(users)
        .set({
          name,
          firstName,
          firstNameKo,
          lastName,
          lastNameKo,
          email,
          githubId,
          instagramId,
          linkedInId,
          major,
          studentId: studentId ? Number(studentId) : null,
          telephone: telephone?.replaceAll('-', '').replaceAll(' ', ''),
          isForeigner,
          updatedAt: new Date(),
          image: profileImage,
        })
        .where(eq(users.id, actor.userId))

      invalidateMemberPublicCache({
        memberId: actor.userId,
        generationNames,
      })

      return ok({ id: actor.userId })
    },
    {
      memberId: actor.userId,
    }
  )
}

export async function setSessionNotificationEmail(
  actor: Actor,
  enabled: boolean
): Promise<ServiceResult<{ sessionNotiEmail: boolean }>> {
  const authorization = authorize(actor, 'put', 'members', actor.userId)
  if (!authorization.ok) return authorization

  return withDbErrors(
    'admin.profile.toggle-session-notification',
    async () => {
      await db
        .update(users)
        .set({ sessionNotiEmail: enabled })
        .where(eq(users.id, actor.userId))

      return ok({ sessionNotiEmail: enabled })
    },
    {
      userId: actor.userId,
    }
  )
}
