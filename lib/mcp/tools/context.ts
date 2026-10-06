import 'server-only'

import { z } from 'zod'
import { defineTool } from '@/lib/mcp/registry'
import { loadAccessibleGenerations } from '@/lib/server/services/admin/authorize'
import { ok } from '@/lib/server/services/admin/types'

/** 가장 먼저 부르도록 안내하는 도구. 다른 도구에 쓸 수 있는 `generationId`를 알려 준다. */
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
