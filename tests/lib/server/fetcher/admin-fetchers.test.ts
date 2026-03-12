import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNoStore = vi.fn()

const mockGenerationsFindMany = vi.fn()
const mockProjectsFindMany = vi.fn()
const mockPartsFindMany = vi.fn()
const mockPartsFindFirst = vi.fn()
const mockSessionsFindFirst = vi.fn()
const mockUsersFindFirst = vi.fn()

const mockSelect = vi.fn()
const mockSelectDistinctOn = vi.fn()

const mockDb = {
  select: mockSelect,
  selectDistinctOn: mockSelectDistinctOn,
  query: {
    generations: {
      findMany: mockGenerationsFindMany,
      findFirst: vi.fn(),
    },
    projects: {
      findMany: mockProjectsFindMany,
    },
    parts: {
      findMany: mockPartsFindMany,
      findFirst: mockPartsFindFirst,
    },
    sessions: {
      findFirst: mockSessionsFindFirst,
    },
    users: {
      findFirst: mockUsersFindFirst,
    },
  },
}

vi.mock('next/cache', () => ({
  unstable_noStore: mockNoStore,
}))

vi.mock('@/db', () => ({
  default: mockDb,
}))

function createSelectChainWithOrderByResult(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(async () => result),
  }

  return chain
}

function createDistinctOnChainWithOrderByResult(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(async () => result),
  }

  return chain
}

function createSelectChainWithLimitResult(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(async () => result),
  }

  return chain
}

