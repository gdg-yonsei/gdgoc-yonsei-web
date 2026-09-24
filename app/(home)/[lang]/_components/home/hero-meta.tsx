import type { Locale } from '@/i18n-config'
import { getCachedSessionVisibilityBucket } from '@/lib/server/cache/session-visibility'
import { getProjectShowcase } from '@/lib/server/queries/public/projects'
import { getSessionArchive } from '@/lib/server/queries/public/sessions'
import { HeroMetaList } from './hero'

/** Live counts from the same read models as the hubs. */
export default async function HeroMeta({ lang }: { lang: Locale }) {
  const visibilityBucket = await getCachedSessionVisibilityBucket()
  const [sessions, projects] = await Promise.all([
    getSessionArchive(visibilityBucket),
    getProjectShowcase(),
  ])
  const generations = new Set([
    ...sessions.map((session) => session.generationName),
    ...projects.map((project) => project.generationName),
  ]).size

  return (
    <HeroMetaList
      lang={lang}
      counts={{
        sessions: sessions.length,
        projects: projects.length,
        generations,
      }}
    />
  )
}
