import { describe, expect, it } from 'vitest'
import { isAllowed, PERMISSION_POLICY } from '@/lib/server/permission/policy'

describe('permission policy', () => {
  it('grants member ownership-based permissions for own data', () => {
    const own = { isOwner: true }

    expect(isAllowed('MEMBER', 'put', 'members', own)).toBe(true)
    expect(isAllowed('MEMBER', 'delete', 'members', own)).toBe(true)
    expect(isAllowed('MEMBER', 'put', 'projects', own)).toBe(true)
  })

  it('denies member ownership-based permissions for other users data', () => {
    expect(isAllowed('MEMBER', 'put', 'members')).toBe(false)
    expect(isAllowed('MEMBER', 'delete', 'members')).toBe(false)
    expect(isAllowed('MEMBER', 'put', 'projects')).toBe(false)
  })

  it('lets members create projects regardless of ownership', () => {
    expect(isAllowed('MEMBER', 'post', 'projects')).toBe(true)
  })

  it('grants lead full permissions', () => {
    expect(isAllowed('LEAD', 'get', 'generationsPage')).toBe(true)
    expect(isAllowed('LEAD', 'post', 'membersRole')).toBe(true)
    expect(isAllowed('LEAD', 'delete', 'parts')).toBe(true)
  })

  it('keeps generation management and role changes away from core', () => {
    expect(isAllowed('CORE', 'get', 'generationsPage')).toBe(false)
    expect(isAllowed('CORE', 'put', 'membersRole')).toBe(false)
    expect(isAllowed('CORE', 'delete', 'parts')).toBe(false)
    expect(isAllowed('CORE', 'delete', 'sessions')).toBe(true)
  })

  it('denies unverified all permissions, even on own data', () => {
    const own = { isOwner: true }

    expect(isAllowed('UNVERIFIED', 'get', 'adminPage', own)).toBe(false)
    expect(isAllowed('UNVERIFIED', 'post', 'projects', own)).toBe(false)
    expect(isAllowed('UNVERIFIED', 'put', 'members', own)).toBe(false)
    expect(isAllowed('UNVERIFIED', 'delete', 'parts', own)).toBe(false)
    expect(PERMISSION_POLICY.UNVERIFIED).toEqual({})
  })

  it('lets every verified role reach the shared admin pages', () => {
    for (const role of ['MEMBER', 'CORE', 'LEAD', 'ALUMNUS'] as const) {
      expect(isAllowed(role, 'get', 'adminPage')).toBe(true)
      expect(isAllowed(role, 'get', 'profilePage')).toBe(true)
    }
  })

  it('limits the public cache refresh to core and lead', () => {
    expect(isAllowed('LEAD', 'put', 'publicCache')).toBe(true)
    expect(isAllowed('CORE', 'put', 'publicCache')).toBe(true)
    expect(isAllowed('MEMBER', 'put', 'publicCache', { isOwner: true })).toBe(
      false
    )
    expect(isAllowed('ALUMNUS', 'put', 'publicCache')).toBe(false)
  })
})
