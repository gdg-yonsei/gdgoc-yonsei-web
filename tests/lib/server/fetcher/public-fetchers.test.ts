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

  it('shares generation summaries across locales with both invalidation tags', async () => {
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
      'generation:list:en',
      'generation:list:ko',
    ])
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(mockFrom).toHaveBeenCalledTimes(1)
    expect(mockOrderBy).toHaveBeenCalledTimes(1)
  })

  it('shares the latest generation across locales', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ id: 3, name: '3rd' })

    const { getLatestGeneration } =
      await import('@/lib/server/queries/public/generations')

    const result = await getLatestGeneration('en')

    expect(result).toEqual({ id: 3, name: '3rd' })
    expect(mockCacheQuery).toHaveBeenCalledWith('generationIndex', [
      'generation:latest:en',
      'generation:latest:ko',
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
      'project:list:en',
      'project:list:ko',
    ])
    expect(chain.innerJoin).toHaveBeenCalledTimes(1)
  })

  it('fetches project detail with contributor relation', async () => {
    const projectId = '4ef0a326-52ec-4da5-b204-9a67c7332a0f'
    mockProjectsFindFirst.mockResolvedValue({ id: projectId })
    const { getProjectById } =
      await import('@/lib/server/queries/public/projects')

    const result = await getProjectById(projectId, 'en')

    expect(result).toEqual({ id: projectId })
    expect(mockCacheQuery).toHaveBeenCalledWith('projectDetail', [
      `project:item:${projectId}:en`,
      `project:item:${projectId}:ko`,
    ])
    expect(mockProjectsFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.objectContaining({
          content: true,
          contentKo: true,
          images: true,
          mainImage: true,
        }),
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
    )
  })

  it('rejects a malformed project id before querying Postgres', async () => {
    const { getProjectById } =
      await import('@/lib/server/queries/public/projects')

    await expect(getProjectById('not-a-uuid', 'en')).resolves.toBeUndefined()
    expect(mockProjectsFindFirst).not.toHaveBeenCalled()
    expect(mockCacheQuery).not.toHaveBeenCalled()
  })

  it('fetches project list for a generation', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ name: '5th', projects: [] })
    const { getProjectsByGeneration } =
      await import('@/lib/server/queries/public/projects')

    const result = await getProjectsByGeneration('5th', 'ko')

    expect(result).toEqual({ name: '5th', projects: [] })
    expect(mockCacheQuery).toHaveBeenCalledWith('projectList', [
      'project:list:en',
      'project:generation:5th:en',
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
      'session:list:ko',
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

  it('shares visible session detail data across locales', async () => {
    const sessionId = '6bf4a326-52ec-4da5-b204-9a67c7332a0f'
    mockSessionsFindFirst.mockResolvedValue({ id: sessionId })
    const { getSessionById } =
      await import('@/lib/server/queries/public/sessions')

    const result = await getSessionById(
      sessionId,
      'ko',
      '2026-03-07T00:00:00.000Z'
    )

    expect(result).toEqual({ id: sessionId })
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionDetail', [
      `session:item:${sessionId}:en`,
      `session:item:${sessionId}:ko`,
    ])
    expect(mockSessionsFindFirst).toHaveBeenCalledTimes(1)
    expect(mockSessionsFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: expect.objectContaining({
          category: true,
          id: true,
          images: true,
          locationKo: true,
        }),
      })
    )
  })

  it('rejects a malformed session id before querying Postgres', async () => {
    const { getSessionById } =
      await import('@/lib/server/queries/public/sessions')

    await expect(
      getSessionById('not-a-uuid', 'en', '2026-03-07T00:00:00.000Z')
    ).resolves.toBeUndefined()
    expect(mockSessionsFindFirst).not.toHaveBeenCalled()
    expect(mockCacheQuery).not.toHaveBeenCalled()
  })

  it('shares published sessions by generation across locales', async () => {
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
      'session:list:en',
      'session:generation:6th:en',
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
    expect(mockCacheQuery).toHaveBeenCalledWith('sitemap', [
      'session:list:en',
      'session:list:ko',
    ])
    expect(chain.leftJoin).toHaveBeenCalledTimes(2)
    expect(chain.where).toHaveBeenCalledTimes(1)
  })

  it('fetches a minimal member directory shared across locales', async () => {
    mockGenerationsFindFirst.mockResolvedValue({ name: '7th', parts: [] })
    const { getMembersByGeneration } =
      await import('@/lib/server/queries/public/members')

    const result = await getMembersByGeneration('7th', 'en')

    expect(result).toEqual({ name: '7th', parts: [] })
    expect(mockCacheQuery).toHaveBeenCalledWith('memberDirectory', [
      'member:list:en',
      'member:generation:7th:en',
      'member:list:ko',
      'member:generation:7th:ko',
    ])
    expect(mockGenerationsFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        with: {
          parts: expect.objectContaining({
            with: {
              usersToParts: expect.objectContaining({
                with: {
                  user: {
                    columns: expect.not.objectContaining({
                      studentId: true,
                      telephone: true,
                    }),
                  },
                },
              }),
            },
          }),
        },
      })
    )
  })
})
