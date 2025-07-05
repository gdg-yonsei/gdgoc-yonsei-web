import Link from 'next/link'
import ToggleMenubarButton from '@/app/components/admin/toggle-menubar-button'
import MenuBar from '@/app/components/admin/menu-bar'
import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import GDGLogo from '@/app/components/svg/gdg-logo'

/**
 * 모바일 화면에서 보이는 관리자 페이지 헤더
 * @constructor
 */
export default function Header({
  navigations,
}: {
  navigations: NavigationItem[]
}) {
  return (
    <div className={'fixed top-0 left-0 z-10 flex w-full flex-col lg:hidden'}>
      <div className={'flex w-full items-center justify-center bg-neutral-100'}>
        <div
          className={'flex w-full max-w-4xl items-center justify-between p-4'}
        >
          <Link
            href={'/admin'}
            className={'flex items-center gap-2 text-xl font-bold'}
          >
            <GDGLogo className={'h-6 w-12'} />
            <p>GYMS</p>
          </Link>
          <ToggleMenubarButton />
        </div>
      </div>
      <MenuBar navigations={navigations} />
    </div>
  )
}
