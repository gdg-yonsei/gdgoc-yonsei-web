import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCacheQuery = vi.fn()
const mockGenerationsFindFirst = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/db', () => ({
  default: {
    query: {
      generations: { findFirst: mockGenerationsFindFirst },
    },
    select: mockSelect,
  },
}))

vi.mock('@/lib/server/cache', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/server/cache')>(
      '@/lib/server/cache'
    )
  return { ...actual, cacheQuery: mockCacheQuery }
})

function createSelectChain(result: unknown) {
  const resolved = Promise.resolve(result)
  const chain = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => resolved.then(onFulfilled, onRejected),
  }
  return chain
}

const BUCKET = '2026-07-11T09:00:00.000Z'

describe('home queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getHeatmapSessions returns rows and tags the session list', async () => {
    const rows = [
      {
        id: 's-1',
        name: 'T19',
        nameKo: 'T19',
        startAt: new Date('2026-07-07T10:00:00Z'),
        category: 'tech_talk',
        internalCount: 8,
        externalCount: 2,
      },
    ]
    mockSelect.mockReturnValueOnce(createSelectChain(rows))

    const { getHeatmapSessions } =
      await import('@/lib/server/queries/public/home')
    const result = await getHeatmapSessions('en', BUCKET)

    expect(result).toEqual(rows)
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
    ])
  })

  it('getFeaturedProjects flattens tags and stamps the generation name', async () => {
    mockGenerationsFindFirst.mockResolvedValue({
      id: 4,
      name: '25-26',
      projects: [
        {
          id: 'p-1',
          name: 'Compass',
          nameKo: '나침반',
          description: 'd',
          descriptionKo: 'ㄷ',
          mainImage: '/project-default.png',
          repoUrl: 'https://github.com/x',
          demoUrl: null,
          projectsToTags: [{ tag: { name: 'Next.js' } }],
        },
      ],
    })

    const { getFeaturedProjects } =
      await import('@/lib/server/queries/public/home')
    const result = await getFeaturedProjects('ko')

    expect(result).toEqual([
      {
        id: 'p-1',
        name: 'Compass',
        nameKo: '나침반',
        description: 'd',
        descriptionKo: 'ㄷ',
        mainImage: '/project-default.png',
        repoUrl: 'https://github.com/x',
        demoUrl: null,
        generationName: '25-26',
        tags: ['Next.js'],
      },
    ])
    expect(mockCacheQuery).toHaveBeenCalledWith('projectList', [
      'project:list:ko',
      'generation:latest:ko',
    ])
  })

  it('getFeaturedProjects returns [] when no generation exists', async () => {
    mockGenerationsFindFirst.mockResolvedValue(undefined)

    const { getFeaturedProjects } =
      await import('@/lib/server/queries/public/home')

    expect(await getFeaturedProjects('en')).toEqual([])
  })

  it('getCommunityStats sums internal and external participants', async () => {
    mockSelect
      .mockReturnValueOnce(createSelectChain([{ value: 60 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 400 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 50 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 8 }]))
      .mockReturnValueOnce(createSelectChain([{ value: 7 }]))
    mockGenerationsFindFirst.mockResolvedValue({ id: 4 })

    const { getCommunityStats } =
      await import('@/lib/server/queries/public/home')
    const result = await getCommunityStats('en')

    expect(result).toEqual({
      sessionCount: 60,
      participantTotal: 450,
      projectCount: 8,
      partCount: 7,
    })
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
      'project:list:en',
      'member:list:en',
    ])
  })

  it('getGenerationTimeline groups sessions under their generation', async () => {
    const rows = [
      {
        generationId: 3,
        generationName: '24-25',
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        sessionId: 's-1',
        sessionName: 'Demo Day',
        sessionNameKo: '데모데이',
        sessionStartAt: new Date('2024-12-20T10:00:00Z'),
        sessionCategory: 'demo_day',
      },
      {
        generationId: 3,
        generationName: '24-25',
        startDate: '2024-09-01',
        endDate: '2025-08-31',
        sessionId: null,
        sessionName: null,
        sessionNameKo: null,
        sessionStartAt: null,
        sessionCategory: null,
      },
      {
        generationId: 4,
        generationName: '25-26',
        startDate: '2025-09-01',
        endDate: null,
        sessionId: 's-2',
        sessionName: 'T19',
        sessionNameKo: 'T19',
        sessionStartAt: new Date('2025-09-16T10:00:00Z'),
        sessionCategory: 'tech_talk',
      },
    ]
    mockSelect.mockReturnValueOnce(createSelectChain(rows))

    const { getGenerationTimeline } =
      await import('@/lib/server/queries/public/home')
    const result = await getGenerationTimeline('en', BUCKET)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: 3,
      name: '24-25',
      sessions: [{ id: 's-1', category: 'demo_day' }],
    })
    expect(result[1]!.sessions).toHaveLength(1)
    expect(mockCacheQuery).toHaveBeenCalledWith('sessionList', [
      'session:list:en',
      'generation:list:en',
    ])
  })
})
