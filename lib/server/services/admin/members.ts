import 'server-only'

import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema/users'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { getMember } from '@/lib/server/fetcher/admin/get-member'
import {
  getMembers,
  type AdminMemberListItem,
} from '@/lib/server/fetcher/admin/get-members'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import {
  authorize,
  canChangeMemberEmail,
  canEditMember,
  emailVerifiedAfterChange,
  sharesGenerationWith,
} from '@/lib/server/services/admin/authorize'
import { authorizeAccess } from '@/lib/server/services/admin/authorize-access'
import {
  UNACCEPTABLE_IMAGE,
  findUnacceptableImages,
} from '@/lib/server/services/admin/images/shared'
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
  }: {
    generation?: number | 'all' | undefined
    role?: Role | undefined
    query?: string | undefined
  } = {}
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

/** 멤버 상세. 같은 기수가 아니면 연락처(이메일·전화·학번)를 가린다. */
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

type EditableMember = {
  id: string
  role: Role
  email: string
  image: string | null
}

// 멤버 수정은 정책 표(본인 또는 같은 기수)와 대상 역할 제한을 함께 본다. CORE는 낮은 역할만 고친다.
export async function authorizeMemberEdit(
  actor: Actor,
  memberId: string
): Promise<ServiceResult<EditableMember>> {
  // 대상을 읽기 전에 "같은 기수라면 가능한 역할인지"를 본다. 남의 정보를 고칠 수 없는 역할이
  // 멤버 ID의 존재 여부를 알아내지 못하게 한다.
  const gate = await authorizeAccess(actor, 'put', 'members', {
    ownerId: memberId,
    inGeneration: true,
  })
  if (!gate.ok) return gate

  const target = await db.query.users.findFirst({
    where: eq(users.id, memberId),
    columns: { id: true, role: true, email: true, image: true },
  })
  if (!target) return fail('NOT_FOUND', NOT_FOUND)
  if (!canEditMember(actor, target)) {
    return fail(
      'FORBIDDEN',
      'Only a LEAD can edit members whose role is CORE or LEAD.'
    )
  }
  const access = await authorizeAccess(actor, 'put', 'members', {
    ownerId: memberId,
    inGeneration: await sharesGenerationWith(actor, memberId),
    generationDenied: 'You can only edit members of your own generations.',
  })
  if (!access.ok) return access
  return ok({ ...target, image: target.image ?? null })
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

  // 검증 스키마가 이메일을 소문자로 맞추므로 대소문자만 다른 값은 변경으로 보지 않는다.
  const emailChanged = parsed.data.email !== target.email.toLowerCase()
  if (emailChanged && !canChangeMemberEmail(actor, memberId)) {
    return fail('FORBIDDEN', "Only a LEAD can change another member's email.")
  }
  if (
    findUnacceptableImages([parsed.data.profileImage], [target.image], 'users')
      .length > 0
  ) {
    return fail('VALIDATION', UNACCEPTABLE_IMAGE, {
      profileImage: [UNACCEPTABLE_IMAGE],
    })
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

  return withDbErrors(
    'admin.members.update',
    async () => {
      const generationNames = await getGenerationNamesForUserId(memberId)

      await db
        .update(users)
        .set({
          name,
          firstName,
          firstNameKo,
          lastName,
          lastNameKo,
          // 바뀐 주소는 소유를 확인하지 않았으므로 확인 상태를 다시 정한다.
          ...(emailChanged
            ? { email, emailVerified: emailVerifiedAfterChange(actor) }
            : {}),
          githubId,
          instagramId,
          linkedInId,
          major,
          studentId: studentId ? Number(studentId) : null,
          telephone: telephone?.replaceAll('-', '').replaceAll(' ', ''),
          ...(canChangeRole && role ? { role } : {}),
          updatedAt: new Date(),
          isForeigner,
          image: profileImage,
        })
        .where(eq(users.id, memberId))

      invalidateMemberPublicCache({
        memberId,
        generationNames,
      })

      return ok({ id: memberId })
    },
    {
      memberId,
    }
  )
}

// 프로필 이미지 변경도 멤버 수정 권한을 먼저 확인한 뒤 입력을 검증한다.
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
  if (
    findUnacceptableImages([profileImage], [editable.data.image], 'users')
      .length > 0
  ) {
    return fail('VALIDATION', UNACCEPTABLE_IMAGE, {
      profileImage: [UNACCEPTABLE_IMAGE],
    })
  }

  return withDbErrors(
    'api.admin.members.profile-image',
    async () => {
      const generationNames = await getGenerationNamesForUserId(memberId)

      await db
        .update(users)
        .set({ image: profileImage })
        .where(eq(users.id, memberId))

      invalidateMemberPublicCache({ memberId, generationNames })

      return ok({ id: memberId })
    },
    { memberId },
    'Failed to update the profile image'
  )
}

async function setRole(
  userId: string,
  role: Role,
  scope: string
): Promise<ServiceResult<{ id: string; role: Role }>> {
  return withDbErrors(
    scope,
    async () => {
      const generationNames = await getGenerationNamesForUserId(userId)

      await db.update(users).set({ role }).where(eq(users.id, userId))

      invalidateMemberPublicCache({
        memberId: userId,
        generationNames,
      })

      return ok({ id: userId, role })
    },
    {
      userId,
    }
  )
}

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

/** 멤버 역할을 바꾼다(LEAD 전용). 자기 역할은 바꿀 수 없다. */
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

// 가입 거절은 계정 삭제다. LEAD만 가능하며 자기 자신은 지울 수 없다.
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

  return withDbErrors(
    'admin.members.delete-pending',
    async () => {
      const generationNames = await getGenerationNamesForUserId(userId)

      await db.delete(users).where(eq(users.id, userId))

      invalidateMemberPublicCache({
        memberId: userId,
        generationNames,
      })

      return ok({ id: userId })
    },
    {
      userId,
    }
  )
}
