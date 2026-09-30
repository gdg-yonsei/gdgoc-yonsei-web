import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  getSessionDetail: vi.fn(),
  updateSession: vi.fn(),
  createSession: vi.fn(),
  listSessions: vi.fn(),
  getProjectDetail: vi.fn(),
  updateProject: vi.fn(),
  createProject: vi.fn(),
}))

vi.mock('@/db', () => ({ default: {} }))
vi.mock('@/lib/server/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/env')>()),
  getImageEnv: () => ({ NEXT_PUBLIC_IMAGE_URL: 'https://cdn.example/' }),
}))
vi.mock('@/lib/server/services/admin/sessions', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/sessions')
  >()),
  getSessionDetail: services.getSessionDetail,
  updateSession: services.updateSession,
  createSession: services.createSession,
  listSessions: services.listSessions,
}))
vi.mock('@/lib/server/services/admin/projects', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/projects')
  >()),
  getProjectDetail: services.getProjectDetail,
  updateProject: services.updateProject,
  createProject: services.createProject,
}))

import type { ToolDefinition } from '@/lib/mcp/registry'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import type { Actor } from '@/lib/server/services/admin/types'

const tool = (name: string) =>
  ALL_TOOLS.find((candidate) => candidate.name === name) as ToolDefinition
const core: Actor = {
  userId: 'core',
  role: 'CORE',
  scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
  via: 'mcp',
}
const SID = '00000000-0000-4000-8000-000000000001'

const sessionDetail = {
  id: SID,
  name: 'Old',
  nameKo: '옛',
  description: 'd',
  descriptionKo: 'ㄷ',
  mainImage: '/session-default.png',
  images: ['https://cdn.example/sessions/a.png'],
  location: 'Room',
  locationKo: '방',
  maxCapacity: 20,
  internalOpen: true,
  publicOpen: false,
  startAt: new Date('2027-01-01T10:00:00Z'),
  endAt: new Date('2027-01-01T12:00:00Z'),
  partId: 3,
  type: 'Part Session',
  category: 'tech_talk',
  displayOnWebsite: true,
  participants: [{ id: 'a' }, { id: 'b' }],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('session tools', () => {
  it('update_session without participantIds keeps existing participants and images', async () => {
    services.getSessionDetail.mockResolvedValue({
      ok: true,
      data: sessionDetail,
    })
    services.updateSession.mockResolvedValue({ ok: true, data: { id: SID } })

    const input = tool('update_session').input.parse({
      sessionId: SID,
      name: 'New name',
    })
    await tool('update_session').run(core, input)

    expect(services.updateSession).toHaveBeenCalledWith(
      core,
      SID,
      expect.objectContaining({
        name: 'New name',
        participantId: ['a', 'b'],
        contentImages: ['https://cdn.example/sessions/a.png'],
        partId: '3',
      })
    )
  })

  it('update_session converts offset times to Seoul wall clock', async () => {
    services.getSessionDetail.mockResolvedValue({
      ok: true,
      data: sessionDetail,
    })
    services.updateSession.mockResolvedValue({ ok: true, data: { id: SID } })

    const input = tool('update_session').input.parse({
      sessionId: SID,
      startAt: '2027-01-01T01:00:00Z',
    })
    await tool('update_session').run(core, input)

    const sent = services.updateSession.mock.calls[0]![2] as { startAt: Date }
    expect(sent.startAt.toISOString()).toBe('2027-01-01T10:00:00.000Z')
  })

  it('create_session reports an invalid time as a validation error', async () => {
    const input = tool('create_session').input.parse({
      name: 'S',
      nameKo: '에스',
      description: 'd',
      descriptionKo: 'ㄷ',
      location: 'L',
      locationKo: '엘',
      startAt: 'next friday',
      endAt: '2027-01-01T12:00',
      maxCapacity: 10,
      partId: 3,
    })
    await expect(
      tool('create_session').run(core, input)
    ).resolves.toMatchObject({
      ok: false,
      code: 'VALIDATION',
    })
    expect(services.createSession).not.toHaveBeenCalled()
  })

  it('list_sessions can keep only sessions open for registration', async () => {
    services.listSessions.mockResolvedValue({
      ok: true,
      data: [
        {
          id: '1',
          internalOpen: true,
          publicOpen: false,
          endAt: new Date('2999-01-01T00:00:00Z'),
        },
        {
          id: '2',
          internalOpen: false,
          publicOpen: false,
          endAt: new Date('2999-01-01T00:00:00Z'),
        },
        {
          id: '3',
          internalOpen: true,
          publicOpen: true,
          endAt: new Date('2000-01-01T00:00:00Z'),
        },
      ],
    })
    const input = tool('list_sessions').input.parse({
      openForRegistration: true,
    })
    const result = await tool('list_sessions').run(core, input)
    expect(
      result.ok &&
        (result.data as { items: { id: string }[] }).items.map((s) => s.id)
    ).toEqual(['1'])
  })
})

describe('project tools', () => {
  it('create_project sends the generation id in the web form shape', async () => {
    services.createProject.mockResolvedValue({ ok: true, data: { id: 'p' } })
    const input = tool('create_project').input.parse({
      generationId: 7,
      name: 'P',
      nameKo: '피',
      description: 'd',
      descriptionKo: 'ㄷ',
      content: 'c',
      contentKo: 'ㅋ',
      mainImage: 'https://cdn.example/projects/m.png',
      contentImages: ['https://cdn.example/projects/c.png'],
      participantIds: ['core'],
    })
    await tool('create_project').run(core, input)
    expect(services.createProject).toHaveBeenCalledWith(
      core,
      expect.objectContaining({
        generationId: '7',
        participants: ['core'],
        tags: [],
        repoUrl: null,
      })
    )
  })
})

describe('image fields', () => {
  const base = {
    name: 'S',
    nameKo: '에스',
    description: 'd',
    descriptionKo: 'ㄷ',
    location: 'L',
    locationKo: '엘',
    startAt: '2027-01-01T10:00',
    endAt: '2027-01-01T12:00',
    maxCapacity: 10,
    partId: 3,
  }

  it('accept only uploaded R2 images under the matching prefix', () => {
    const input = tool('create_session').input
    expect(
      input.safeParse({
        ...base,
        mainImage: 'https://cdn.example/sessions/a.png',
      }).success
    ).toBe(true)
    expect(
      input.safeParse({
        ...base,
        mainImage: 'https://evil.example/sessions/a.png',
      }).success
    ).toBe(false)
    expect(
      input.safeParse({
        ...base,
        contentImages: ['https://cdn.example/projects/a.png'],
      }).success
    ).toBe(false)
  })

  it('reject foreign images in project and profile updates', () => {
    expect(
      tool('update_project').input.safeParse({
        projectId: '00000000-0000-4000-8000-000000000001',
        mainImage: 'https://example.com/x.png',
      }).success
    ).toBe(false)
    expect(
      tool('update_my_profile').input.safeParse({
        profileImage: 'https://cdn.example/sessions/a.png',
      }).success
    ).toBe(false)
    expect(
      tool('update_my_profile').input.safeParse({
        profileImage: 'https://cdn.example/users/a.png',
      }).success
    ).toBe(true)
  })
})
