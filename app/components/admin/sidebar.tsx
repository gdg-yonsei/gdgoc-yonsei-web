import Link from 'next/link'
import { ReactNode } from 'react'
import UserAuthControlPanel from '@/app/components/admin/user-auth-control-panel'
import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import GDGLogo from '@/app/components/svg/gdg-logo'
import RefreshAllDataButton from '@/app/components/admin/refresh-all-data-button'

/**
 * 사이드 바 내비게이터
 * @param href
 * @param children
 * @constructor
 */
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

/**
 * 데스크탑 화면에서 보이는 사이드 바
 * @constructor
 */
export default function Sidebar({
  navigations,
}: {
  navigations: NavigationItem[]
}) {
  return (
    <div
      className={
        'w-60 p-4 h-screen fixed top-0 left-0 bg-neutral-100 hidden lg:block'
      }
    >
      {/*관리자 페이지 사이드바 제목*/}
      <div className={'flex items-center gap-2 w-full'}>
        <GDGLogo className={'w-12'} />
        <div className={'text-2xl font-bold'}>GYMS</div>
      </div>
      {/*관리자 페이지 내비게이터 리스트*/}
      <div className={'w-full flex flex-col gap-4 pt-4'}>
        {navigations.map((item, i) => (
          <SidebarNavigator href={item.path} key={i}>
            {item.name}
          </SidebarNavigator>
        ))}
        <UserAuthControlPanel />
        <RefreshAllDataButton />
      </div>
    </div>
  )
}
