import { ReactNode } from 'react'
import { auth } from '@/auth'
import { Metadata } from 'next'
import Header from '@/app/components/admin/header'
import JotaiProvider from '@/app/components/jotai-provider'
import Sidebar from '@/app/components/admin/sidebar'
import AuthProvider from '@/app/components/auth/auth-provider'
import getUserRole from '@/lib/server/fetcher/admin/get-user-role'
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
  const locale = await getAdminLocale()
  const messages = getAdminMessages(locale)

  /** 사용자가 로그인 되어 있는지 확인 */
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }
  // 인증되지 않은 사용자의 경우 접근 금지
  if ((await getUserRole(session?.user?.id)) === 'UNVERIFIED') {
    forbidden()
  }

  // 사용자의 권한에 따라 네비게이션 목록을 가져옴
  const navigations = await getAdminNavigationItems(session?.user?.id, locale)
  const resolvedScope = await resolveAdminGenerationScope(session.user.id)

  const cookieStore = await cookies()
  const theme = normalizeAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value)

  return (
    <AdminI18nProvider locale={locale} messages={messages}>
      <AuthProvider>
        <JotaiProvider>
          {/*
            테마와 로케일은 관리자 서브트리에만 적용합니다. `<html>`에 올리려면
            공유 루트 레이아웃에서 쿠키를 읽어야 하는데, 그러면 로그인 페이지까지
            blocking route가 됩니다. `@custom-variant dark`는 조상 어디에 `.dark`가
            있어도 매칭되므로 이 래퍼로 충분합니다.
          */}
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
            {/*
            셸 오프셋은 여기서 한 번만 계산합니다. 이전에는 각 페이지가
            `AdminDefaultLayout`을 통해 `pt-20 lg:pl-64`를 직접 들고 있었고,
            사이드바 실제 폭(w-60)과도 어긋나 있었습니다.
          */}
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
      </AuthProvider>
    </AdminI18nProvider>
  )
}
