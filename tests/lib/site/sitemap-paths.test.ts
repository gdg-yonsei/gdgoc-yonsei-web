import { describe, expect, it } from 'vitest'
import { buildSitemapPaths } from '@/lib/site/sitemap-paths'

const toAbsolute = (path: string) => new URL(path, 'https://x.dev').toString()
const item = (
  id: string,
  generationName: string,
  updatedAt: string,
  mainImage = '/session-default.png'
) => ({
  id,
  generationName,
  mainImage,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date(updatedAt),
})

const generations = [
  { name: '25-26', startDate: '2025-03-01' },
  { name: '24-25', startDate: '2024-03-01' },
]

describe('buildSitemapPaths', () => {
  const paths = buildSitemapPaths({
    generations,
    sessions: [
      item('s1', '25-26', '2025-11-05T00:00:00.000Z'),
      item(
        's2',
        '25-26',
        '2025-12-01T00:00:00.000Z',
        'https://cdn.example/s2.webp'
      ),
    ],
    projects: [
      item('p1', '24-25', '2025-06-01T00:00:00.000Z', '/project-default.png'),
    ],
    toAbsolute,
  })
  const byPath = new Map(paths.map((entry) => [entry.path, entry]))

  it('keeps member pages but drops empty session and project generation pages', () => {
    expect(byPath.has('/member/25-26')).toBe(true)
    expect(byPath.has('/member/24-25')).toBe(true)
    expect(byPath.has('/session/25-26')).toBe(true)
    expect(byPath.has('/session/24-25')).toBe(false)
    expect(byPath.has('/project/24-25')).toBe(true)
    expect(byPath.has('/project/25-26')).toBe(false)
  })

  it('dates hubs and generation pages by their newest item', () => {
    expect(byPath.get('/session')?.lastModified).toEqual(
      new Date('2025-12-01T00:00:00.000Z')
    )
    expect(byPath.get('/project/24-25')?.lastModified).toEqual(
      new Date('2025-06-01T00:00:00.000Z')
    )
  })

  it('lists real cover images only', () => {
    expect(byPath.get('/session/25-26/s2')?.images).toEqual([
      'https://cdn.example/s2.webp',
    ])
    expect(byPath.get('/session/25-26/s1')).not.toHaveProperty('images')
    expect(byPath.get('/project/24-25/p1')).not.toHaveProperty('images')
  })

  it('omits lastModified rather than writing an empty one', () => {
    const empty = buildSitemapPaths({
      generations,
      sessions: [],
      projects: [],
      toAbsolute,
    })
    expect(empty.find((entry) => entry.path === '/project')).toEqual({
      path: '/project',
    })
  })
})
