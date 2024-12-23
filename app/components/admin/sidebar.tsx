import Link from 'next/link'
import { ReactNode } from 'react'
import { navigationList } from '@/app/admin/navigation-list'
import GDGoCLogo from '@/public/logo/gdg-lg.svg'
import UserAuthControlPanel from '@/app/components/admin/user-auth-control-panel'

function SidebarNavigator({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={
        'p-2 px-4 rounded-lg bg-white text-lg font-semibold hover:bg-neutral-200 transition-all'
      }
    >
      {children}
    </Link>
  )
}

export default function Sidebar() {
  return (
    <div
      className={
        'w-60 p-4 h-screen fixed top-0 left-0 bg-neutral-100 hidden lg:block'
      }
    >
      <div className={'flex items-center gap-2 w-full'}>
        <GDGoCLogo className={'w-12'} />
        <div className={'text-2xl font-bold'}>GYMS</div>
      </div>
      <div className={'w-full flex flex-col gap-4 pt-4'}>
        {navigationList.map((item, i) => (
          <SidebarNavigator href={item.path} key={i}>
            {item.name}
          </SidebarNavigator>
        ))}
        <UserAuthControlPanel />
      </div>
    </div>
  )
}
