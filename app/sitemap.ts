import type { MetadataRoute } from 'next'
import db from '@/db'

function intlSitemapGenerator(MetadataRoute: MetadataRoute.Sitemap) {
  const langs = ['ko', 'en']

  return langs.flatMap((lang) => {
    return MetadataRoute.map((item) => ({
      ...item,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}${item.url}`,
      lastModified: item.lastModified || new Date(),
      changeFrequency: item.changeFrequency || 'monthly',
      priority: item.priority || 0.5,
    }))
  })
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projectsList: MetadataRoute.Sitemap = (
    await db.query.projects.findMany({
      columns: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
    })
  ).map((project) => {
    return {
      url: `/projects/${project.id}`,
      lastModified:
        project.updatedAt > project.createdAt
          ? project.updatedAt
          : project.createdAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  const sessionsList: MetadataRoute.Sitemap = (
    await db.query.sessions.findMany({
      columns: {
        id: true,
        updatedAt: true,
        createdAt: true,
      },
    })
  ).map((session) => {
    return {
      url: `/sessions/${session.id}`,
      lastModified:
        session.updatedAt > session.createdAt
          ? session.updatedAt
          : session.createdAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  const sitemapList: MetadataRoute.Sitemap = [
    {
      url: '',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `/sessions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `/members`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...projectsList,
    ...sessionsList,
  ]

  return intlSitemapGenerator(sitemapList)
}
