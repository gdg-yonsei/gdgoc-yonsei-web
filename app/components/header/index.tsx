import GDGoCYonseiLogo from '@/app/components/gdgoc-yonsei-logo'
import GDGLogo from '@/public/logo/gdg-lg.svg'
import Link from 'next/link'
import MenuBarButton from '@/app/components/header/menu-bar-button'
import NavigationList from '@/app/components/header/navigation-list'

export default function Header() {
  return (
    <div className={'w-full bg-neutral-100'}>
      <div className={'p-2 flex items-center justify-between '}>
        <Link href={'/'}>
          <GDGoCYonseiLogo className={'not-md:hidden'} />
          <GDGLogo className={'w-16 md:w-24 md:hidden'} />
        </Link>
        <MenuBarButton />
      </div>
      <NavigationList />
    </div>
  )
}
