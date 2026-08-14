import { getAuthSession } from '@/auth'
import Link from 'next/link'
import { Locale } from '@/i18n-config'

export default async function AdminDashboardLink({ lang }: { lang: Locale }) {
  const session = await getAuthSession()

  if (session?.user?.id) {
    return <Link href={`/${lang}/admin`}>GYMS</Link>
  }
  return <></>
}
