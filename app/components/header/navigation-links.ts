import type { Locale } from '@/i18n-config'

type HeaderNavigationLink = {
  href: string
  label: string
  prefetch?: false
}

export function getHeaderNavigationLinks(lang: Locale): HeaderNavigationLink[] {
  return [
    {
      href: `/${lang}/session`,
      label: lang === 'ko' ? '세션' : 'Sessions',
    },
    {
      href: `/${lang}/project`,
      label: lang === 'ko' ? '프로젝트' : 'Projects',
    },
    {
      href: `/${lang}/calendar`,
      label: lang === 'ko' ? '캘린더' : 'Calendar',
    },
    {
      href: `/${lang}/member`,
      label: lang === 'ko' ? '구성원' : 'Members',
    },
    { href: `/${lang}/admin`, label: 'GYMS', prefetch: false }
  ]
}
