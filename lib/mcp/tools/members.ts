import 'server-only'

import { z } from 'zod'
import { defineTool, idOf } from '@/lib/mcp/registry'
import {
  generationArg,
  listArgs,
  listPage,
  mergePatch,
  patchWith,
  r2ImageUrl,
} from '@/lib/mcp/tools/common'
import {
  approveMember,
  deleteMember,
  getMemberDetail,
  getMemberForEdit,
  listMembers,
  listPendingMembers,
  memberToInput,
  updateMember,
  updateMemberRole,
} from '@/lib/server/services/admin/members'
import {
  getMyProfile,
  setSessionNotificationEmail,
  updateMyProfile,
} from '@/lib/server/services/admin/profile'
import { ok } from '@/lib/server/services/admin/types'

const ROLES = ['MEMBER', 'CORE', 'LEAD', 'ALUMNUS', 'UNVERIFIED'] as const

// 프로필 필드는 모두 선택이며 보낸 필드만 바뀐다.
export const memberPatchFields = {
  name: z.string().optional().describe('Display name.'),
  firstName: z.string().optional().describe('First name in English.'),
  firstNameKo: z.string().optional().describe('First name in Korean.'),
  lastName: z.string().optional().describe('Last name in English.'),
  lastNameKo: z.string().optional().describe('Last name in Korean.'),
  email: z.string().email().optional(),
  githubId: z.string().nullable().optional(),
  instagramId: z.string().nullable().optional(),
  linkedInId: z.string().nullable().optional(),
  major: z.string().nullable().optional(),
  studentId: z
    .string()
    .regex(/^\d*$/)
    .nullable()
    .optional()
    .describe('Digits only.'),
  telephone: z.string().nullable().optional(),
  isForeigner: z.boolean().optional(),
  profileImage: r2ImageUrl('users').nullable().optional(),
}

export const memberTools = [
  defineTool({
    name: 'list_members',
    title: 'List members',
    description:
      'Lists verified members with their part and generation. Filter by role or by a name fragment (English or Korean).',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'membersPage' }],
    input: z.object({
      ...listArgs,
      role: z.enum(ROLES).optional(),
      query: z.string().optional().describe('Name fragment to search for.'),
    }),
    run: (actor, input) =>
      listPage(
        listMembers(actor, {
          generation: generationArg(actor, input.generationId),
          role: input.role,
          query: input.query,
        }),
        input.limit,
        input.cursor
      ),
  }),
  defineTool({
    name: 'get_member',
    title: 'Get member',
    description:
      'Returns a member profile including contact details. Your own record is always readable.',
    scope: 'gyms:read',
    gate: [
      { action: 'get', resource: 'membersPage' },
      { action: 'get', resource: 'profilePage' },
    ],
    input: z.object({ memberId: z.string() }),
    run: (actor, input) => getMemberDetail(actor, input.memberId),
  }),
  defineTool({
    name: 'update_member',
    title: 'Update member',
    description:
      'Updates a member profile. Send only the fields to change. Roles are changed with update_member_role.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'members' }],
    input: z.object({ memberId: z.string(), ...memberPatchFields }),
    run: (actor, { memberId, ...patch }) =>
      patchWith(
        // 부분 수정 병합은 가려지지 않은 전체 기록으로 해야 연락처가 null 로 덮이지 않는다.
        getMemberForEdit(actor, memberId),
        memberToInput,
        patch,
        (input) => updateMember(actor, memberId, { ...input, role: null })
      ),
    targetId: idOf,
  }),
  defineTool({
    name: 'list_pending_members',
    title: 'List pending sign-ups',
    description:
      'Lists users who signed up but are not approved yet (role UNVERIFIED). Approve them with approve_member.',
    scope: 'gyms:admin',
    gate: [{ action: 'put', resource: 'membersRole' }],
    annotations: { readOnlyHint: true, destructiveHint: false },
    input: z.object({}),
    run: (actor) => listPendingMembers(actor),
  }),
  defineTool({
    name: 'approve_member',
    title: 'Approve member',
    description:
      'Approves a pending (UNVERIFIED) sign-up from list_pending_members as member, core or alumni.',
    scope: 'gyms:admin',
    gate: [{ action: 'put', resource: 'membersRole' }],
    input: z.object({
      userId: z.string(),
      role: z.enum(['member', 'core', 'alumni']),
    }),
    run: (actor, input) => approveMember(actor, input),
    targetId: idOf,
  }),
  defineTool({
    name: 'update_member_role',
    title: 'Change member role',
    description: "Changes a member's role. You cannot change your own role.",
    scope: 'gyms:admin',
    gate: [{ action: 'put', resource: 'membersRole' }],
    input: z.object({ userId: z.string(), role: z.enum(ROLES) }),
    run: (actor, input) => updateMemberRole(actor, input),
    targetId: idOf,
  }),
  defineTool({
    name: 'delete_member',
    title: 'Delete member',
    description:
      'Deletes a user account and its memberships. This cannot be undone. You cannot delete yourself.',
    scope: 'gyms:admin',
    gate: [{ action: 'put', resource: 'membersRole' }],
    input: z.object({ userId: z.string() }),
    run: (actor, input) => deleteMember(actor, input.userId),
    targetId: idOf,
  }),
]

export const profileTools = [
  defineTool({
    name: 'get_my_profile',
    title: 'Get my profile',
    description: 'Returns your own profile.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'profilePage' }],
    input: z.object({}),
    run: (actor) => getMyProfile(actor),
  }),
  defineTool({
    name: 'update_my_profile',
    title: 'Update my profile',
    description:
      'Updates your own profile. Send only the fields to change. sessionNotificationEmail turns new-session emails on or off.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'members' }],
    input: z.object({
      ...memberPatchFields,
      sessionNotificationEmail: z.boolean().optional(),
    }),
    run: async (actor, { sessionNotificationEmail, ...patch }) => {
      const hasProfileChanges = Object.values(patch).some(
        (value) => value !== undefined
      )

      if (hasProfileChanges) {
        const current = await getMyProfile(actor)
        if (!current.ok) return current
        const updated = await updateMyProfile(
          actor,
          mergePatch(memberToInput(current.data), patch)
        )
        if (!updated.ok) return updated
      }

      if (sessionNotificationEmail !== undefined) {
        const toggled = await setSessionNotificationEmail(
          actor,
          sessionNotificationEmail
        )
        if (!toggled.ok) return toggled
      }

      return ok({ id: actor.userId })
    },
    targetId: idOf,
  }),
]
