import { z } from 'zod'
import { defineTool, idOf } from '@/lib/mcp/registry'
import { patchWith } from '@/lib/mcp/tools/common'
import {
  createGeneration,
  deleteGeneration,
  generationToInput,
  getGenerationDetail,
  listGenerations,
  updateGeneration,
} from '@/lib/server/services/admin/generations'

const generationId = z.number().int().positive().describe('Generation id.')
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Date as YYYY-MM-DD.')
const name = z
  .string()
  .describe(
    'URL-safe generation name, e.g. "25-26" (letters, numbers, single hyphens).'
  )

export const generationTools = [
  defineTool({
    name: 'list_generations',
    title: 'List generations',
    description: 'Lists the generations you can access, newest first.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'adminPage' }],
    input: z.object({}),
    run: (actor) => listGenerations(actor),
  }),
  defineTool({
    name: 'get_generation',
    title: 'Get generation',
    description: 'Returns a generation with its parts and their members.',
    scope: 'gyms:read',
    gate: [{ action: 'get', resource: 'adminPage' }],
    input: z.object({ generationId }),
    run: (actor, input) => getGenerationDetail(actor, input.generationId),
  }),
  defineTool({
    name: 'create_generation',
    title: 'Create generation',
    description: 'Creates a generation (LEAD only).',
    scope: 'gyms:write',
    gate: [{ action: 'post', resource: 'generations' }],
    input: z.object({
      name,
      startDate: date,
      endDate: date.nullable().optional(),
    }),
    run: (actor, input) =>
      createGeneration(actor, { ...input, endDate: input.endDate ?? null }),
    targetId: idOf,
  }),
  defineTool({
    name: 'update_generation',
    title: 'Update generation',
    description:
      'Updates a generation (LEAD only). Send only the fields to change.',
    scope: 'gyms:write',
    gate: [{ action: 'put', resource: 'generations' }],
    input: z.object({
      generationId,
      name: name.optional(),
      startDate: date.optional(),
      endDate: date.nullable().optional(),
    }),
    run: (actor, { generationId: id, ...patch }) =>
      patchWith(
        getGenerationDetail(actor, id),
        generationToInput,
        patch,
        (input) => updateGeneration(actor, id, input)
      ),
    targetId: idOf,
  }),
  defineTool({
    name: 'delete_generation',
    title: 'Delete generation',
    description:
      'Deletes a generation and, through cascading deletes, its parts and projects (LEAD only). This cannot be undone.',
    scope: 'gyms:admin',
    gate: [{ action: 'delete', resource: 'generations' }],
    input: z.object({ generationId }),
    run: (actor, input) => deleteGeneration(actor, input.generationId),
    targetId: idOf,
  }),
]
