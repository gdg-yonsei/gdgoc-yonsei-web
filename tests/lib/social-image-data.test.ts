import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSessionById, mockGetProjectById } = vi.hoisted(() => ({
  mockGetSessionById: vi.fn(),
  mockGetProjectById: vi.fn(),
}))

vi.mock('@/lib/server/queries/public/sessions', () => ({
  getSessionById: mockGetSessionById,
}))
vi.mock('@/lib/server/queries/public/projects', () => ({
  getProjectById: mockGetProjectById,
}))
vi.mock('@/lib/server/cache/session-visibility', () => ({
  getCachedSessionVisibilityBucket: vi.fn(
    async () => '2026-01-01T00:00:00.000Z'
  ),
}))

describe('social image content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('dates an evening session on the day it happened', async () => {
    mockGetSessionById.mockResolvedValue({
      name: 'Sixth T19',
      nameKo: '여섯 번째 T19',
      category: 'tech_talk',
      startAt: new Date('2025-11-04T19:00:00.000Z'),
      mainImage: '/session-default.png',
      updatedAt: new Date('2025-11-05T00:00:00.000Z'),
      part: { generation: { name: '25-26' } },
    })
    const { getSessionSocialImageContent } =
      await import('@/lib/seo/social-image-data')

    await expect(
      getSessionSocialImageContent({
        locale: 'en',
        generation: '25-26',
        sessionId: 'session-id',
      })
    ).resolves.toMatchObject({
      date: 'Nov 4, 2025',
      category: 'Tech Talk',
      representativeImage: null,
    })
  })

  it('dates projects by their Seoul update day', async () => {
    mockGetProjectById.mockResolvedValue({
      name: 'Campus Compass',
      nameKo: '캠퍼스 나침반',
      mainImage: 'https://image.gdgyonsei.moveto.kr/projects/cover.webp',
      updatedAt: new Date('2025-11-04T16:30:00.000Z'),
      generation: { name: '25-26' },
    })
    const { getProjectSocialImageContent } =
      await import('@/lib/seo/social-image-data')

    await expect(
      getProjectSocialImageContent({
        locale: 'ko',
        generation: '25-26',
        projectId: 'project-id',
      })
    ).resolves.toMatchObject({
      title: '캠퍼스 나침반',
      date: '2025. 11. 5.',
      representativeImage:
        'https://image.gdgyonsei.moveto.kr/projects/cover.webp',
    })
  })
})
