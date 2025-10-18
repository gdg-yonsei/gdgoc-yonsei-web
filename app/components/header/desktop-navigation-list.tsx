import Link from 'next/link'
import getLastGeneration from '@/lib/server/fetcher/getLastGeneration'
import GYMSNavigation from '@/app/components/header/gyms-navigation'
import { Suspense } from 'react'
import { Locale } from '@/i18n-config'

export default async function DesktopNavigationList({
  lang,
}: {
  lang: Locale
}) {
  const lastGeneration = await getLastGeneration()
  return (
    <div
      className={
        'flex items-center gap-2 text-lg *:p-1 *:px-4 not-md:hidden *:hover:underline'
      }
    >
      <Suspense>
        <GYMSNavigation />
      </Suspense>
      <Link
        href={`/${lang}/session${lastGeneration ? '/' + lastGeneration.name : ''}`}
      >
        {lang === 'ko' ? '세션' : 'Session'}
      </Link>
      <Link
        href={`/${lang}/project${lastGeneration ? '/' + lastGeneration.name : ''}`}
      >
        {lang === 'ko' ? '프로젝트' : 'Project'}
      </Link>
      <Link href={`/${lang}/calendar`}>
        {lang === 'ko' ? '캘린더' : 'Calendar'}
      </Link>
      <Link
        href={`/${lang}/member${lastGeneration ? '/' + lastGeneration.name : ''}`}
      >
        {lang === 'ko' ? '구성원' : 'Member'}
      </Link>
      {/*<Link href={'/recruit'}>Recruit</Link>*/}
    </div>
  )
}
