'use client'

/**
 * 관리자 번역 사전을 클라이언트 컴포넌트에 전달하는 Context.
 *
 * 서버 레이아웃이 현재 언어의 사전을 한 번만 넘기고, 하위 클라이언트 컴포넌트는
 * `useAdminI18n()`으로 읽는다. props로 사전을 일일이 내려보내지 않기 위한 장치다.
 */
import {
  AdminMessages,
  AdminMessageKey,
  getAdminMessages,
} from '@/lib/admin-i18n'
import { Locale } from '@/lib/i18n'
import { createContext, useContext } from 'react'

/** Context 값: 언어, 사전 전체, 키로 문구를 찾는 `t`. */
interface AdminI18nContextValue {
  locale: Locale
  messages: AdminMessages
  t: (key: AdminMessageKey) => string
}

const AdminI18nContext = createContext<AdminI18nContextValue | null>(null)

/**
 * 관리자 레이아웃 최상단에서 사전을 제공한다.
 *
 * @param locale 관리자 화면 언어
 * @param messages 그 언어의 사전(`getAdminMessages(locale)`)
 */
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

/**
 * 관리자 번역 사전을 읽는다.
 *
 * Provider 밖(단독 테스트, 관리자 레이아웃 밖에서 재사용)에서도 깨지지 않도록 영어 사전으로
 * 대신한다.
 */
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
