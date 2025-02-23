import MenuBarButton from '@/app/components/header/menu-bar-button'
import NavigationList from '@/app/components/header/navigation-list'
import GDGLogoLinkButton from '@/app/components/header/gdg-logo-link-button'

export default function Header() {
  return (
    <div className={'w-full bg-neutral-100 fixed top-0 left-0'}>
      <div className={'p-4 flex items-center justify-between'}>
        <GDGLogoLinkButton />
        <MenuBarButton />
      </div>
      <NavigationList />
    </div>
  )
}
