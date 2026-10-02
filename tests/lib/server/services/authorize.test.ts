import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({ db: {} }))

import {
  authorize,
  canChangeMemberEmail,
  canEditMember,
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

describe('canEditMember', () => {
  const web = (role: Role, userId = 'me'): Actor => ({
    userId,
    role,
    scopes: 'session',
    via: 'web',
  })

  it('lets anyone edit their own record', () => {
    expect(canEditMember(web('MEMBER'), { id: 'me', role: 'MEMBER' })).toBe(
      true
    )
  })

  it('lets LEAD edit anyone', () => {
    expect(canEditMember(web('LEAD'), { id: 'x', role: 'LEAD' })).toBe(true)
  })

  it.each([
    ['MEMBER', true],
    ['ALUMNUS', true],
    ['UNVERIFIED', true],
    ['CORE', false],
    ['LEAD', false],
  ] as const)('CORE editing a %s → %s', (role, allowed) => {
    expect(canEditMember(web('CORE'), { id: 'x', role })).toBe(allowed)
  })

  it('never lets MEMBER edit someone else', () => {
    expect(canEditMember(web('MEMBER'), { id: 'x', role: 'ALUMNUS' })).toBe(
      false
    )
  })
})

describe('canChangeMemberEmail', () => {
  it('allows only the owner or a LEAD', () => {
    const actor = (role: Role): Actor => ({
      userId: 'me',
      role,
      scopes: 'session',
      via: 'web',
    })
    expect(canChangeMemberEmail(actor('MEMBER'), 'me')).toBe(true)
    expect(canChangeMemberEmail(actor('CORE'), 'x')).toBe(false)
    expect(canChangeMemberEmail(actor('LEAD'), 'x')).toBe(true)
  })
})
