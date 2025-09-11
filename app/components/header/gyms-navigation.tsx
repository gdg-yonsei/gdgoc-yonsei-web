import { auth } from '@/auth'
import Link from 'next/link'

export default async function GYMSNavigation() {
  const session = await auth()

  if (session?.user?.id) {
    return <Link href={'/admin'}>GYMS</Link>
  }
  return <></>
}
