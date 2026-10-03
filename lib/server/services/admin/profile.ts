/**
 * 내 프로필 서비스(관리자 프로필 화면, MCP whoami 계열 도구).
 *
 * 서비스 함수는 웹 Server Action과 MCP 도구가 함께 쓴다. 모두 같은 순서로 동작한다:
 * 권한 확인(`authorize`, 기수 접근) → 입력 검증(zod) → DB 쓰기 → 공개 캐시 무효화.
 * 결과는 예외 대신 `ServiceResult`(성공 `ok` / 실패 `fail`)로 돌려준다.
 */
import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import { logger } from '@/lib/server/logger'
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

/** 로그인한 본인의 프로필. */
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

  try {
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
  } catch (e) {
    logger.error('admin.profile.update', e, {
      memberId: actor.userId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: actor.userId })
}

/** 새 세션 안내 메일 수신 여부를 바꾼다. */
export async function setSessionNotificationEmail(
  actor: Actor,
  enabled: boolean
): Promise<ServiceResult<{ sessionNotiEmail: boolean }>> {
  const authorization = authorize(actor, 'put', 'members', actor.userId)
  if (!authorization.ok) return authorization

  try {
    await db
      .update(users)
      .set({ sessionNotiEmail: enabled })
      .where(eq(users.id, actor.userId))
  } catch (error) {
    logger.error('admin.profile.toggle-session-notification', error, {
      userId: actor.userId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ sessionNotiEmail: enabled })
}
