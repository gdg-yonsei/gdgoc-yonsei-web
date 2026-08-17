import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetGenerationSummaries = vi.fn()
const mockGetProjects = vi.fn()
const mockGetPublishedSessionsForSitemap = vi.fn()
const mockGetSessionVisibilityBucket = vi.fn()

vi.mock('@/lib/server/queries/public/generations', () => ({
  getGenerationSummaries: mockGetGenerationSummaries,
}))

vi.mock('@/lib/server/queries/public/projects', () => ({
  getProjects: mockGetProjects,
}))

vi.mock('@/lib/server/queries/public/sessions', () => ({
  getPublishedSessionsForSitemap: mockGetPublishedSessionsForSitemap,
}))

vi.mock('@/lib/server/cache/policy', () => ({
  getSessionVisibilityBucket: mockGetSessionVisibilityBucket,
}))

describe('public static params inventory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSessionVisibilityBucket.mockReturnValue('2026-08-14T10:00:00.000Z')
  })

  it('maps every generation and keeps the locale-scoped query', async () => {
    mockGetGenerationSummaries.mockResolvedValue([
      { id: 1, name: '24-25' },
      { id: 2, name: '25-26' },
    ])

    const { getGenerationStaticParams } =
      await import('@/lib/server/queries/public/static-params')

    await expect(getGenerationStaticParams('ko')).resolves.toEqual([
      { generation: '24-25' },
      { generation: '25-26' },
    ])
    expect(mockGetGenerationSummaries).toHaveBeenCalledWith('ko')
  })

  it('returns complete generation and project id pairs without a parent filter', async () => {
    mockGetProjects.mockResolvedValue([
      { id: 'project-a', generation: { name: '24-25' } },
      { id: 'project-b', generation: { name: '25-26' } },
    ])

    const { getProjectStaticParams } =
      await import('@/lib/server/queries/public/static-params')

    await expect(getProjectStaticParams('en')).resolves.toEqual([
      { generation: '24-25', projectId: 'project-a' },
      { generation: '25-26', projectId: 'project-b' },
    ])
    expect(mockGetProjects).toHaveBeenCalledWith('en')
  })

  it('uses only the publication-filtered session query and drops orphan rows', async () => {
    mockGetPublishedSessionsForSitemap.mockResolvedValue([
      { id: 'session-a', generationName: '25-26' },
      { id: 'orphan-session', generationName: null },
    ])

    const { getSessionStaticParams } =
      await import('@/lib/server/queries/public/static-params')

    await expect(getSessionStaticParams('ko')).resolves.toEqual([
      { generation: '25-26', sessionId: 'session-a' },
    ])
    expect(mockGetPublishedSessionsForSitemap).toHaveBeenCalledWith(
      'ko',
      '2026-08-14T10:00:00.000Z'
    )
  })

  it('never returns an empty list when Cache Components validates a route', async () => {
    mockGetGenerationSummaries.mockResolvedValue([])
    mockGetProjects.mockResolvedValue([])
    mockGetPublishedSessionsForSitemap.mockResolvedValue([])

    const {
      getGenerationStaticParams,
      getProjectStaticParams,
      getSessionStaticParams,
    } = await import('@/lib/server/queries/public/static-params')

    await expect(getGenerationStaticParams('en')).resolves.toHaveLength(1)
    await expect(getProjectStaticParams('en')).resolves.toHaveLength(1)
    await expect(getSessionStaticParams('en')).resolves.toHaveLength(1)
  })
})
