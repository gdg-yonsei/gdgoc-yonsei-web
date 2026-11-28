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

  it('refuses to store images that were not uploaded through GYMS', async () => {
    for (const images of [
      { mainImage: 'https://tracker.example/pixel.png' },
      { contentImages: ['https://cdn.example/sessions/other-kind.png'] },
      { contentImages: ['https://cdn.example/projects/b.png?v=2'] },
    ]) {
      await expect(
        createProject(member, { ...validProject, ...images })
      ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    }
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it('lets an update keep images already on the row but not add foreign ones', async () => {
    findProject.mockResolvedValue({
      id: PID,
      authorId: 'me',
      generationId: 7,
      mainImage: '/project-default.png',
      images: ['legacy/key.png'],
    })

    // 새로 들어온 외부 주소는 거절한다.
    await expect(
      updateProject(member, PID, {
        ...validProject,
        mainImage: '/project-default.png',
        contentImages: ['legacy/key.png', 'https://evil.example/x.png'],
      })
    ).resolves.toMatchObject({ ok: false, code: 'VALIDATION' })
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('denies an author outside the generation the same way for an unknown role rule', async () => {
    // ALUMNUS에게는 프로젝트 수정 규칙이 없어 조회 전에 거부된다(ID 존재 여부를 알 수 없다).
    const alumnus: Actor = { ...member, role: 'ALUMNUS' }
    await expect(
      updateProject(alumnus, PID, validProject)
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(findProject).not.toHaveBeenCalled()
  })
})
