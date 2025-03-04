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
    <div className={'w-full fixed top-0 left-0 flex flex-col z-10 lg:hidden'}>
      <div className={'w-full bg-neutral-100 flex items-center justify-center'}>
        <div
          className={'flex justify-between items-center w-full max-w-4xl p-4'}
        >
          <Link
            href={'/admin'}
            className={'text-xl font-bold flex items-center gap-2'}
          >
            <GDGLogo className={'w-12 h-6'} />
            <p>GYMS</p>
          </Link>
          <ToggleMenubarButton />
        </div>
      </div>
      <MenuBar navigations={navigations} />
    </div>
  )
}
