import Link from 'next/link'

export default function HomePage() {
  return (
    <div
      className={
        'w-full min-h-screen flex items-center justify-center flex-col gap-2'
      }
    >
      <div className={'text-4xl font-bold'}>GDGoC Yonsei</div>
      <Link href={'/admin'}>Admin Page</Link>
    </div>
  )
}
