import type { MetadataRoute } from 'next'
import db from '@/db'

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
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${project.id}`,
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
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/${session.id}`,
      lastModified:
        session.updatedAt > session.createdAt
          ? session.updatedAt
          : session.createdAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  return [
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/sessions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/members`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/recruit`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...projectsList,
    ...sessionsList,
  ]
}
