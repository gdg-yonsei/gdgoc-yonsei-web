import Link from 'next/link'

export default function DesktopNavigationList() {
  return (
    <div
      className={
        'flex items-center gap-2 text-lg *:p-1 *:px-4 not-md:hidden *:hover:underline'
      }
    >
      <Link href={'/members'}>Members</Link>
      <Link href={'/projects'}>Projects</Link>
      <Link href={'/sessions'}>Sessions</Link>
      <Link href={'/calendar'}>Calendar</Link>
      {/*<Link href={'/recruit'}>Recruit</Link>*/}
    </div>
  )
}
