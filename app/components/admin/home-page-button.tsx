import Link from 'next/link'

export default function HomePageButton() {
  return (
    <Link
      className={
        'flex w-full items-center justify-center gap-2 rounded-full border-2 border-neutral-900 bg-neutral-900 p-2 px-4 text-sm text-white transition-all hover:bg-neutral-800'
      }
      href={'/'}
    >
      Home Page
    </Link>
  )
}
