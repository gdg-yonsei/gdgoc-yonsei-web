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
import {
  authorize,
  canChangeMemberEmail,
  canEditMember,
  sharesGenerationWith,
} from '@/lib/server/services/admin/authorize'
import { resolveRequestedGenerationScope } from '@/lib/server/services/admin/generation-scope'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type Role,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { getGenerationNamesForUserId } from '@/lib/server/services/admin/cache-context'
import { acceptMemberValidation } from '@/lib/validations/accept-member'
import { updateMemberProfileImageValidation } from '@/lib/validations/admin-api'
import { memberValidation } from '@/lib/validations/member'

export type MemberInput = z.input<typeof memberValidation>
export type MemberRecord = NonNullable<Awaited<ReturnType<typeof getMember>>>

/** 연락처는 같은 기수·본인·LEAD 에게만 보인다. */
export type MemberDetail = Omit<
  MemberRecord,
  'email' | 'telephone' | 'studentId'
> & {
  email: string | null
  telephone: string | null
  studentId: number | null
}

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

  const resolved = await resolveRequestedGenerationScope(actor, generation)
  if (!resolved.ok) return resolved
  const scope = resolved.data
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

/** 가입 승인을 기다리는(UNVERIFIED) 사용자. 승인 권한이 있는 사람만 본다. */
export async function listPendingMembers(actor: Actor): Promise<
  ServiceResult<
    {
      id: string
      name: string
      email: string
      image: string | null
      createdAt: Date
    }[]
  >
> {
  const authorization = authorize(actor, 'put', 'membersRole')
  if (!authorization.ok) return authorization

  return ok(
    await db.query.users.findMany({
      where: eq(users.role, 'UNVERIFIED'),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    })
  )
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
  if (!member) return fail('NOT_FOUND', NOT_FOUND)

  if (await sharesGenerationWith(actor, memberId)) return ok(member)
  return ok({ ...member, email: null, telephone: null, studentId: null })
}

/** 고칠 권한이 있는 사람에게 연락처를 포함한 전체 기록을 준다(부분 수정 병합용). */
export async function getMemberForEdit(
  actor: Actor,
  memberId: string
): Promise<ServiceResult<MemberRecord>> {
  const editable = await authorizeMemberEdit(actor, memberId)
  if (!editable.ok) return editable

  const member = await getMember(memberId)
  return member ? ok(member) : fail('NOT_FOUND', NOT_FOUND)
}

export function memberToInput(detail: MemberRecord): MemberInput {
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

/**
 * 이 멤버의 정보(프로필 이미지 포함)를 고칠 수 있는지 확인하고 대상을 돌려준다.
 * 역할 매트릭스 + 대상 역할 제한(CORE 는 낮은 역할만)을 함께 본다.
 */
export async function authorizeMemberEdit(
  actor: Actor,
  memberId: string
): Promise<ServiceResult<{ id: string; role: Role; email: string }>> {
  const authorization = authorize(actor, 'put', 'members', memberId)
  if (!authorization.ok) return authorization

  const target = await db.query.users.findFirst({
    where: eq(users.id, memberId),
    columns: { id: true, role: true, email: true },
  })
  if (!target) return fail('NOT_FOUND', NOT_FOUND)
  if (!canEditMember(actor, target)) {
    return fail(
      'FORBIDDEN',
      'Only a LEAD can edit members whose role is CORE or LEAD.'
    )
  }
  if (!(await sharesGenerationWith(actor, memberId))) {
    return fail(
      'FORBIDDEN',
      'You can only edit members of your own generations.'
    )
  }
  return ok(target)
}

/** 멤버 정보를 갱신한다. 역할 필드는 역할 변경 권한이 있을 때만 반영한다. */
export async function updateMember(
  actor: Actor,
  memberId: string,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  const editable = await authorizeMemberEdit(actor, memberId)
  if (!editable.ok) return editable
  const target = editable.data

  const parsed = memberValidation.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  if (
    parsed.data.email !== target.email &&
    !canChangeMemberEmail(actor, memberId)
  ) {
    return fail('FORBIDDEN', "Only a LEAD can change another member's email.")
  }

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

/**
 * 멤버의 프로필 이미지 URL만 바꾼다(관리자 화면의 이미지 업로드 버튼).
 * 권한 규칙은 멤버 정보 수정과 같고, 권한을 먼저 확인한 뒤 입력을 검증한다.
 */
export async function updateMemberProfileImage(
  actor: Actor,
  memberId: string,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  const editable = await authorizeMemberEdit(actor, memberId)
  if (!editable.ok) return editable

  const parsed = updateMemberProfileImageValidation.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const { profileImage } = parsed.data

  try {
    const generationNames = await getGenerationNamesForUserId(memberId)

    await db
      .update(users)
      .set({ image: profileImage })
      .where(eq(users.id, memberId))

    invalidateMemberPublicCache({ memberId, generationNames })
  } catch (error) {
    logger.error('api.admin.members.profile-image', error, { memberId })
    return fail('INTERNAL', 'Failed to update the profile image')
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
