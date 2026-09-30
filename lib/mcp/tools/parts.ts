import { z } from 'zod'
import { defineTool, idOf } from '@/lib/mcp/registry'
import {
  generationArg,
  listArgs,
  listPage,
  patchWith,
} from '@/lib/mcp/tools/common'
import {
  createPart,
  deletePart,
  getPartDetail,
  listParts,
  partToInput,
  updatePart,
} from '@/lib/server/services/admin/parts'

const partId = z.number().int().positive().describe('Part id.')
const memberIds = z
  .array(z.string())
  .describe('User ids of the part members (from list_members).')
const doubleBoardMemberIds = z
  .array(z.string())
  .describe(
    'User ids of members whose primary part is elsewhere (double board).'
  )
const partFields = {
  name: z.string().describe('Part name, e.g. "Web".'),
  description: z.string().nullable().describe('Short description.'),
  displayOrder: z
    .number()
    .int()
    .describe('Sort order on the public site (lower first).'),
}

export const partTools = [
  defineTool({
    name: 'list_parts',
    title: 'List parts',
    description: 'Lists parts with their member counts.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'partsPage' }],
    input: z.object(listArgs),
    run: (actor, input) =>
      listPage(
        listParts(actor, {
          generation: generationArg(actor, input.generationId),
        }),
        input.limit,
        input.cursor
      ),
  }),
  defineTool({
    name: 'get_part',
    title: 'Get part',
    description: 'Returns a part with its members and their membership type.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'partsPage' }],
    input: z.object({ partId }),
    run: (actor, input) => getPartDetail(actor, input.partId),
  }),
  defineTool({
    name: 'create_part',
    title: 'Create part',
    description: 'Creates a part in a generation you manage.',
    scope: 'gyms:write',
    gate: [{ action: 'post', resource: 'parts' }],
    input: z.object({
      generationId: z.number().int().positive(),
      name: partFields.name,
      description: partFields.description.optional(),
      displayOrder: partFields.displayOrder.optional(),
      memberIds: memberIds.default([]),
      doubleBoardMemberIds: doubleBoardMemberIds.default([]),
    }),
    run: (actor, input) =>
      createPart(actor, {
        name: input.name,
        description: input.description ?? null,
        displayOrder: input.displayOrder,
        generationId: input.generationId,
        membersList: input.memberIds,
        doubleBoardMembersList: input.doubleBoardMemberIds,
      }),
    targetId: idOf,
  }),
  defineTool({
    name: 'update_part',
    title: 'Update part',
    description:
      'Updates a part. Send only the fields to change; member lists replace the current Primary/Secondary members when given.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'parts' }],
    input: z.object({
      partId,
      name: partFields.name.optional(),
      description: partFields.description.optional(),
      displayOrder: partFields.displayOrder.optional(),
      memberIds: memberIds.optional(),
      doubleBoardMemberIds: doubleBoardMemberIds.optional(),
    }),
    run: (
      actor,
      {
        partId: id,
        memberIds: members,
        doubleBoardMemberIds: doubles,
        ...patch
      }
    ) =>
      patchWith(
        getPartDetail(actor, id),
        partToInput,
        {
          ...patch,
          membersList: members,
          doubleBoardMembersList: doubles,
        },
        (input) => updatePart(actor, id, input)
      ),
    targetId: idOf,
  }),
  defineTool({
    name: 'delete_part',
    title: 'Delete part',
    description: 'Deletes a part (LEAD only). This cannot be undone.',
    scope: 'gyms:admin',
    gate: [{ action: 'delete', resource: 'parts' }],
    input: z.object({ partId }),
    run: (actor, input) => deletePart(actor, input.partId),
    targetId: idOf,
  }),
]
