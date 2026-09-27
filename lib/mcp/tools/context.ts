import { z } from 'zod'
import { defineTool } from '@/lib/mcp/registry'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'
import { ok } from '@/lib/server/services/admin/types'

export const whoami = defineTool({
  name: 'whoami',
  title: 'Who am I',
  description:
    'Returns the signed-in user id, role, the scopes granted to this connection and the generations the user can access. Call this first to learn which generationId values are valid.',
  scope: 'gyms:read',
  gate: [{ action: 'get', resource: 'adminPage' }],
  input: z.object({}),
  run: async (actor) =>
    ok({
      userId: actor.userId,
      role: actor.role,
      scopes: actor.scopes,
      generations: await loadAccessibleGenerations(actor),
    }),
})
