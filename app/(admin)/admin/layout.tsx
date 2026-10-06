/** 미로그인 사용자는 로그인 화면으로 보내고, 가입 승인 전 UNVERIFIED는 403으로 막는다. */
import { ReactNode } from 'react'
import { getAuthSession } from '@/auth'
import { Metadata } from 'next'
import Header from '@/app/components/admin/header'
import JotaiProvider from '@/app/components/admin/jotai-provider'
import Sidebar from '@/app/components/admin/sidebar'
import { getUserRole } from '@/lib/server/fetcher/admin/get-user-role'
import getAdminNavigationItems from '@/app/(admin)/admin/navigation-list'
import { forbidden, redirect } from 'next/navigation'
import Modal from '@/app/components/admin/modal'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import MobileTabBar from '@/app/components/admin/mobile-tab-bar'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { cookies } from 'next/headers'
import { ADMIN_THEME_COOKIE, normalizeAdminTheme } from '@/lib/admin-theme'
import { cn } from '@/lib/cn'

export const metadata: Metadata = {
  title: {
    default: 'GYMS',
    template: '%s | GYMS',
  },
  description:
    'Google Developer Group on Campus Yonsei University Management System',
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const [locale, session] = await Promise.all([
    getAdminLocale(),
    getAuthSession(),
  ])
  const messages = getAdminMessages(locale)

  const userId = session?.user?.id
  if (!userId) {
    redirect('/auth/sign-in')
  }
  if ((await getUserRole(userId)) === 'UNVERIFIED') {
    forbidden()
  }

  // 역할 조회는 요청 단위로 캐시되므로 아래 작업들은 서로 기다릴 필요가 없다.
  const [navigations, resolvedScope, cookieStore] = await Promise.all([
    getAdminNavigationItems(userId, locale),
    resolveAdminGenerationScope(userId),
    cookies(),
  ])
  const theme = normalizeAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value)

  return (
    <AdminI18nProvider locale={locale} messages={messages}>
      <JotaiProvider>
        {/* 루트에서 쿠키를 읽으면 로그인까지 요청을 기다리므로, 테마·언어는 관리자 래퍼에 적용한다.
         * dark 변형은 조상의 .dark에도 적용된다. */}
        <div
          id={'admin-theme-root'}
          lang={locale}
          className={cn(
            'bg-canvas text-ink min-h-dvh',
            theme === 'dark' && 'dark'
          )}
        >
          <a href={'#admin-main'} className={'admin-skip-link'}>
            {messages.skipToContent}
          </a>
          <Header
            navigations={navigations}
            locale={locale}
            resolvedScope={resolvedScope}
            theme={theme}
          />
          <Sidebar
            navigations={navigations}
            locale={locale}
            resolvedScope={resolvedScope}
            theme={theme}
          />
          {/* 사이드바의 w-64와 본문 lg:pl-64는 같은 폭이어야 한다. */}
          <main
            id={'admin-main'}
            className={'min-h-dvh pb-20 lg:pb-0 lg:pl-64'}
          >
            <div className={'mx-auto w-full max-w-[1400px] p-4 lg:p-6'}>
              {children}
            </div>
          </main>
          <MobileTabBar navigations={navigations} />
          <Modal />
        </div>
      </JotaiProvider>
    </AdminI18nProvider>
  )
}
