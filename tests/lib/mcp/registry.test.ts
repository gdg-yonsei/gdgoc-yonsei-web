import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({ default: {} }))

import { isToolVisible } from '@/lib/mcp/registry'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import type { Actor, Role, Scope } from '@/lib/server/services/admin/types'

const actor = (role: Role, scopes: Scope[]): Actor => ({
  userId: 'u',
  role,
  scopes,
  via: 'mcp',
})
const visible = (role: Role, scopes: Scope[]) =>
  ALL_TOOLS.filter((tool) => isToolVisible(actor(role, scopes), tool))
    .map((tool) => tool.name)
    .sort()

describe('MCP tool visibility', () => {
  it('read-only tokens expose only read tools', () => {
    for (const role of ['LEAD', 'CORE', 'MEMBER', 'ALUMNUS'] as const) {
      const names = visible(role, ['gyms:read'])
      expect(names.length, role).toBeGreaterThan(0)
      for (const name of names) {
        expect(ALL_TOOLS.find((tool) => tool.name === name)!.scope).toBe(
          'gyms:read'
        )
      }
    }
  })

  it('UNVERIFIED sees nothing', () => {
    expect(visible('UNVERIFIED', ['gyms:read', 'gyms:write', 'gyms:admin'])).toEqual([])
  })

  it('every tool name is unique and snake_case', () => {
    const names = ALL_TOOLS.map((tool) => tool.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names.every((name) => /^[a-z]+(_[a-z]+)*$/.test(name))).toBe(true)
  })
})
