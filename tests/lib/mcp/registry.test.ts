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

  it('MEMBER never sees delete or role tools', () => {
    const names = visible('MEMBER', ['gyms:read', 'gyms:write', 'gyms:admin'])
    expect(names).not.toContain('delete_session')
    expect(names).not.toContain('update_member_role')
    expect(names).not.toContain('list_members')
    expect(names).toContain('create_project')
    expect(names).toContain('register_session')
    expect(names).toContain('update_my_profile')
  })

  it('CORE cannot manage generations or roles but can delete sessions', () => {
    const names = visible('CORE', ['gyms:read', 'gyms:write', 'gyms:admin'])
    expect(names).not.toContain('create_generation')
    expect(names).not.toContain('update_member_role')
    expect(names).not.toContain('delete_part')
    expect(names).toContain('delete_session')
    expect(names).toContain('create_part')
  })

  it('ALUMNUS can read and edit only their profile', () => {
    const names = visible('ALUMNUS', ['gyms:read', 'gyms:write', 'gyms:admin'])
    expect(names).toContain('list_sessions')
    expect(names).toContain('update_my_profile')
    expect(names).not.toContain('create_project')
    expect(names).not.toContain('create_session')
  })
})
