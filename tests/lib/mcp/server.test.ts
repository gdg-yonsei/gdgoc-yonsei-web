import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

const { withAudit } = vi.hoisted(() => ({
  withAudit: vi.fn(
    async (_actor: unknown, _meta: unknown, _input: unknown, run: () => Promise<unknown>) => run()
  ),
}))
vi.mock('@/lib/mcp/audit', () => ({ withAudit }))
vi.mock('@/db', () => ({ default: {} }))

import { defineTool } from '@/lib/mcp/registry'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import { createGymsMcpHandler } from '@/lib/mcp/server'
import { fail, ok, type Actor } from '@/lib/server/services/admin/types'

const readTool = defineTool({
  name: 'read_thing',
  title: 'Read',
  description: 'read',
  scope: 'gyms:read',
  gate: [{ action: 'get', resource: 'sessionsPage' }],
  input: z.object({ id: z.string() }),
  run: async (_actor, input) => ok({ id: input.id }),
})
const writeTool = defineTool({
  name: 'write_thing',
  title: 'Write',
  description: 'write',
  scope: 'gyms:write',
  gate: [{ action: 'post', resource: 'sessions' }],
  input: z.object({}),
  run: async () => fail('FORBIDDEN', 'nope'),
})
const crashTool = defineTool({
  name: 'crash_thing',
  title: 'Crash',
  description: 'crash',
  scope: 'gyms:read',
  gate: [{ action: 'get', resource: 'sessionsPage' }],
  input: z.object({}),
  run: async () => {
    throw new Error('secret database detail')
  },
})

const handler = createGymsMcpHandler([readTool, writeTool, crashTool])

async function rpc(actor: Actor, method: string, params: object = {}) {
  const response = await handler.fetch(
    new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'mcp-protocol-version': '2025-06-18',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
    {
      authInfo: {
        token: 't',
        clientId: 'c',
        scopes: actor.scopes === 'session' ? [] : actor.scopes,
        expiresAt: Math.floor(Date.now() / 1000) + 60,
        extra: { actor },
      },
    }
  )
  const text = await response.text()
  const json = text.startsWith('{')
    ? JSON.parse(text)
    : JSON.parse(
        text
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5))
          .join('')
      )
  return json
}

const member: Actor = { userId: 'm', role: 'MEMBER', scopes: ['gyms:read', 'gyms:write'], via: 'mcp' }
const core: Actor = { userId: 'c', role: 'CORE', scopes: ['gyms:read', 'gyms:write'], via: 'mcp' }

describe('GYMS MCP server', () => {
  beforeEach(() => {
    withAudit.mockClear()
  })

  it('lists only the tools the actor may use', async () => {
    const memberTools = (await rpc(member, 'tools/list')).result.tools.map((t: { name: string }) => t.name)
    expect(memberTools.sort()).toEqual(['crash_thing', 'read_thing'])
    const coreTools = (await rpc(core, 'tools/list')).result.tools
    expect(coreTools.map((t: { name: string }) => t.name).sort()).toEqual([
      'crash_thing',
      'read_thing',
      'write_thing',
    ])
    const write = coreTools.find((t: { name: string }) => t.name === 'write_thing')
    expect(write.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false })
  })

  it('returns structured results for read tools without auditing', async () => {
    const response = await rpc(member, 'tools/call', { name: 'read_thing', arguments: { id: 'x' } })
    expect(response.result.structuredContent).toEqual({ result: { id: 'x' } })
    expect(withAudit).not.toHaveBeenCalled()
  })

  it('maps service failures to isError and audits write tools', async () => {
    const response = await rpc(core, 'tools/call', { name: 'write_thing', arguments: {} })
    expect(response.result.isError).toBe(true)
    expect(response.result.structuredContent.error).toEqual({ code: 'FORBIDDEN', message: 'nope' })
    expect(withAudit).toHaveBeenCalledTimes(1)
  })

  it('hides unexpected exception details', async () => {
    const response = await rpc(member, 'tools/call', { name: 'crash_thing', arguments: {} })
    expect(response.result.isError).toBe(true)
    expect(JSON.stringify(response)).not.toContain('secret database detail')
    expect(response.result.structuredContent.error.code).toBe('INTERNAL')
  })

  it('does not let a member call a hidden tool', async () => {
    const response = await rpc(member, 'tools/call', { name: 'write_thing', arguments: {} })
    expect(response.error ?? response.result?.isError).toBeTruthy()
    expect(withAudit).not.toHaveBeenCalled()
  })

  it('serves JSON schemas for every real tool', async () => {
    const full = createGymsMcpHandler(ALL_TOOLS)
    const lead: Actor = {
      userId: 'l',
      role: 'LEAD',
      scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
      via: 'mcp',
    }
    const response = await full.fetch(
      new Request('http://localhost/api/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
          'mcp-protocol-version': '2025-06-18',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      }),
      {
        authInfo: {
          token: 't',
          clientId: 'c',
          scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
          expiresAt: Math.floor(Date.now() / 1000) + 60,
          extra: { actor: lead },
        },
      }
    )
    const text = await response.text()
    const body = JSON.parse(
      text.startsWith('{')
        ? text
        : text
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5))
            .join('')
    )
    const tools = body.result.tools as { name: string; inputSchema: { type: string; properties?: Record<string, unknown> } }[]
    expect(tools.map((tool) => tool.name).sort()).toEqual(
      ALL_TOOLS.map((tool) => tool.name).sort()
    )
    for (const tool of tools) {
      expect(tool.inputSchema.type, tool.name).toBe('object')
    }
    const update = tools.find((tool) => tool.name === 'update_session')!
    expect(Object.keys(update.inputSchema.properties ?? {})).toEqual(
      expect.arrayContaining(['sessionId', 'name', 'startAt', 'participantIds'])
    )
  })
})
