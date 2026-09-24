import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import ProjectDetailView, {
  type ProjectDetail,
} from '@/app/components/site/project-detail/project-detail-view'
import {
  archiveCommonCopy,
  projectArchiveCopy,
} from '@/lib/contents/archive-copy'

const detail: ProjectDetail = {
  id: 'p1',
  name: 'Campus Compass',
  nameKo: '캠퍼스 나침반',
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
    {
      id: 'u1',
      nameEn: 'Kim Minji',
      nameKo: '김민지',
      image: null,
      githubId: '@minji',
    },
  ],
  content: '## How it works',
  images: [],
}

const sibling = { ...detail, id: 'p2', name: 'Lecture Lens', nameKo: null }

function renderDetail(
  overrides: Partial<ProjectDetail> = {},
  withSibling = false
) {
  return render(
    <ProjectDetailView
      lang="en"
      project={{ ...detail, ...overrides }}
      more={withSibling ? [sibling] : []}
      next={withSibling ? sibling : null}
      copy={projectArchiveCopy.en}
      common={archiveCommonCopy.en}
    />
  )
}

describe('ProjectDetailView', () => {
  it('leads with the title, the summary and the outbound links', () => {
    renderDetail()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Campus Compass' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Indoor navigation for Yonsei campus buildings.')
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('link', { name: /^Live demo/ })[0]
    ).toHaveAttribute('href', 'https://campus-compass.example.com')
    expect(screen.getAllByRole('link', { name: /^Source/ })[0]).toHaveAttribute(
      'href',
      'https://github.com/gdg-yonsei/campus-compass'
    )
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole(
        'link',
        { name: '25-26' }
      )
    ).toHaveAttribute('href', '/en/project/25-26')
  })

  it('keeps the team, the stack and the dates in the sidebar', () => {
    renderDetail()
    const aside = screen.getByRole('complementary', { name: 'Project details' })

    expect(within(aside).getByText('Kim Minji')).toBeInTheDocument()
    expect(
      within(aside).getByRole('link', { name: 'Kim Minji GitHub' })
    ).toHaveAttribute('href', 'https://github.com/minji')
    expect(
      within(aside).getByRole('link', { name: 'Meet the 25-26 members' })
    ).toHaveAttribute('href', '/en/member/25-26')
    expect(within(aside).getByText('Flutter')).toBeInTheDocument()
    expect(within(aside).getByText('Mar 1, 2025')).toHaveAttribute(
      'datetime',
      '2025-03-01'
    )
  })

  it('links more projects from the generation and the next one', () => {
    renderDetail({}, true)

    expect(
      screen.getByRole('heading', { level: 2, name: 'More from 25-26' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Next project/ })).toHaveAttribute(
      'href',
      '/en/project/25-26/p2'
    )
  })

  it('shows a gallery only for real content images', () => {
    renderDetail({ images: ['/project-default.png'] })
    expect(screen.queryByRole('heading', { name: 'Gallery' })).toBeNull()

    renderDetail({
      images: [
        'https://image.gdgyonsei.moveto.kr/projects/1.webp',
        'https://image.gdgyonsei.moveto.kr/projects/2.webp',
      ],
    })
    expect(screen.getByRole('heading', { name: 'Gallery' })).toBeInTheDocument()
  })
})
