import type { MetadataRoute } from 'next'
import db from '@/db'
import getGenerationList from '@/lib/server/fetcher/getGenerationList'

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
  const generationList = await getGenerationList()

  const projectsList: MetadataRoute.Sitemap = (
    await db.query.projects.findMany({
      columns: {
        id: true,
        updatedAt: true,
        createdAt: true,
        generationId: true,
      },
    })
  ).map((project) => {
    const generationName = generationList.filter(
      (item) => item.id === project.generationId
    )[0].name
    return {
      url: `/project/${generationName}/${project.id}`,
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
      with: {
        part: {
          with: {
            generation: true,
          },
        },
      },
    })
  ).map((session) => {
    const generationName = generationList.filter(
      (item) => item.id === session.part.generationsId
    )[0].name
    return {
      url: `/session/${generationName}/${session.id}`,
      lastModified:
        session.updatedAt > session.createdAt
          ? session.updatedAt
          : session.createdAt,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  const centralPages: MetadataRoute.Sitemap = generationList.flatMap(
    (generation) => [
      {
        url: `/member/${generation.name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: `/session/${generation.name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: `/project/${generation.name}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
    ]
  )

  const sitemapList: MetadataRoute.Sitemap = [
    {
      url: '',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `/calendar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    {
      url: `/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
    ...centralPages,
    ...projectsList,
    ...sessionsList,
  ]

  return intlSitemapGenerator(sitemapList)
}