describe('admin fetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches generations in descending id order without cache', async () => {
    const rows = [{ id: 2, name: '2nd' }]
    const orderBy = vi.fn().mockResolvedValue(rows)
    const from = vi.fn().mockReturnValue({ orderBy })
    mockSelect.mockReturnValue({ from })

    const { getGenerations } = await import(
      '@/lib/server/fetcher/admin/get-generations'
    )

    await expect(getGenerations()).resolves.toEqual(rows)
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(orderBy).toHaveBeenCalledTimes(1)
  })

  it('preloads generations', async () => {
    const orderBy = vi.fn().mockResolvedValue([])
    const from = vi.fn().mockReturnValue({ orderBy })
    mockSelect.mockReturnValue({ from })

    const { preloadAdminGenerations } = await import(
      '@/lib/server/fetcher/admin/get-generations'
    )
    preloadAdminGenerations()

    await vi.waitFor(() => {
      expect(orderBy).toHaveBeenCalledTimes(1)
    })
  })

  it('maps project list items with generation metadata', async () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z')
    const updatedAt = new Date('2025-01-02T00:00:00.000Z')

    mockProjectsFindMany.mockResolvedValue([
      {
        id: 'project-1',
        name: 'Project One',
        nameKo: '프로젝트 원',
        mainImage: '/project.png',
        createdAt,
        updatedAt,
        generationId: 11,
        generation: {
          name: '11th',
        },
      },
    ])

    const { getProjects } = await import('@/lib/server/fetcher/admin/get-projects')

    await expect(getProjects()).resolves.toEqual([
      {
        id: 'project-1',
        name: 'Project One',
        nameKo: '프로젝트 원',
        mainImage: '/project.png',
        createdAt,
        updatedAt,
        generationId: 11,
        generationName: '11th',
      },
    ])
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(mockProjectsFindMany).toHaveBeenCalledTimes(1)
  })

  it('maps parts into flat list items with member counts', async () => {
    mockPartsFindMany.mockResolvedValue([
      {
        id: 5,
        name: 'Frontend',
        description: 'UI work',
        displayOrder: 1,
        generationsId: 11,
        generation: {
          id: 11,
          name: '11th',
        },
        usersToParts: [{}, {}],
      },
    ])

    const { getParts } = await import('@/lib/server/fetcher/admin/get-parts')

    await expect(getParts()).resolves.toEqual([
      {
        id: 5,
        name: 'Frontend',
        description: 'UI work',
        displayOrder: 1,
        memberCount: 2,
        generationId: 11,
        generationName: '11th',
      },
    ])
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(mockPartsFindMany).toHaveBeenCalledTimes(1)
  })

  it('fetches admin members scoped by generation and keeps one row per user per generation', async () => {
    const chain = createDistinctOnChainWithOrderByResult([
      {
        id: 'user-2',
        name: 'Beta',
        part: 'Backend',
        generationId: 10,
        generation: '10th',
        role: 'MEMBER',
        firstName: 'Beta',
        firstNameKo: '베타',
        lastName: 'Park',
        lastNameKo: '박',
        image: null,
        isForeigner: false,
      },
      {
        id: 'user-1',
        name: 'Alpha',
        part: 'Frontend',
        generationId: 11,
        generation: '11th',
        role: 'CORE',
        firstName: 'Alpha',
        firstNameKo: '알파',
        lastName: 'Kim',
        lastNameKo: '김',
        image: null,
        isForeigner: false,
      },
    ])
    mockSelectDistinctOn.mockReturnValue(chain)

    const { getMembers } = await import('@/lib/server/fetcher/admin/get-members')
    const result = await getMembers()

    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      expect.objectContaining({
        id: 'user-1',
        generationId: 11,
        part: 'Frontend',
      }),
      expect.objectContaining({
        id: 'user-2',
        generationId: 10,
        part: 'Backend',
      }),
    ])
    expect(chain.from).toHaveBeenCalledTimes(1)
    expect(chain.innerJoin).toHaveBeenCalledTimes(3)
  })

  it('preloads admin members', async () => {
    const chain = createDistinctOnChainWithOrderByResult([])
    mockSelectDistinctOn.mockReturnValue(chain)

    const { preloadAdminMembers } = await import(
      '@/lib/server/fetcher/admin/get-members'
    )
    preloadAdminMembers()

    await vi.waitFor(() => {
      expect(chain.orderBy).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches sessions as flat list items with part and generation data', async () => {
    const chain = createSelectChainWithOrderByResult([
      {
        id: 'session-1',
        name: 'Session One',
        nameKo: '세션 원',
        mainImage: '/session.png',
        startAt: new Date('2025-01-01T10:00:00.000Z'),
        endAt: new Date('2025-01-01T11:00:00.000Z'),
        partId: 7,
        partName: 'Frontend',
        generationId: 11,
        generationName: '11th',
      },
    ])
    mockSelect.mockReturnValue(chain)

    const { getSessions } = await import('@/lib/server/fetcher/admin/get-sessions')

    await expect(getSessions()).resolves.toEqual([
      expect.objectContaining({
        id: 'session-1',
        partName: 'Frontend',
        generationName: '11th',
      }),
    ])
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(chain.innerJoin).toHaveBeenCalledTimes(1)
  })

  it('fetches generation detail by id without cache', async () => {
    mockDb.query.generations.findFirst = vi
      .fn()
      .mockResolvedValue({ id: 10, name: '10th' })

    const { getGeneration } = await import(
      '@/lib/server/fetcher/admin/get-generation'
    )

    await expect(getGeneration(10)).resolves.toEqual({ id: 10, name: '10th' })
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(mockDb.query.generations.findFirst).toHaveBeenCalledTimes(1)
  })

  it('fetches project detail and returns first matched result', async () => {
    mockProjectsFindMany.mockResolvedValue([
      { id: 'project-1', name: 'First' },
      { id: 'project-2', name: 'Second' },
    ])

    const { getProject } = await import('@/lib/server/fetcher/admin/get-project')
    const result = await getProject('project-1')

    expect(result).toEqual({ id: 'project-1', name: 'First' })
    expect(mockNoStore).toHaveBeenCalledTimes(1)
  })

  it('fetches member detail and returns first row', async () => {
    const rows = [{ id: 'user-1', name: 'User One' }]
    const chain = createSelectChainWithLimitResult(rows)
    mockSelect.mockReturnValue(chain)

    const { getMember } = await import('@/lib/server/fetcher/admin/get-member')
    const result = await getMember('user-1')

    expect(result).toEqual({ id: 'user-1', name: 'User One' })
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(chain.limit).toHaveBeenCalledWith(1)
  })

  it('fetches part detail and keeps related users', async () => {
    mockPartsFindFirst.mockResolvedValue({ id: 3, usersToParts: [] })
    const { getPart } = await import('@/lib/server/fetcher/admin/get-part')

    await expect(getPart(3)).resolves.toEqual({ id: 3, usersToParts: [] })
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(mockPartsFindFirst).toHaveBeenCalledTimes(1)
  })

  it('fetches session detail and author when session exists', async () => {
    mockSessionsFindFirst.mockResolvedValue({
      id: 'session-1',
      authorId: 'author-1',
      userToSession: [],
    })
    mockUsersFindFirst.mockResolvedValue({ id: 'author-1', name: 'Author' })

    const { getSession } = await import('@/lib/server/fetcher/admin/get-session')
    const result = await getSession('session-1')

    expect(result).toEqual({
      id: 'session-1',
      authorId: 'author-1',
      userToSession: [],
      author: { id: 'author-1', name: 'Author' },
    })
    expect(mockNoStore).toHaveBeenCalledTimes(1)
    expect(mockSessionsFindFirst).toHaveBeenCalledTimes(1)
    expect(mockUsersFindFirst).toHaveBeenCalledTimes(1)
  })

  it('returns null when session detail does not exist', async () => {
    mockSessionsFindFirst.mockResolvedValue(null)
    const { getSession } = await import('@/lib/server/fetcher/admin/get-session')

    await expect(getSession('missing')).resolves.toBeNull()
    expect(mockUsersFindFirst).not.toHaveBeenCalled()
  })
})
