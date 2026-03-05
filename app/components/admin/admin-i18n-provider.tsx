'use client'

import {
  AdminMessages,
  AdminMessageKey,
  getAdminMessages,
} from '@/lib/admin-i18n'
import { Locale } from '@/i18n-config'
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

export function useAdminI18n() {
  const context = useContext(AdminI18nContext)
  if (context) {
    return context
  }
  const fallbackMessages = getAdminMessages('en')
  return {
    locale: 'en',
    messages: fallbackMessages,
    t: (key: AdminMessageKey) => fallbackMessages[key],
  }
}
