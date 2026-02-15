import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockApplyCacheTags = vi.fn()
const mockSessionsFindMany = vi.fn()
const mockProjectsFindMany = vi.fn()
const mockUsersFindMany = vi.fn()
const mockGenerationsFindFirst = vi.fn()
const mockSelect = vi.fn()

const mockDb = {
  query: {
    sessions: {
      findMany: mockSessionsFindMany,
    },
    projects: {
      findMany: mockProjectsFindMany,
    },
    users: {
      findMany: mockUsersFindMany,
    },
    generations: {
      findFirst: mockGenerationsFindFirst,
    },
  },
  select: mockSelect,
}

vi.mock('@/db', () => ({
  default: mockDb,
}))

vi.mock('@/lib/server/cacheTagT', () => ({
  default: mockApplyCacheTags,
}))

describe('public fetchers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches sessions with generation relation and sessions cache tag', async () => {
    mockSessionsFindMany.mockResolvedValue([{ id: 'session-1' }])
    const { getSessions } = await import('@/lib/server/fetcher/get-sessions')

    const result = await getSessions()

    expect(result).toEqual([{ id: 'session-1' }])
    expect(mockApplyCacheTags).toHaveBeenCalledWith('sessions')
    expect(mockSessionsFindMany).toHaveBeenCalledTimes(1)

    const query = mockSessionsFindMany.mock.calls[0][0]
    expect(query).toMatchObject({
      with: {
        part: {
          with: {
            generation: true,
          },
        },
      },
    })
  })

  it('preloads sessions without throwing', async () => {
    mockSessionsFindMany.mockResolvedValue([])
    const { preloadSessions } = await import('@/lib/server/fetcher/get-sessions')
    preloadSessions()
    await vi.waitFor(() => {
      expect(mockSessionsFindMany).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches projects with generation relation and cache tags', async () => {
    mockProjectsFindMany.mockResolvedValue([{ id: 'project-1' }])
    const { getProjects } = await import('@/lib/server/fetcher/get-projects')

    const result = await getProjects()

    expect(result).toEqual([{ id: 'project-1' }])
    expect(mockApplyCacheTags).toHaveBeenCalledWith('projects', 'generations')
    expect(mockProjectsFindMany).toHaveBeenCalledWith({
      with: {
        generation: true,
      },
    })
  })

  it('preloads projects without throwing', async () => {
    mockProjectsFindMany.mockResolvedValue([])
    const { preloadProjects } = await import('@/lib/server/fetcher/get-projects')
    preloadProjects()
    await vi.waitFor(() => {
      expect(mockProjectsFindMany).toHaveBeenCalledTimes(1)
    })
  })

  it('fetches members with part and generation data and deduplicated columns', async () => {
    mockUsersFindMany.mockResolvedValue([{ name: 'member-1' }])
    const { getMembers } = await import('@/lib/server/fetcher/get-members')

    const result = await getMembers()

    expect(result).toEqual([{ name: 'member-1' }])
    expect(mockApplyCacheTags).toHaveBeenCalledWith(
      'members',
      'parts',
      'generations'
    )

    const query = mockUsersFindMany.mock.calls[0][0]
    expect(query.columns).toMatchObject({
      id: false,
      createdAt: false,
      updatedAt: false,
    })
    expect(query.with.usersToParts.with.part.with.generation.columns).toMatchObject({
      id: false,
    })
  })

  it('preloads members without throwing', async () => {
    mockUsersFindMany.mockResolvedValue([])
    const { preloadMembers } = await import('@/lib/server/fetcher/get-members')
    preloadMembers()
    await vi.waitFor(() => {
      expect(mockUsersFindMany).toHaveBeenCalledTimes(1)
    })
  })

  it('returns generation summaries ordered by startDate', async () => {
    const mockOrderBy = vi.fn().mockResolvedValue([
      { id: 2, name: '2nd' },
      { id: 3, name: '3rd' },
    ])
    const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
    mockSelect.mockReturnValue({ from: mockFrom })

    const { default: getGenerationSummaries } = await import(
      '@/lib/server/fetcher/getGenerationList'
    )

    const result = await getGenerationSummaries()

    expect(result).toEqual([
      { id: 2, name: '2nd' },
      { id: 3, name: '3rd' },
    ])
    expect(mockApplyCacheTags).toHaveBeenCalledWith('generations')
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockOrderBy).toHaveBeenCalledTimes(1)
  })

  it('returns latest generation', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ id: 3, name: '3rd' })

    const { default: getLatestGeneration } = await import(
      '@/lib/server/fetcher/getLastGeneration'
    )

    const result = await getLatestGeneration()

    expect(result).toEqual({ id: 3, name: '3rd' })
    expect(mockApplyCacheTags).toHaveBeenCalledWith('generations')
    expect(mockGenerationsFindFirst).toHaveBeenCalledTimes(1)
  })
})
