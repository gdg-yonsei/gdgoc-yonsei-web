import Link from 'next/link'
import { ReactNode } from 'react'
import { auth } from '@/auth'
import navigationList from '@/app/(admin)/admin/navigation-list'
import GDGLogo from '@/app/components/svg/gdg-logo'

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
        'rounded-lg bg-white p-2 px-4 text-lg font-semibold transition-all hover:bg-neutral-200'
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
        'fixed top-0 left-0 hidden h-screen w-60 bg-neutral-100 p-4 lg:block'
      }
    >
      <div className={'flex w-full items-center gap-2'}>
        <GDGLogo className={'w-12'} />
        <div className={'text-2xl font-bold'}>GYMS</div>
      </div>
      <div className={'flex w-full flex-col gap-4 pt-4'}>
        {(await navigationList(session?.user?.id)).map((item, i) => (
          <SidebarNavigator href={item.path} key={i}>
            {item.name}
          </SidebarNavigator>
        ))}
      </div>
    </div>
  )
}
