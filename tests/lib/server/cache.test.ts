import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCacheLife = vi.fn()
const mockCacheTag = vi.fn()
const mockRevalidatePath = vi.fn()
const mockRevalidateTag = vi.fn()
const mockUpdateTag = vi.fn()

vi.mock('next/cache', () => ({
  cacheLife: mockCacheLife,
  cacheTag: mockCacheTag,
  revalidatePath: mockRevalidatePath,
  revalidateTag: mockRevalidateTag,
  updateTag: mockUpdateTag,
}))

describe('cache utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies cache life and de-duplicated tags through cacheQuery', async () => {
    const { cacheQuery } = await import('@/lib/server/cache')

    cacheQuery('projectList', ['project:list:ko', 'project:list:ko', 'home:ko'])

    expect(mockCacheLife).toHaveBeenCalledWith('projectList')
    expect(mockCacheTag).toHaveBeenCalledWith('project:list:ko', 'home:ko')
  })

  it('revalidates and updates tags with duplicate inputs removed', async () => {
    const { revalidateCacheTags, updateCacheTags } = await import(
      '@/lib/server/cache'
    )

    revalidateCacheTags(['member:list:ko', 'member:list:ko', 'home:ko'])
    updateCacheTags(['project:list:en', 'project:list:en', 'home:en'])

    expect(mockRevalidateTag).toHaveBeenCalledWith('member:list:ko', 'max')
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:ko', 'max')
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2)
    expect(mockUpdateTag).toHaveBeenCalledWith('project:list:en')
    expect(mockUpdateTag).toHaveBeenCalledWith('home:en')
    expect(mockUpdateTag).toHaveBeenCalledTimes(2)
  })

  it('builds localized public paths for every locale', async () => {
    const { localizedPublicPath } = await import('@/lib/server/cache')

    expect(localizedPublicPath('/project')).toEqual([
      '/en/project',
      '/ko/project',
    ])
  })

  it('invalidates project caches with detail, list, and path updates', async () => {
    const { invalidateProjectPublicCache } = await import('@/lib/server/cache')

    invalidateProjectPublicCache({
      projectId: 'project-1',
      previousGenerationName: '5th',
      nextGenerationName: '6th',
    })

    expect(mockUpdateTag).toHaveBeenCalledWith('project:list:en')
    expect(mockUpdateTag).toHaveBeenCalledWith('project:item:project-1:ko')
    expect(mockUpdateTag).toHaveBeenCalledWith('project:generation:6th:en')
    expect(mockRevalidateTag).toHaveBeenCalledWith('home:ko', 'max')
    expect(mockRevalidateTag).toHaveBeenCalledWith('sitemap:en', 'max')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/project')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/ko/project/6th/project-1'
    )
  })

  it('invalidates all public cache surfaces and sitemap path', async () => {
    const { invalidateAllPublicCache } = await import('@/lib/server/cache')

    invalidateAllPublicCache()

    expect(mockUpdateTag).toHaveBeenCalledWith('generation:list:en')
    expect(mockUpdateTag).toHaveBeenCalledWith('session:list:ko')
    expect(mockUpdateTag).toHaveBeenCalledWith('home:en')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/en/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/ko/calendar')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })
})
