import Link from 'next/link'

/**
 * 404 Not Found Page
 * @constructor
 */
export default function NotFoundPage() {
  return (
    <div className={'w-full h-screen flex items-center justify-center p-4'}>
      <div className={'flex flex-col gap-2'}>
        <div className={'text-4xl font-bold'}>404 Not Found</div>
        <Link href={'/'} className={'text-2xl font-semibold'}>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
