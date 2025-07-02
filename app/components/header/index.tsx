import GDGLogoLinkButton from '@/app/components/header/gdg-logo-link-button'
import MenuBarButton from './menu-bar-button'
import DesktopNavigationList from '@/app/components/header/desktop-navigation-list'
import NavigationList from '@/app/components/header/navigation-list'

export default function Header() {
  return (
    <div className={'w-full bg-neutral-100 fixed top-0 left-0 z-10'}>
      <div className={'p-4 flex items-center justify-between'}>
        <GDGLogoLinkButton />
        <MenuBarButton />
        <DesktopNavigationList />
      </div>
      <NavigationList />
    </div>
  )
}
