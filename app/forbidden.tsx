import BackToPageButton from '@/app/components/back-to-page-button'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'

/**
 * 403 Forbidden Page
 * @constructor
 */
export default function Forbidden() {
  return (
    <div
      className={
        'w-screen h-screen flex items-center justify-center bg-neutral-100 p-4'
      }
    >
      <div
        className={
          'p-8 rounded-xl bg-white flex flex-col gap-4 w-full max-w-xl'
        }
      >
        <GDGoCYonseiLogo />
        <h1 className={'text-5xl font-bold md:text-6xl'}>403 Forbidden</h1>
        <p>
          You cannot access data with your current user account permissions.
        </p>
        <BackToPageButton />
      </div>
    </div>
  )
}
