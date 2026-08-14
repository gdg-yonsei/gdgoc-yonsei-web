import { ReactNode } from 'react'
import { getAuthSession } from '@/auth'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getAdminLocale, localizeAdminHref } from '@/lib/admin-i18n/server'

export const metadata: Metadata = {
  title: {
    default: 'GYMS',
    template: '%s | GYMS',
  },
  description:
    'Google Developer Group on Campus Yonsei University Management System',
}

export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  const locale = await getAdminLocale()
  const session = await getAuthSession()
  // 만약 로그인 되어 있다면 어드민 페이지로 이동
  if (session) {
    return redirect(localizeAdminHref('/admin', locale))
  }

  return <>{children}</>
}
