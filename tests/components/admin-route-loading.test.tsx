import { describe, expect, it, vi } from 'vitest'
import { within } from '@testing-library/react'
import { renderToReadableStream } from 'react-dom/server.browser'
import Loading from '@/app/(admin)/loading'

const request = vi.hoisted(() => ({
  headers: new Headers(),
  cookieLocale: undefined as string | undefined,
}))

vi.mock('next/headers', () => ({
  headers: async () => request.headers,
  cookies: async () => ({
    get: (name: string) =>
      name === 'admin-locale' && request.cookieLocale
        ? { name, value: request.cookieLocale }
        : undefined,
  }),
}))

describe('admin route loading outside the locale provider', () => {
  it.each([
    { header: 'ko', cookie: 'en', locale: 'ko', label: '불러오는 중' },
    { header: 'en', cookie: 'ko', locale: 'en', label: 'Loading' },
    { header: undefined, cookie: 'ko', locale: 'ko', label: '불러오는 중' },
    { header: undefined, cookie: undefined, locale: 'en', label: 'Loading' },
  ])(
    'announces $locale for header=$header and cookie=$cookie before the admin layout renders',
    async ({ header, cookie, locale, label }) => {
      request.headers = new Headers(header ? { 'x-admin-locale': header } : {})
      request.cookieLocale = cookie
      const stream = await renderToReadableStream(<Loading />)
      await stream.allReady
      const container = document.createElement('div')
      container.innerHTML = await new Response(stream).text()
      const status = within(container).getByRole('status')
      expect(status).toHaveTextContent(label)
      expect(status).toHaveAttribute('lang', locale)
      expect(status).not.toHaveAttribute('aria-hidden', 'true')
    }
  )
})
