import Breadcrumbs from '@/app/components/site/breadcrumbs'
import { archiveCommonCopy } from '@/lib/contents/archive-copy'
import { getLocale } from '@/lib/i18n/server'
import { localeHref } from '@/lib/site/routes'

/** getLocale을 읽는 경로 표시를 별도 Suspense로 두어, 허브 공유 셸이 URL을 기다리지 않게 한다. */
export default async function HubBreadcrumbs({
  section,
}: {
  section: 'sessions' | 'projects' | 'members' | 'calendar'
}) {
  const lang = await getLocale()
  const copy = archiveCommonCopy[lang]

  return (
    <Breadcrumbs
      label={copy.breadcrumb}
      items={[
        { label: copy.home, href: localeHref(lang) },
        { label: copy[section] },
      ]}
    />
  )
}
