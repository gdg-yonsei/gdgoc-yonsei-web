import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  listMembers: vi.fn(),
  getMemberDetail: vi.fn(),
  getMemberForEdit: vi.fn(),
  updateMember: vi.fn(),
  memberToInput: vi.fn(),
  updateMemberRole: vi.fn(),
  approveMember: vi.fn(),
  deleteMember: vi.fn(),
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  setSessionNotificationEmail: vi.fn(),
  getPartDetail: vi.fn(),
  updatePart: vi.fn(),
  partToInput: vi.fn(),
}))

vi.mock('@/db', () => ({ default: {} }))
vi.mock('@/lib/server/services/admin/members', () => services)
vi.mock('@/lib/server/services/admin/profile', () => services)
vi.mock('@/lib/server/services/admin/parts', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/parts')
  >()),
  getPartDetail: services.getPartDetail,
  updatePart: services.updatePart,
}))

import { ALL_TOOLS } from '@/lib/mcp/tools'
import type { ToolDefinition } from '@/lib/mcp/registry'
import type { Actor } from '@/lib/server/services/admin/types'

const tool = (name: string) =>
  ALL_TOOLS.find((candidate) => candidate.name === name) as ToolDefinition
const lead: Actor = {
  userId: 'lead',
  role: 'LEAD',
  scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
  via: 'mcp',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('member tools', () => {
  it('rejects an unknown role for update_member_role', () => {
    const parsed = tool('update_member_role').input.safeParse({
      userId: 'u',
      role: 'ADMIN',
    })
    expect(parsed.success).toBe(false)
  })

  it('paginates list_members with a cursor', async () => {
    services.listMembers.mockResolvedValue({
      ok: true,
      data: Array.from({ length: 5 }, (_, index) => ({ id: `m${index}` })),
    })
    const input = tool('list_members').input.parse({ limit: 2, cursor: '2' })
    const result = await tool('list_members').run(lead, input)
    expect(result).toEqual({
      ok: true,
      data: { items: [{ id: 'm2' }, { id: 'm3' }], nextCursor: '4', total: 5 },
    })
    expect(services.listMembers).toHaveBeenCalledWith(lead, {
      generation: 'all',
      role: undefined,
      query: undefined,
    })
  })

  it('update_member merges the patch into the full (unredacted) record', async () => {
    services.getMemberForEdit.mockResolvedValue({ ok: true, data: { id: 'u' } })
    services.memberToInput.mockReturnValue({
      name: 'Old',
      email: 'old@x.com',
      major: 'CS',
      role: null,
    })
    services.updateMember.mockResolvedValue({ ok: true, data: { id: 'u' } })

    const input = tool('update_member').input.parse({
      memberId: 'u',
      major: 'EE',
    })
    await tool('update_member').run(lead, input)

    expect(services.updateMember).toHaveBeenCalledWith(lead, 'u', {
      name: 'Old',
      email: 'old@x.com',
      major: 'EE',
      role: null,
    })
  })

  it('update_my_profile can toggle the notification email alone', async () => {
    services.setSessionNotificationEmail.mockResolvedValue({
      ok: true,
      data: { sessionNotiEmail: false },
    })
    const input = tool('update_my_profile').input.parse({
      sessionNotificationEmail: false,
    })
    const result = await tool('update_my_profile').run(lead, input)
    expect(services.setSessionNotificationEmail).toHaveBeenCalledWith(
      lead,
      false
    )
    expect(services.updateMyProfile).not.toHaveBeenCalled()
    expect(result).toMatchObject({ ok: true })
  })
})

describe('part tools', () => {
  it('update_part keeps existing members when the patch omits them', async () => {
    services.getPartDetail.mockResolvedValue({
      ok: true,
      data: {
        name: 'Web',
        description: null,
        displayOrder: 1,
        generationsId: 3,
        members: [
          { id: 'a', userType: 'Primary' },
          { id: 'b', userType: 'Secondary' },
        ],
      },
    })
    services.updatePart.mockResolvedValue({ ok: true, data: { id: 7 } })

    const input = tool('update_part').input.parse({
      partId: 7,
      name: 'Frontend',
    })
    await tool('update_part').run(lead, input)

    expect(services.updatePart).toHaveBeenCalledWith(lead, 7, {
      name: 'Frontend',
      description: null,
      displayOrder: 1,
      generationId: 3,
      membersList: ['a'],
      doubleBoardMembersList: ['b'],
    })
  })
})

describe('tool metadata', () => {
  it('marks destructive tools as admin scope', () => {
    for (const name of [
      'delete_generation',
      'delete_part',
      'delete_member',
      'update_member_role',
      'approve_member',
    ]) {
      expect(tool(name).scope, name).toBe('gyms:admin')
    }
  })
})
