import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockApplyCacheTags = vi.fn()
const mockCacheTag = vi.fn()

const mockGenerationsFindMany = vi.fn()
const mockProjectsFindMany = vi.fn()
const mockPartsFindFirst = vi.fn()
const mockSessionsFindFirst = vi.fn()
const mockUsersFindFirst = vi.fn()

const mockSelect = vi.fn()

const mockDb = {
  select: mockSelect,
  query: {
    generations: {
      findMany: mockGenerationsFindMany,
      findFirst: vi.fn(),
    },
    projects: {
      findMany: mockProjectsFindMany,
    },
    parts: {
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

vi.mock('@/db', () => ({
  default: mockDb,
}))

vi.mock('@/lib/server/cacheTagT', () => ({
  default: mockApplyCacheTags,
}))

vi.mock('next/dist/server/use-cache/cache-tag', () => ({
  cacheTag: mockCacheTag,
}))

function createSelectChainWithOrderByResult(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
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

  it('fetches generations in descending id order', async () => {
    const rows = [{ id: 2, name: '2nd' }]
    const orderBy = vi.fn().mockResolvedValue(rows)
    const from = vi.fn().mockReturnValue({ orderBy })
    mockSelect.mockReturnValue({ from })

    const { getGenerations } = await import(
      '@/lib/server/fetcher/admin/get-generations'
    )

    await expect(getGenerations()).resolves.toEqual(rows)
    expect(mockApplyCacheTags).toHaveBeenCalledWith('generations')
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

  it('fetches admin projects ordered by updatedAt', async () => {
    mockProjectsFindMany.mockResolvedValue([{ id: 'project-1' }])
    const { getProjects } = await import('@/lib/server/fetcher/admin/get-projects')

    await expect(getProjects()).resolves.toEqual([{ id: 'project-1' }])
    expect(mockApplyCacheTags).toHaveBeenCalledWith('projects')
    expect(mockProjectsFindMany).toHaveBeenCalledTimes(1)
  })

  it('preloads admin projects', async () => {
    mockProjectsFindMany.mockResolvedValue([])
    const { preloadAdminProjects } = await import(
      '@/lib/server/fetcher/admin/get-projects'
    )
    preloadAdminProjects()

    await vi.waitFor(() => {
      expect(mockProjectsFindMany).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches admin members and de-duplicates by user id', async () => {
    const rows = [
      { id: 'user-1', name: 'A', part: 'Part1' },
      { id: 'user-1', name: 'A', part: 'Part2' },
      { id: 'user-2', name: 'B', part: 'Part1' },
    ]
    const chain = createSelectChainWithOrderByResult(rows)
    mockSelect.mockReturnValue(chain)

    const { getMembers } = await import('@/lib/server/fetcher/admin/get-members')
    const result = await getMembers()

    expect(mockApplyCacheTags).toHaveBeenCalledWith(
      'members',
      'parts',
      'generations'
    )
    expect(result).toEqual([
      { id: 'user-1', name: 'A', part: 'Part1' },
      { id: 'user-2', name: 'B', part: 'Part1' },
    ])
    expect(chain.from).toHaveBeenCalledTimes(1)
    expect(chain.leftJoin).toHaveBeenCalledTimes(3)
  })

  it('preloads admin members', async () => {
    const chain = createSelectChainWithOrderByResult([])
    mockSelect.mockReturnValue(chain)

    const { preloadAdminMembers } = await import(
      '@/lib/server/fetcher/admin/get-members'
    )
    preloadAdminMembers()

    await vi.waitFor(() => {
      expect(chain.orderBy).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches sessions grouped by generation and part with cacheTag', async () => {
    mockGenerationsFindMany.mockResolvedValue([{ id: 1, parts: [] }])
    const { getSessions } = await import('@/lib/server/fetcher/admin/get-sessions')

    const result = await getSessions()

    expect(result).toEqual([{ id: 1, parts: [] }])
    expect(mockCacheTag).toHaveBeenCalledWith('generations', 'sessions')
    expect(mockGenerationsFindMany).toHaveBeenCalledTimes(1)
  })

  it('fetches generation detail by id', async () => {
    mockDb.query.generations.findFirst = vi
      .fn()
      .mockResolvedValue({ id: 10, name: '10th' })

    const { getGeneration } = await import(
      '@/lib/server/fetcher/admin/get-generation'
    )

    await expect(getGeneration(10)).resolves.toEqual({ id: 10, name: '10th' })
    expect(mockApplyCacheTags).toHaveBeenCalledWith('generations', 'members', 'parts')
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
    expect(mockApplyCacheTags).toHaveBeenCalledWith(
      'projects',
      'members',
      'generations'
    )
  })

  it('fetches member detail and returns first row', async () => {
    const rows = [{ id: 'user-1', name: 'User One' }]
    const chain = createSelectChainWithLimitResult(rows)
    mockSelect.mockReturnValue(chain)

    const { getMember } = await import('@/lib/server/fetcher/admin/get-member')
    const result = await getMember('user-1')

    expect(result).toEqual({ id: 'user-1', name: 'User One' })
    expect(mockApplyCacheTags).toHaveBeenCalledWith('members', 'generations', 'parts')
    expect(chain.limit).toHaveBeenCalledWith(1)
  })

  it('fetches part detail and keeps related users', async () => {
    mockPartsFindFirst.mockResolvedValue({ id: 3, usersToParts: [] })
    const { getPart } = await import('@/lib/server/fetcher/admin/get-part')

    await expect(getPart(3)).resolves.toEqual({ id: 3, usersToParts: [] })
    expect(mockApplyCacheTags).toHaveBeenCalledWith('parts', 'members')
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
    expect(mockApplyCacheTags).toHaveBeenCalledWith('sessions')
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
