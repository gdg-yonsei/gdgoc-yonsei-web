import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LogSession } from '@/lib/site/session-log'
import type { ShowcaseProject } from '@/lib/site/project-showcase'

const { mockGetSessionArchive, mockGetProjectShowcase } = vi.hoisted(() => ({
  mockGetSessionArchive: vi.fn(),
  mockGetProjectShowcase: vi.fn(),
}))

vi.mock('@/lib/server/queries/public/sessions', () => ({
  getSessionArchive: mockGetSessionArchive,
}))
vi.mock('@/lib/server/queries/public/projects', () => ({
  getProjectShowcase: mockGetProjectShowcase,
}))
vi.mock('@/lib/server/cache/session-visibility', () => ({
  getCachedSessionVisibilityBucket: vi.fn(
    async () => '2026-01-01T00:00:00.000Z'
  ),
}))

import { LatestLogList } from '@/app/(home)/[lang]/_components/home/latest-log'
import { FeaturedReleasesList } from '@/app/(home)/[lang]/_components/home/featured-releases'

const sessionOn = (id: string, day: number): LogSession => ({
  id,
  name: `Session ${id}`,
  nameKo: `세션 ${id}`,
  category: 'tech_talk',
  type: null,
  mainImage: '/session-default.png',
  startAt: new Date(Date.UTC(2025, 10, day, 19)),
  endAt: null,
  location: null,
  locationKo: null,
  createdAt: new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: new Date('2025-10-01T00:00:00.000Z'),
  partName: 'Cloud',
  generationName: '25-26',
  generationStartDate: '2025-03-01',
})

const projectAt = (id: string, month: number): ShowcaseProject => ({
  id,
  name: `Project ${id}`,
  nameKo: null,
  description: 'desc',
  descriptionKo: null,
  mainImage: '/project-default.png',
  repoUrl: null,
  demoUrl: null,
  createdAt: new Date('2025-03-01T00:00:00.000Z'),
  updatedAt: new Date(Date.UTC(2025, month, 1)),
  generationName: '25-26',
  generationStartDate: '2025-03-01',
  tags: [],
  contributors: [],
})

describe('home data sections', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the six newest sessions, newest first', async () => {
    mockGetSessionArchive.mockResolvedValue(
      [3, 9, 1, 12, 7, 5, 20, 14].map((day) => sessionOn(`d${day}`, day))
    )
    render(await LatestLogList({ lang: 'en' }))

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual([
      'Session d20',
      'Session d14',
      'Session d12',
      'Session d9',
      'Session d7',
      'Session d5',
    ])
  })

  it('features the most recent of three projects', async () => {
    mockGetProjectShowcase.mockResolvedValue(
      [1, 5, 3, 9].map((month) => projectAt(`m${month}`, month))
    )
    const { container } = render(await FeaturedReleasesList({ lang: 'en' }))

    expect(container.querySelectorAll('li.release-item')).toHaveLength(3)
    expect(
      container.querySelector('li.release-item[data-featured]')?.textContent
    ).toContain('Project m9')
  })

  it('shows empty states on a database with nothing public', async () => {
    mockGetSessionArchive.mockResolvedValue([])
    mockGetProjectShowcase.mockResolvedValue([])
    render(
      <>
        {await LatestLogList({ lang: 'en' })}
        {await FeaturedReleasesList({ lang: 'en' })}
      </>
    )

    expect(screen.getByText('No public sessions yet')).toBeInTheDocument()
    expect(screen.getByText('No public projects yet')).toBeInTheDocument()
  })
})
