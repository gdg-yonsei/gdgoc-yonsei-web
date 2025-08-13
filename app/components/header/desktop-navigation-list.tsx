import Link from 'next/link'

export default function DesktopNavigationList({ lang }: { lang: string }) {
  return (
    <div
      className={
        'flex items-center gap-2 text-lg *:p-1 *:px-4 not-md:hidden *:hover:underline'
      }
    >
      <Link href={'/projects'}>{lang === 'ko' ? '프로젝트' : 'Projects'}</Link>
      <Link href={'/sessions'}>{lang === 'ko' ? '세션' : 'Sessions'}</Link>
      <Link href={'/calendar'}>{lang === 'ko' ? '캘린더' : 'Calendar'}</Link>
      <Link href={'/members'}>{lang === 'ko' ? '구성원' : 'Members'}</Link>
      {/*<Link href={'/recruit'}>Recruit</Link>*/}
    </div>
  )
}
