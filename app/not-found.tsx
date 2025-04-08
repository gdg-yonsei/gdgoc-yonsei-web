import Link from 'next/link'
import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'

/**
 * 404 Not Found Page
 * @constructor
 */
export default function NotFoundPage() {
  return (
    <div className={'w-full h-screen flex items-center justify-center p-4'}>
      <div className={'flex flex-col gap-4'}>
        <GDGoCYonseiLogo />
        <h1 className={'text-5xl md:text-6xl font-bold'}>404 Not Found</h1>
        <Link href={'/'} className={'text-2xl font-semibold underline'}>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
