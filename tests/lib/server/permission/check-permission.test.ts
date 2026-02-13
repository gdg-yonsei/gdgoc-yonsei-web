import { describe, expect, it } from 'vitest'
import checkPermission from '@/lib/server/permission/check-permission'

describe('checkPermission', () => {
  it('grants member ownership-based permissions for own data', () => {
    const permissions = checkPermission('user-1', 'user-1')

    expect(permissions.MEMBER.put.members).toBe(true)
    expect(permissions.MEMBER.delete.members).toBe(true)
    expect(permissions.MEMBER.put.projects).toBe(true)
  })

  it('denies member ownership-based permissions for other users data', () => {
    const permissions = checkPermission('user-1', 'user-2')

    expect(permissions.MEMBER.put.members).toBe(false)
    expect(permissions.MEMBER.delete.members).toBe(false)
    expect(permissions.MEMBER.put.projects).toBe(false)
  })

  it('grants lead full permissions', () => {
    const permissions = checkPermission('lead-1', 'someone')

    expect(permissions.LEAD.get.generationsPage).toBe(true)
    expect(permissions.LEAD.post.membersRole).toBe(true)
    expect(permissions.LEAD.delete.parts).toBe(true)
  })

  it('denies unverified all meaningful permissions', () => {
    const permissions = checkPermission('unverified-1', 'unverified-1')

    expect(permissions.UNVERIFIED.get.adminPage).toBe(false)
    expect(permissions.UNVERIFIED.post.projects).toBe(false)
    expect(permissions.UNVERIFIED.put.members).toBe(false)
    expect(permissions.UNVERIFIED.delete.parts).toBe(false)
  })
})
