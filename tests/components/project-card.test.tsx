import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ProjectCard from '@/app/components/site/project-grid/project-card'
import { projectArchiveCopy } from '@/lib/contents/archive-copy'
import type { ShowcaseProject } from '@/lib/site/project-showcase'

const contributor = (id: string, nameEn: string, nameKo: string) => ({
  id,
  nameEn,
  nameKo,
  image: null,
  githubId: null,
})

const project: ShowcaseProject = {
  id: 'p1',
  name: 'Campus Compass',
  nameKo: null,
  description: 'Indoor navigation for Yonsei campus buildings.',
  descriptionKo: null,
  mainImage: '/project-default.png',
  repoUrl: 'https://github.com/gdg-yonsei/campus-compass',
  demoUrl: 'https://campus-compass.example.com',
  createdAt: new Date('2025-03-01T00:00:00.000Z'),
  updatedAt: new Date('2025-04-01T00:00:00.000Z'),
  generationName: '25-26',
  generationStartDate: '2025-03-01',
  tags: ['Firebase', 'Flutter'],
  contributors: [
    contributor('u1', 'Kim Minji', '김민지'),
    contributor('u2', 'Lee Jun', '이준'),
    contributor('u3', 'Park Sora', '박소라'),
    contributor('u4', 'Choi Dan', '최단'),
    contributor('u5', 'Jung Ha', '정하'),
  ],
}

function renderCard(lang: 'en' | 'ko' = 'en') {
  return render(
    <ul>
      <ProjectCard
        project={project}
        lang={lang}
        copy={projectArchiveCopy[lang]}
        titleLevel={2}
      />
    </ul>
  )
}

describe('ProjectCard', () => {
  it('uses one stretched title link and keeps external links separate', () => {
    const { container } = renderCard()
    const title = screen.getByRole('heading', {
      level: 2,
      name: 'Campus Compass',
    })

    expect(within(title).getByRole('link')).toHaveAttribute(
      'href',
      '/en/project/25-26/p1'
    )
    expect(
      screen.getByRole('link', { name: 'Live demo: Campus Compass' })
    ).toHaveAttribute('href', 'https://campus-compass.example.com')
    expect(
      screen.getByRole('link', { name: 'Source: Campus Compass' })
    ).toHaveAttribute('target', '_blank')
    expect(container.querySelectorAll('a a')).toHaveLength(0)
  })

  it('lists the stack and up to four contributors', () => {
    renderCard()
    const team = screen.getByRole('list', { name: 'Team' })

    expect(screen.getByRole('list', { name: 'Tech stack' })).toHaveTextContent(
      'FirebaseFlutter'
    )
    expect(within(team).getAllByRole('listitem')).toHaveLength(5)
    expect(team).toHaveTextContent('Kim Minji')
    expect(team).toHaveTextContent('+1')
  })

  it('writes the facets the filter island reads', () => {
    renderCard()
    const item = screen
      .getByRole('heading', { name: 'Campus Compass' })
      .closest('li[data-filter-item]')

    expect(item).toHaveAttribute('data-f-generation', '25-26')
    expect(item).toHaveAttribute('data-f-tag', 'Firebase|Flutter')
    expect(item).toHaveAttribute('data-f-links', 'demo|source')
    expect(item?.getAttribute('data-search')).toContain('campus compass')
  })

  it('falls back to English text on Korean pages', () => {
    renderCard('ko')

    expect(
      screen.getByRole('heading', { level: 2, name: 'Campus Compass' })
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '팀' })).toHaveTextContent('김민지')
  })
})
