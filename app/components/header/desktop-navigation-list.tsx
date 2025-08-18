import Link from 'next/link'

export default function DesktopNavigationList({ lang }: { lang: string }) {
  return (
    <div
      className={
        'flex items-center gap-2 text-lg *:p-1 *:px-4 not-md:hidden *:hover:underline'
      }
    >
      <Link href={'/project'}>{lang === 'ko' ? '프로젝트' : 'Project'}</Link>
      <Link href={'/session'}>{lang === 'ko' ? '세션' : 'Session'}</Link>
      <Link href={'/calendar'}>{lang === 'ko' ? '캘린더' : 'Calendar'}</Link>
      <Link href={'/member'}>{lang === 'ko' ? '구성원' : 'Member'}</Link>
      {/*<Link href={'/recruit'}>Recruit</Link>*/}
    </div>
  )
}
