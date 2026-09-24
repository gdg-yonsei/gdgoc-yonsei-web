import { describe, expect, it } from 'vitest'
import {
  contributorName,
  moreFromGeneration,
  nextProject,
  projectFacets,
  projectLinkValues,
  projectSearchText,
  projectSummary,
  projectTitle,
  sortShowcase,
  toShowcaseProject,
  type ProjectRow,
  type ShowcaseProject,
} from '@/lib/site/project-showcase'

function row(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'p1',
    name: 'Campus Compass',
    nameKo: '캠퍼스 나침반',
    description: 'Indoor navigation',
    descriptionKo: null,
    mainImage: '/project-default.png',
    repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
    demoUrl: null,
    createdAt: new Date('2025-03-01T00:00:00.000Z'),
    updatedAt: new Date('2025-04-01T00:00:00.000Z'),
    generation: { name: '25-26', startDate: '2025-03-01' },
    projectsToTags: [
      { tag: { name: 'Next.js' } },
      { tag: { name: 'Firebase' } },
    ],
    usersToProjects: [
      {
        user: {
          id: 'u1',
          name: 'minji',
          firstName: 'Minji',
          lastName: 'Kim',
          firstNameKo: '민지',
          lastNameKo: '김',
          isForeigner: false,
          image: null,
          githubId: '@minji',
        },
      },
    ],
    ...overrides,
  }
}

const project = (overrides: Partial<ShowcaseProject>): ShowcaseProject => ({
  ...toShowcaseProject(row()),
  ...overrides,
})

describe('toShowcaseProject', () => {
  it('flattens the row, sorts tags and names contributors in both languages', () => {
    expect(toShowcaseProject(row())).toMatchObject({
      generationName: '25-26',
      generationStartDate: '2025-03-01',
      tags: ['Firebase', 'Next.js'],
      contributors: [
        { id: 'u1', nameEn: 'Kim Minji', nameKo: '김민지', githubId: '@minji' },
      ],
    })
  })
})

describe('project text', () => {
  it('falls back to English when Korean fields are empty', () => {
    const english = project({ nameKo: null, descriptionKo: null })
    expect(projectTitle(english, 'ko')).toBe('Campus Compass')
    expect(projectSummary(english, 'ko')).toBe('Indoor navigation')
    expect(projectTitle(project({}), 'ko')).toBe('캠퍼스 나침반')
    expect(contributorName(project({}).contributors[0]!, 'ko')).toBe('김민지')
  })

  it('indexes names, summaries, tags and contributors', () => {
    const text = projectSearchText(project({}))
    expect(text).toContain('campus compass')
    expect(text).toContain('캠퍼스 나침반')
    expect(text).toContain('next.js')
    expect(text).toContain('김민지')
  })
})

describe('showcase ordering and facets', () => {
  const projects = [
    project({
      id: 'old',
      generationName: '24-25',
      generationStartDate: '2024-03-01',
      tags: ['Flutter'],
    }),
    project({
      id: 'recent',
      updatedAt: new Date('2025-06-01T00:00:00.000Z'),
      demoUrl: 'https://demo.example',
    }),
    project({
      id: 'earlier',
      updatedAt: new Date('2025-05-01T00:00:00.000Z'),
      repoUrl: null,
    }),
  ]

  it('orders by generation, then by the most recent update', () => {
    expect(sortShowcase(projects).map((entry) => entry.id)).toEqual([
      'recent',
      'earlier',
      'old',
    ])
  })

  it('counts generations, tags and link availability', () => {
    const facets = projectFacets(projects)
    expect(facets.generations).toEqual([
      { value: '25-26', label: '25-26', count: 2 },
      { value: '24-25', label: '24-25', count: 1 },
    ])
    expect(facets.tags).toEqual([
      { value: 'Firebase', label: 'Firebase', count: 2 },
      { value: 'Next.js', label: 'Next.js', count: 2 },
      { value: 'Flutter', label: 'Flutter', count: 1 },
    ])
    expect(facets.links).toEqual({ demo: 1, source: 2 })
    expect(projectLinkValues(projects[1]!)).toEqual(['demo', 'source'])
  })

  it('walks to the next project and lists siblings from the same generation', () => {
    const ordered = sortShowcase(projects)
    expect(nextProject(ordered, 'recent')?.id).toBe('earlier')
    expect(nextProject(ordered, 'old')?.id).toBe('recent')
    expect(nextProject([ordered[0]!], 'recent')).toBeNull()
    expect(
      moreFromGeneration(ordered, ordered[0]!).map((entry) => entry.id)
    ).toEqual(['earlier'])
  })
})
