import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCacheQuery = vi.fn()
const mockSessionsFindMany = vi.fn()
const mockSessionsFindFirst = vi.fn()
const mockProjectsFindMany = vi.fn()
const mockProjectsFindFirst = vi.fn()
const mockGenerationsFindFirst = vi.fn()
const mockSelect = vi.fn()

const mockDb = {
  query: {
    sessions: {
      findMany: mockSessionsFindMany,
      findFirst: mockSessionsFindFirst,
    },
    projects: {
      findMany: mockProjectsFindMany,
      findFirst: mockProjectsFindFirst,
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

vi.mock('@/lib/server/cache', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/server/cache')>(
      '@/lib/server/cache'
    )

  return {
    ...actual,
    cacheQuery: mockCacheQuery,
  }
})

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

function createSelectChainWithJoinResult(result: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(async () => result),
  }

  return chain
}

describe('public queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns generation summaries with locale-scoped cache policy', async () => {
    const mockOrderBy = vi.fn().mockResolvedValue([
      { id: 2, name: '2nd' },
      { id: 3, name: '3rd' },
    ])
    const mockFrom = vi.fn().mockReturnValue({ orderBy: mockOrderBy })
    mockSelect.mockReturnValue({ from: mockFrom })

    const { getGenerationSummaries } =
      await import('@/lib/server/queries/public/generations')

    const result = await getGenerationSummaries('ko')

    expect(result).toEqual([
      { id: 2, name: '2nd' },
      { id: 3, name: '3rd' },
    ])
    expect(mockCacheQuery).toHaveBeenCalledWith('generationIndex', [
      'generation:list:ko',
    ])
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockOrderBy).toHaveBeenCalledTimes(1)
  })

  it('returns latest generation with locale-scoped tag', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ id: 3, name: '3rd' })

    const { getLatestGeneration } =
      await import('@/lib/server/queries/public/generations')

    const result = await getLatestGeneration('en')

    expect(result).toEqual({ id: 3, name: '3rd' })
    expect(mockCacheQuery).toHaveBeenCalledWith('generationIndex', [
      'generation:latest:en',
    ])
    expect(mockGenerationsFindFirst).toHaveBeenCalledTimes(1)
  })

  it('fetches projects list with generation metadata only', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const updatedAt = new Date('2026-01-02T00:00:00.000Z')
    const chain = createSelectChainWithJoinResult([
      {
        id: 'project-1',
        createdAt,
        updatedAt,
        generationName: '5th',
      },
    ])
    mockSelect.mockReturnValue(chain)

    const { getProjects } = await import('@/lib/server/queries/public/projects')

    const result = await getProjects('ko')

    expect(result).toEqual([
      {
        id: 'project-1',
        createdAt,
        updatedAt,
        generation: {
          name: '5th',
        },
      },
    ])
    expect(mockCacheQuery).toHaveBeenCalledWith('projectList', [
      'project:list:ko',
    ])
    expect(chain.innerJoin).toHaveBeenCalledTimes(1)
  })

  it('fetches project detail with contributor relation', async () => {
    mockProjectsFindFirst.mockResolvedValue({ id: 'project-1' })
    const { getProjectById } =
      await import('@/lib/server/queries/public/projects')

    const result = await getProjectById('project-1', 'en')

    expect(result).toEqual({ id: 'project-1' })
    expect(mockCacheQuery).toHaveBeenCalledWith('projectDetail', [
      'project:item:project-1:en',
    ])
    expect(mockProjectsFindFirst).toHaveBeenCalledWith({
      where: expect.anything(),
      with: {
        generation: {
          columns: {
            id: true,
            name: true,
          },
        },
        usersToProjects: {
          columns: {
            userId: true,
          },
          with: {
            user: {
              columns: expect.objectContaining({
                id: true,
                firstName: true,
                isForeigner: true,
              }),
            },
          },
        },
      },
    })
  })

  it('fetches project list for a generation', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ name: '5th', projects: [] })
    const { getProjectsByGeneration } =
      await import('@/lib/server/queries/public/projects')

    const result = await getProjectsByGeneration('5th', 'ko')

    expect(result).toEqual({ name: '5th', projects: [] })
    expect(mockCacheQuery).toHaveBeenCalledWith('projectList', [
      'project:list:ko',
      'project:generation:5th:ko',
    ])
    expect(mockGenerationsFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: {
          id: true,
          name: true,
        },
      })
    )
  })

  it('fetches visible sessions with generation relation and bucketed cache input', async () => {
    mockSessionsFindMany.mockResolvedValue([{ id: 'session-1' }])
    const { getSessions } = await import('@/lib/server/queries/public/sessions')

    const result = await getSessions('en', '2026-03-07T00:00:00.000Z')

    expect(result).toEqual([{ id: 'session-1' }])
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
    ])
    expect(mockSessionsFindMany).toHaveBeenCalledTimes(1)

    const query = mockSessionsFindMany.mock.calls[0]![0]
    expect(query).toMatchObject({
      columns: {
        id: true,
        name: true,
        nameKo: true,
      },
      with: {
        part: {
          columns: {
            id: true,
            name: true,
            generationsId: true,
          },
          with: {
            generation: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })
  })

  it('fetches a visible session detail with locale-scoped detail tag', async () => {
    mockSessionsFindFirst.mockResolvedValue({ id: 'session-1' })
    const { getSessionById } =
      await import('@/lib/server/queries/public/sessions')

    const result = await getSessionById(
      'session-1',
      'ko',
      '2026-03-07T00:00:00.000Z'
    )

    expect(result).toEqual({ id: 'session-1' })
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionDetail', [
      'session:item:session-1:ko',
    ])
    expect(mockSessionsFindFirst).toHaveBeenCalledTimes(1)
    expect(mockSessionsFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.objectContaining({
          id: true,
          images: true,
          locationKo: true,
        }),
      })
    )
  })

  it('fetches published sessions by generation with locale-specific tags', async () => {
    const chain = createSelectChainWithOrderByResult([{ id: 'session-1' }])
    mockSelect.mockReturnValue(chain)

    const { getPublishedSessionsByGeneration } =
      await import('@/lib/server/queries/public/sessions')

    const result = await getPublishedSessionsByGeneration(
      '6th',
      'ko',
      '2026-03-07T00:00:00.000Z'
    )

    expect(result).toEqual([{ id: 'session-1' }])
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:ko',
      'session:generation:6th:ko',
    ])
    expect(chain.leftJoin).toHaveBeenCalledTimes(2)
    expect(chain.where).toHaveBeenCalledTimes(1)
  })

  it('fetches published sessions for sitemap in one query', async () => {
    const chain = createSelectChainWithOrderByResult([
      { id: 'session-1', generationName: '6th' },
    ])
    mockSelect.mockReturnValue(chain)

    const { getPublishedSessionsForSitemap } =
      await import('@/lib/server/queries/public/sessions')

    const result = await getPublishedSessionsForSitemap(
      'ko',
      '2026-03-07T00:00:00.000Z'
    )

    expect(result).toEqual([{ id: 'session-1', generationName: '6th' }])
    expect(mockCacheQuery).toHaveBeenCalledWith('sitemap', ['session:list:ko'])
    expect(chain.leftJoin).toHaveBeenCalledTimes(2)
    expect(chain.where).toHaveBeenCalledTimes(1)
  })

  it('fetches members for a generation with locale-scoped tags', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ name: '7th', parts: [] })
    const { getMembersByGeneration } =
      await import('@/lib/server/queries/public/members')

    const result = await getMembersByGeneration('7th', 'en')

    expect(result).toEqual({ name: '7th', parts: [] })
    expect(mockCacheQuery).toHaveBeenCalledWith('memberDirectory', [
      'member:list:en',
      'member:generation:7th:en',
    ])
    expect(mockGenerationsFindFirst).toHaveBeenCalledTimes(1)
  })
})
