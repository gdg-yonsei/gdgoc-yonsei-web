import type { Locale } from '@/i18n-config'

type HeaderNavigationLink = {
  href: string
  label: string
  prefetch?: boolean
}

export function getHeaderNavigationLinks(lang: Locale): HeaderNavigationLink[] {
  return [
    {
      href: `/${lang}/session`,
      label: lang === 'ko' ? '세션' : 'Sessions', prefetch: true
    },
    {
      href: `/${lang}/project`,
      label: lang === 'ko' ? '프로젝트' : 'Projects', prefetch: true
    },
    {
      href: `/${lang}/calendar`,
      label: lang === 'ko' ? '캘린더' : 'Calendar', prefetch: true
    },
    {
      href: `/${lang}/member`,
      label: lang === 'ko' ? '구성원' : 'Members', prefetch: true
    },
    { href: `/${lang}/admin`, label: 'GYMS', prefetch: false }
  ]
}
