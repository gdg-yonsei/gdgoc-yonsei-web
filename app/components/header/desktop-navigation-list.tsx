import Link from 'next/link'

export default function DesktopNavigationList() {
  return (
    <div className={'flex items-center gap-2 *:p-1 *:px-4 *:hover:underline'}>
      <Link href={'/members'}>Members</Link>
      <Link href={'/projects'}>Projects</Link>
      <Link href={'/sessions'}>Sessions</Link>
    </div>
  )
}
