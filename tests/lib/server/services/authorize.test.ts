import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({ default: {} }))

import {
  authorize,
  requiredScopeFor,
  roleCouldEver,
} from '@/lib/server/services/admin/authorize'
import type { Actor, Role } from '@/lib/server/services/admin/types'

const mcp = (role: Role, scopes: Actor['scopes'], userId = 'u1'): Actor => ({
  userId,
  role,
  scopes,
  via: 'mcp',
})

describe('requiredScopeFor', () => {
  it.each([
    ['get', 'sessionsPage', 'gyms:read'],
    ['post', 'sessions', 'gyms:write'],
    ['put', 'projects', 'gyms:write'],
    ['delete', 'sessions', 'gyms:admin'],
    ['put', 'membersRole', 'gyms:admin'],
  ] as const)('%s %s → %s', (action, resource, scope) => {
    expect(requiredScopeFor(action, resource)).toBe(scope)
  })
})

describe('authorize', () => {
  it('LEAD with read-only token cannot write', () => {
    const result = authorize(mcp('LEAD', ['gyms:read']), 'post', 'sessions')
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('MEMBER can update own project but not others', () => {
    const actor = mcp('MEMBER', ['gyms:read', 'gyms:write'])
    expect(authorize(actor, 'put', 'projects', 'u1').ok).toBe(true)
    expect(authorize(actor, 'put', 'projects', 'u2')).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
  })

  it('web session actor skips scope checks', () => {
    const web: Actor = {
      userId: 'u1',
      role: 'CORE',
      scopes: 'session',
      via: 'web',
    }
    expect(authorize(web, 'delete', 'sessions').ok).toBe(true)
  })

  it('UNVERIFIED can do nothing', () => {
    const actor = mcp('UNVERIFIED', ['gyms:read', 'gyms:write', 'gyms:admin'])
    expect(authorize(actor, 'get', 'sessionsPage').ok).toBe(false)
  })
})

describe('roleCouldEver', () => {
  it('ignores ownership for tool listing', () => {
    expect(roleCouldEver('MEMBER', 'put', 'projects')).toBe(true)
    expect(roleCouldEver('MEMBER', 'delete', 'projects')).toBe(false)
    expect(roleCouldEver('CORE', 'put', 'membersRole')).toBe(false)
    expect(roleCouldEver('ALUMNUS', 'post', 'projects')).toBe(false)
  })
})
