import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/server/fetcher/admin/get-user-role', () => ({
  getUserRole: vi.fn(),
}))

import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import { hasPermission } from '@/lib/server/permission/has-permission'

const mockedGetUserRole = vi.mocked(getUserRole)

describe('hasPermission', () => {
  beforeEach(() => {
    mockedGetUserRole.mockReset()
  })

  it('returns false when userId is not provided', async () => {
    const result = await hasPermission(undefined, 'get', 'adminPage')

    expect(result).toBe(false)
    expect(mockedGetUserRole).not.toHaveBeenCalled()
  })

  it('returns permission by fetched role', async () => {
    mockedGetUserRole.mockResolvedValue('LEAD')

    const result = await hasPermission('lead-1', 'delete', 'parts')

    expect(result).toBe(true)
    expect(mockedGetUserRole).toHaveBeenCalledWith('lead-1')
  })

  it('denies restricted resource for member role', async () => {
    mockedGetUserRole.mockResolvedValue('MEMBER')

    const result = await hasPermission('member-1', 'get', 'membersPage')

    expect(result).toBe(false)
  })
})
