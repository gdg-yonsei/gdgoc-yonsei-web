import 'server-only'

import { z } from 'zod'
import { defineTool, idOf } from '@/lib/mcp/registry'
import {
  generationArg,
  r2ImageUrl,
  listArgs,
  listPage,
  mergePatch,
} from '@/lib/mcp/tools/common'
import { parseSessionDateTime } from '@/lib/mcp/tools/datetime'
import {
  createSession,
  deleteSession,
  getSessionDetail,
  listSessions,
  registerForSession,
  removeSessionParticipant,
  sessionToInput,
  unregisterFromSession,
  updateSession,
} from '@/lib/server/services/admin/sessions'
import { fail, ok } from '@/lib/server/services/admin/types'
import { sessionWallClockNow } from '@/lib/format/datetime'

const sessionId = z.string().uuid().describe('Session id.')
const dateTime = z
  .string()
  .describe(
    'Date-time. Without an offset ("2026-10-01T19:00") it is Seoul local time; with an offset ("2026-10-01T10:00:00Z") it is converted to Seoul time.'
  )

const sessionFields = {
  name: z.string().describe('Session title in English.'),
  nameKo: z.string().describe('Session title in Korean.'),
  description: z.string().describe('Description in English (plain text).'),
  descriptionKo: z.string().describe('Description in Korean (plain text).'),
  location: z.string().describe('Location in English.'),
  locationKo: z.string().describe('Location in Korean.'),
  startAt: dateTime,
  endAt: dateTime,
  maxCapacity: z.number().int().min(1),
  partId: z
    .number()
    .int()
    .positive()
    .describe('Hosting part id (from list_parts). Decides the generation.'),
  internalOpen: z
    .boolean()
    .describe(
      'Open for member registration. Creating an open session emails the generation members.'
    ),
  publicOpen: z.boolean().describe('Open for public registration.'),
  displayOnWebsite: z.boolean().describe('Show on the public website.'),
  type: z.enum(['Part Session', 'General Session']),
  category: z.enum([
    'tech_talk',
    'part_session',
    'hackathon',
    'demo_day',
    'devrel',
  ]),
  mainImage: r2ImageUrl('sessions').nullable(),
  contentImages: z.array(r2ImageUrl('sessions')),
  participantIds: z
    .array(z.string())
    .describe('User ids already registered for the session.'),
}

function toServiceFields(input: Record<string, unknown>) {
  const { startAt, endAt, partId, participantIds, ...rest } = input
  const converted: Record<string, unknown> = { ...rest }

  for (const [key, value] of [
    ['startAt', startAt],
    ['endAt', endAt],
  ] as const) {
    if (value === undefined) continue
    const parsed = parseSessionDateTime(value as string)
    if (!parsed) return { error: `${key} must look like 2026-10-01T19:00` }
    converted[key] = parsed
  }
  if (typeof partId === 'number' || typeof partId === 'string') {
    converted.partId = String(partId)
  }
  if (participantIds !== undefined) converted.participantId = participantIds
  return { fields: converted }
}

