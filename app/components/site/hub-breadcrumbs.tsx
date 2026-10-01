import Breadcrumbs from '@/app/components/site/breadcrumbs'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { toLocale } from '@/lib/i18n'

/**
 * "Home / Sessions". It needs `params`, so hubs render it in its own
 * Suspense leaf and keep their shared shell URL-free.
 */
export default async function HubBreadcrumbs({
  params,
  section,
}: {
  params: Promise<{ lang: string }>
  section: 'sessions' | 'projects' | 'members' | 'calendar'
}) {
  const lang = toLocale((await params).lang)
  const copy = archiveCommonCopy[lang]

  return (
    <Breadcrumbs
      label={copy.breadcrumb}
      items={[{ label: copy.home, href: `/${lang}` }, { label: copy[section] }]}
    />
  )
}
