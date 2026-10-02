import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findProject, canAccessGeneration, dbUpdate, dbDelete, dbInsert } =
  vi.hoisted(() => ({
    findProject: vi.fn(),
    canAccessGeneration: vi.fn(),
    dbUpdate: vi.fn(),
    dbDelete: vi.fn(),
    dbInsert: vi.fn(),
  }))

vi.mock('@/db', () => ({
  db: {
    query: { projects: { findFirst: findProject } },
    update: dbUpdate,
    delete: dbDelete,
    insert: dbInsert,
  },
}))

vi.mock('@/lib/server/services/admin/authorize', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/authorize')
  >()),
  canAccessGeneration,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateProjectPublicCache: vi.fn(),
}))

import {
  createProject,
  deleteProject,
  updateProject,
} from '@/lib/server/services/admin/projects'
import type { Actor } from '@/lib/server/services/admin/types'

const PID = '00000000-0000-4000-8000-000000000000'
const member: Actor = {
  userId: 'me',
  role: 'MEMBER',
  scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
  via: 'mcp',
}

const validProject = {
  name: 'Project',
  nameKo: '프로젝트',
  description: 'desc',
  descriptionKo: '설명',
  content: 'content',
  contentKo: '내용',
  mainImage: 'https://cdn.example/projects/a.png',
  contentImages: ['https://cdn.example/projects/b.png'],
  participants: ['me'],
  generationId: '7',
  repoUrl: null,
  demoUrl: null,
  tags: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  canAccessGeneration.mockResolvedValue(true)
})

describe('projects service', () => {
  it('forbids MEMBER from updating a project owned by someone else', async () => {
    findProject.mockResolvedValue({
      id: PID,
      authorId: 'other',
      generationId: 1,
    })
    await expect(
      updateProject(member, PID, validProject)
    ).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('forbids MEMBER from deleting even their own project', async () => {
    findProject.mockResolvedValue({ id: PID, authorId: 'me', generationId: 1 })
    await expect(deleteProject(member, PID)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('forbids creating a project in an inaccessible generation', async () => {
    canAccessGeneration.mockResolvedValue(false)
    await expect(createProject(member, validProject)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(canAccessGeneration).toHaveBeenCalledWith(member, 7)
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it('returns VALIDATION with field errors for bad input', async () => {
    const result = await createProject(member, {
      ...validProject,
      participants: [],
    })
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(result.ok ? {} : result.fieldErrors).toHaveProperty('participants')
  })

  it('returns NOT_FOUND for an unknown project', async () => {
    findProject.mockResolvedValue(undefined)
    await expect(
      updateProject(member, PID, validProject)
    ).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })
})