export const sessionTools = [
  defineTool({
    name: 'list_sessions',
    title: 'List sessions',
    description:
      'Lists sessions, newest first. Set openForRegistration to keep only sessions you can still register for.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'sessionsPage' }],
    input: z.object({
      ...listArgs,
      openForRegistration: z.boolean().optional(),
    }),
    run: async (actor, input) => {
      const listed = listSessions(actor, {
        generation: generationArg(actor, input.generationId),
      })
      if (!input.openForRegistration) {
        return listPage(listed, input.limit, input.cursor)
      }
      const now = sessionWallClockNow()
      return listPage(
        listed.then((result) =>
          result.ok
            ? ok(
                result.data.filter(
                  (session) =>
                    (session.internalOpen || session.publicOpen) &&
                    (session.endAt === null || session.endAt > now) &&
                    session.participantCount < (session.maxCapacity ?? 0)
                )
              )
            : result
        ),
        input.limit,
        input.cursor
      )
    },
  }),
  defineTool({
    name: 'get_session',
    title: 'Get session',
    description: 'Returns a session with its part, author and participants.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'sessionsPage' }],
    input: z.object({ sessionId }),
    run: (actor, input) => getSessionDetail(actor, input.sessionId),
  }),
  defineTool({
    name: 'create_session',
    title: 'Create session',
    description:
      'Creates a session hosted by a part. If internalOpen is true and the session has not ended, every member of that generation with session emails enabled is emailed an invitation.',
    scope: 'gyms:write',
    gate: [{ action: 'post', resource: 'sessions' }],
    input: z.object({
      ...sessionFields,
      internalOpen: sessionFields.internalOpen.default(false),
      publicOpen: sessionFields.publicOpen.default(false),
      displayOnWebsite: sessionFields.displayOnWebsite.default(true),
      type: sessionFields.type.default('Part Session'),
      category: sessionFields.category.default('tech_talk'),
      mainImage: sessionFields.mainImage.default(null),
      contentImages: sessionFields.contentImages.default([]),
      participantIds: sessionFields.participantIds.default([]),
    }),
    run: async (actor, input) => {
      const converted = toServiceFields(input)
      if ('error' in converted) return fail('VALIDATION', converted.error!)
      return createSession(actor, converted.fields)
    },
    targetId: idOf,
  }),
  defineTool({
    name: 'update_session',
    title: 'Update session',
    description:
      'Updates a session. Send only the fields to change; participantIds and contentImages replace the current lists when given. The hosting part must stay in the same generation.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'sessions' }],
    input: z.object({
      sessionId,
      ...Object.fromEntries(
        Object.entries(sessionFields).map(([key, schema]) => [
          key,
          schema.optional(),
        ])
      ),
    }),
    run: async (actor, { sessionId: id, ...patch }) => {
      const converted = toServiceFields(patch)
      if ('error' in converted) return fail('VALIDATION', converted.error!)

      const current = await getSessionDetail(actor, id)
      if (!current.ok) return current

      // 날짜가 비어 있는 옛 세션은 두 시각을 함께 받아야 검증을 통과한다.
      const fields = converted.fields ?? {}
      if (
        (current.data.startAt === null && !('startAt' in fields)) ||
        (current.data.endAt === null && !('endAt' in fields))
      ) {
        return fail(
          'VALIDATION',
          'This session has no start or end time yet. Include both startAt and endAt in the update.'
        )
      }

      return updateSession(
        actor,
        id,
        mergePatch(sessionToInput(current.data), fields)
      )
    },
    targetId: idOf,
  }),
  defineTool({
    name: 'register_session',
    title: 'Register for session',
    description:
      'Registers you for an open session that has not ended. Fails when the session is full.',
    scope: 'gyms:write',
    gate: [{ action: 'get', resource: 'sessionsPage' }],
    input: z.object({ sessionId }),
    run: (actor, input) => registerForSession(actor, input.sessionId),
    targetId: (data) => (data as { sessionId?: string } | null)?.sessionId,
  }),
  defineTool({
    name: 'unregister_session',
    title: 'Cancel session registration',
    description: 'Cancels your registration for a session that has not ended.',
    scope: 'gyms:write',
    gate: [{ action: 'get', resource: 'sessionsPage' }],
    input: z.object({ sessionId }),
    run: (actor, input) => unregisterFromSession(actor, input.sessionId),
    targetId: (data) => (data as { sessionId?: string } | null)?.sessionId,
  }),
  defineTool({
    name: 'remove_session_participant',
    title: 'Remove session participant',
    description: 'Removes a participant from a session you wrote or manage.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'sessions' }],
    input: z.object({ sessionId, userId: z.string() }),
    run: (actor, input) =>
      removeSessionParticipant(actor, input.sessionId, input.userId),
    targetId: (data) => (data as { sessionId?: string } | null)?.sessionId,
  }),
  defineTool({
    name: 'delete_session',
    title: 'Delete session',
    description: 'Deletes a session and its images. This cannot be undone.',
    scope: 'gyms:admin',
    gate: [{ action: 'delete', resource: 'sessions' }],
    input: z.object({ sessionId }),
    run: (actor, input) => deleteSession(actor, input.sessionId),
    targetId: idOf,
  }),
]
