import Link from 'next/link'
import { ReactNode } from 'react'
import GDGoCLogo from '@/public/logo/gdg-lg.svg'
import { auth } from '@/auth'
import navigationList from '@/app/(admin)/admin/navigation-list'

/**
 * 사이드 바 네비게이션 컴포넌트
 * @param href - 이동할 경로
 * @param children - 내용
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
 * 관리자 페이지 사이드 바 (데스크탑에서만 활성화)
 * @constructor
 */
export default async function Sidebar() {
  const session = await auth()
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
        {(await navigationList(session?.user?.id)).map((item, i) => (
          <SidebarNavigator href={item.path} key={i}>
            {item.name}
          </SidebarNavigator>
        ))}
      </div>
    </div>
  )
}
