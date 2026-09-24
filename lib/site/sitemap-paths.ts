import { countByGeneration, type GenerationRef } from '@/lib/site/generations'
import { isPlaceholderImage } from '@/lib/site/images'

export type SitemapPath = {
  path: string
  lastModified?: Date
  images?: string[]
}

type Dated = { createdAt: Date; updatedAt: Date }

type ListedItem = Dated & {
  id: string
  generationName: string
  mainImage: string
}

export const STATIC_SITEMAP_PATHS: readonly SitemapPath[] = [
  { path: '' },
  { path: '/calendar' },
  { path: '/member' },
  { path: '/privacy-policy' },
  { path: '/terms-of-service' },
  { path: '/2026-freshman-ot' },
]

const touched = (item: Dated) =>
  item.updatedAt > item.createdAt ? item.updatedAt : item.createdAt

function dated(path: string, items: readonly Dated[]): SitemapPath {
  const newest = items.reduce<Date | undefined>((latest, item) => {
    const date = touched(item)
    return !latest || date > latest ? date : latest
  }, undefined)
  return newest ? { path, lastModified: newest } : { path }
}

export function buildSitemapPaths({
  generations,
  sessions,
  projects,
  toAbsolute,
}: {
  generations: readonly GenerationRef[]
  sessions: readonly ListedItem[]
  projects: readonly ListedItem[]
  toAbsolute: (path: string) => string
}): SitemapPath[] {
  const sessionCounts = countByGeneration(sessions)
  const projectCounts = countByGeneration(projects)
  const inGeneration = (items: readonly ListedItem[], name: string) =>
    items.filter((item) => item.generationName === name)
  const detail =
    (section: 'session' | 'project') =>
    (item: ListedItem): SitemapPath => ({
      path: `/${section}/${item.generationName}/${item.id}`,
      lastModified: touched(item),
      ...(isPlaceholderImage(item.mainImage)
        ? {}
        : { images: [toAbsolute(item.mainImage)] }),
    })

  return [
    ...STATIC_SITEMAP_PATHS,
    dated('/session', sessions),
    dated('/project', projects),
    ...generations.flatMap(({ name }) => [
      { path: `/member/${name}` },
      ...(sessionCounts.get(name)
        ? [dated(`/session/${name}`, inGeneration(sessions, name))]
        : []),
      ...(projectCounts.get(name)
        ? [dated(`/project/${name}`, inGeneration(projects, name))]
        : []),
    ]),
    ...projects.map(detail('project')),
    ...sessions.map(detail('session')),
  ]
}
