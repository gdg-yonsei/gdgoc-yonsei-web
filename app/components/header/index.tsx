import GDGLogoLinkButton from '@/app/components/header/gdg-logo-link-button'
import MenuBarButton from './menu-bar-button'
import DesktopNavigationList from '@/app/components/header/desktop-navigation-list'
import NavigationList from '@/app/components/header/navigation-list'

export default function Header({ lang }: { lang: string }) {
  return (
    <div className={'fixed top-0 left-0 z-10 w-full bg-neutral-100'}>
      <div className={'flex items-center justify-between p-4'}>
        <GDGLogoLinkButton />
        <MenuBarButton />
        <DesktopNavigationList lang={lang} />
      </div>
      <NavigationList lang={lang} />
    </div>
  )
}
