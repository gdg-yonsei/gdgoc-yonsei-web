import 'server-only'

import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import db from '@/db'
import { users } from '@/db/schema/users'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import {
  getMembers,
  type AdminMemberListItem,
} from '@/lib/server/fetcher/admin/get-members'
import { logger } from '@/lib/server/logger'
import { authorize } from '@/lib/server/services/admin/authorize'
import { resolveGenerationScope } from '@/lib/server/services/admin/generation-scope'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type Role,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { getGenerationNamesForUserId } from '@/lib/server/services/cache-context'
import { acceptMemberValidation } from '@/lib/validations/accept-member'
import { memberValidation } from '@/lib/validations/member'

export type MemberInput = z.input<typeof memberValidation>
export type MemberDetail = NonNullable<Awaited<ReturnType<typeof getMember>>>

const NOT_FOUND = 'Member not found'

const APPROVAL_ROLES = {
  member: 'MEMBER',
  core: 'CORE',
  alumni: 'ALUMNUS',
} as const satisfies Record<string, Role>

export async function listMembers(
  actor: Actor,
  {
    generation,
    role,
    query,
  }: { generation?: number | 'all'; role?: Role; query?: string } = {}
): Promise<ServiceResult<AdminMemberListItem[]>> {
  const authorization = authorize(actor, 'get', 'membersPage')
  if (!authorization.ok) return authorization

  const scope = await resolveGenerationScope(actor, generation)
  if (!scope) return ok([])

  const needle = query?.trim().toLowerCase()
  const members = (await getMembers(scope)).filter(
    (member) =>
      (!role || member.role === role) &&
      (!needle ||
        [
          member.name,
          member.firstName,
          member.lastName,
          member.firstNameKo,
          member.lastNameKo,
        ].some((value) => value?.toLowerCase().includes(needle)))
  )
  return ok(members)
}

export async function getMemberDetail(
  actor: Actor,
  memberId: string
): Promise<ServiceResult<MemberDetail>> {
  // 본인 정보는 멤버 목록 권한이 없어도 볼 수 있다.
  if (memberId !== actor.userId) {
    const authorization = authorize(actor, 'get', 'membersPage')
    if (!authorization.ok) return authorization
  }

  const member = await getMember(memberId)
  return member ? ok(member) : fail('NOT_FOUND', NOT_FOUND)
}

export function memberToInput(detail: MemberDetail): MemberInput {
  return {
    name: detail.name,
    firstName: detail.firstName ?? '',
    firstNameKo: detail.firstNameKo ?? '',
    lastName: detail.lastName ?? '',
    lastNameKo: detail.lastNameKo ?? '',
    email: detail.email,
    githubId: detail.githubId,
    instagramId: detail.instagramId,
    linkedInId: detail.linkedInId,
    major: detail.major,
    studentId: detail.studentId === null ? null : String(detail.studentId),
    telephone: detail.telephone,
    role: null,
    isForeigner: detail.isForeigner,
    profileImage: detail.image,
  }
}

/** 멤버 정보를 갱신한다. 역할 필드는 역할 변경 권한이 있을 때만 반영한다. */
export async function updateMember(
  actor: Actor,
  memberId: string,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'put', 'members', memberId)
  if (!authorization.ok) return authorization

  const parsed = memberValidation.safeParse(input)
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
    role,
    isForeigner,
    profileImage,
  } = parsed.data

  const canChangeRole = authorize(actor, 'put', 'membersRole').ok

  try {
    const generationNames = await getGenerationNamesForUserId(memberId)

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
        ...(canChangeRole && role ? { role } : {}),
        isForeigner,
        image: profileImage,
      })
      .where(eq(users.id, memberId))

    invalidateMemberPublicCache({
      memberId,
      generationNames,
    })
  } catch (e) {
    logger.error('admin.members.update', e, {
      memberId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: memberId })
}

async function setRole(
  userId: string,
  role: Role,
  scope: string
): Promise<ServiceResult<{ id: string; role: Role }>> {
  try {
    const generationNames = await getGenerationNamesForUserId(userId)

    await db.update(users).set({ role }).where(eq(users.id, userId))

    invalidateMemberPublicCache({
      memberId: userId,
      generationNames,
    })
  } catch (e) {
    logger.error(scope, e, {
      userId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: userId, role })
}

/** 가입 대기(UNVERIFIED) 사용자를 승인한다. */
export async function approveMember(
  actor: Actor,
  input: unknown
): Promise<ServiceResult<{ id: string; role: Role }>> {
  const authorization = authorize(actor, 'put', 'membersRole')
  if (!authorization.ok) return authorization

  const parsed = acceptMemberValidation.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const target = await db.query.users.findFirst({
    where: eq(users.id, parsed.data.userId),
    columns: { id: true, role: true },
  })
  if (!target) return fail('NOT_FOUND', NOT_FOUND)
  if (target.role !== 'UNVERIFIED') {
    return fail('CONFLICT', 'Only pending (UNVERIFIED) users can be approved.')
  }

  return setRole(
    parsed.data.userId,
    APPROVAL_ROLES[parsed.data.role],
    'admin.members.accept'
  )
}

export async function updateMemberRole(
  actor: Actor,
  { userId, role }: { userId: string; role: Role }
): Promise<ServiceResult<{ id: string; role: Role }>> {
  const authorization = authorize(actor, 'put', 'membersRole')
  if (!authorization.ok) return authorization

  // 자기 역할을 바꾸면 마지막 LEAD 가 스스로 권한을 잃을 수 있다.
  if (userId === actor.userId) {
    return fail('CONFLICT', 'You cannot change your own role.')
  }

  const target = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true },
  })
  if (!target) return fail('NOT_FOUND', NOT_FOUND)

  return setRole(userId, role, 'admin.members.role')
}

export async function deleteMember(
  actor: Actor,
  userId: string
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'put', 'membersRole')
  if (!authorization.ok) return authorization

  if (!userId.trim()) return fail('VALIDATION', 'User Id is required')
  if (userId === actor.userId) {
    return fail('CONFLICT', 'You cannot delete your own account here.')
  }

  try {
    const generationNames = await getGenerationNamesForUserId(userId)

    await db.delete(users).where(eq(users.id, userId))

    invalidateMemberPublicCache({
      memberId: userId,
      generationNames,
    })
  } catch (e) {
    logger.error('admin.members.delete-pending', e, {
      userId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: userId })
}
