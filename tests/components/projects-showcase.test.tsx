import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ProjectsShowcase from '@/app/components/home/projects-showcase'

const projects = [
  {
    id: 'p-1',
    name: 'Compass',
    nameKo: '나침반',
    description: 'Indoor navigation',
    descriptionKo: '실내 길찾기',
    mainImage: '/project-default.png',
    repoUrl: 'https://github.com/gdg-yonsei/compass',
    demoUrl: null,
    generationName: '25-26',
    tags: ['Next.js'],
  },
  {
    id: 'p-2',
    name: 'Lens',
    nameKo: '렌즈',
    description: 'Lecture summarization',
    descriptionKo: '강의 요약',
    mainImage: '/project-default.png',
    repoUrl: null,
    demoUrl: null,
    generationName: '25-26',
    tags: ['PyTorch'],
  },
]

describe('ProjectsShowcase', () => {
  it('links each card to its project detail page', () => {
    render(<ProjectsShowcase projects={projects} lang={'en'} />)
    expect(screen.getByRole('link', { name: /Compass/ })).toHaveAttribute(
      'href',
      '/en/project/25-26/p-1'
    )
  })

  it('filters cards by tag', () => {
    render(<ProjectsShowcase projects={projects} lang={'en'} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next.js' }))
    expect(screen.getByText('Compass')).toBeInTheDocument()
    expect(screen.queryByText('Lens')).not.toBeInTheDocument()
  })

  it('renders the empty placeholder when there are no projects', () => {
    render(<ProjectsShowcase projects={[]} lang={'ko'} />)
    expect(
      screen.getByText('어드민(GYMS)에서 프로젝트를 등록하면 이곳에 표시됩니다.')
    ).toBeInTheDocument()
  })
})
