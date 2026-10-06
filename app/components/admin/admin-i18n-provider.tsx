'use client'

/** 서버 레이아웃이 현재 언어 사전을 한 번 넘기고, 하위 컴포넌트는 Context로 공유한다. */
import {
  AdminMessages,
  AdminMessageKey,
  getAdminMessages,
} from '@/lib/admin-i18n'
import { Locale } from '@/lib/i18n'
import { createContext, useContext } from 'react'

interface AdminI18nContextValue {
  locale: Locale
  messages: AdminMessages
  t: (key: AdminMessageKey) => string
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null)

export default function AdminI18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: AdminMessages
  children: React.ReactNode
}) {
  const value: AdminI18nContextValue = {
    locale,
    messages,
    t: (key) => messages[key],
  }

  return (
    <AdminI18nContext.Provider value={value}>
      {children}
    </AdminI18nContext.Provider>
  )
}

/** Provider 밖의 테스트·재사용에서는 영어 사전으로 대체한다. */
export function useAdminI18n() {
  const context = useContext(AdminI18nContext)
  if (context) {
    return context
  }
  const fallbackMessages = getAdminMessages('en')
  return {
    locale: 'en' as Locale,
    messages: fallbackMessages,
    t: (key: AdminMessageKey) => fallbackMessages[key],
  }
}
