import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function request(path: string) {
  return new NextRequest(`https://gdgoc.yonsei.ac.kr${path}`, {
    headers: { 'accept-language': 'en' },
  })
}

describe('locale proxy', () => {
  it('redirects arbitrary dotted paths through locale routing', async () => {
    const response = await proxy(request('/foo.bar'))

    expect(response?.status).toBe(307)
    expect(response?.headers.get('location')).toBe(
      'https://gdgoc.yonsei.ac.kr/en/foo.bar'
    )
  })

  it('leaves known public files, APIs, and auth routes unlocalized', async () => {
    for (const path of [
      '/opengraph-image.png',
      '/favicon.ico',
      '/manifest.webmanifest',
      '/naver3b021b84fe69d06591a1108d6f26afac.html',
      '/llms.txt',
      '/api/auth/session',
      '/auth/sign-in',
    ]) {
      const response = await proxy(request(path))

      expect(response?.status, path).toBe(200)
      expect(response?.headers.get('location'), path).toBeNull()
      expect(response?.headers.get('x-middleware-next'), path).toBe('1')
    }
  })

  it('does not redirect supported locale paths', async () => {
    await expect(proxy(request('/ko/privacy-policy'))).resolves.toBeUndefined()
  })

  it('rejects malformed public detail identifiers before rendering', async () => {
    const response = await proxy(request('/ko/project/25-26/not-a-valid-uuid'))

    expect(response?.status).toBe(404)
    await expect(response?.text()).resolves.toContain('404 Not Found')
  })
})
