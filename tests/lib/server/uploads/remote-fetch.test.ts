import { describe, expect, it, vi } from 'vitest'
import {
  fetchPublicImage,
  isPublicAddress,
} from '@/lib/server/uploads/remote-fetch'

describe('isPublicAddress', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '::1',
    '::',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    'not-an-ip',
  ])('blocks %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false)
  })

  it('allows public addresses', () => {
    expect(isPublicAddress('93.184.216.34')).toBe(true)
    expect(isPublicAddress('2606:2800:220:1:248:1893:25c8:1946')).toBe(true)
  })
})

describe('fetchPublicImage', () => {
  const publicLookup = vi.fn(async () => '93.184.216.34')

  it('rejects non-https URLs', async () => {
    await expect(
      fetchPublicImage('http://example.com/a.png', {
        maxBytes: 10,
        lookup: publicLookup,
      })
    ).rejects.toMatchObject({ code: 'BLOCKED_URL' })
  })

  it('rejects hosts that resolve to private addresses', async () => {
    const fetchImpl = vi.fn()
    await expect(
      fetchPublicImage('https://internal.test/a.png', {
        maxBytes: 10,
        lookup: async () => '10.0.0.5',
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: 'BLOCKED_URL' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('blocks a redirect to a private address on the second hop', async () => {
    const lookup = vi.fn(async (host: string) =>
      host === 'public.test' ? '93.184.216.34' : '10.0.0.5'
    )
    const fetchImpl = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://internal.test/x.png' },
        })
    )
    await expect(
      fetchPublicImage('https://public.test/a.png', {
        maxBytes: 10,
        lookup,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: 'BLOCKED_URL' })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('gives up after too many redirects', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(null, { status: 302, headers: { location: '/again' } })
    )
    await expect(
      fetchPublicImage('https://public.test/a.png', {
        maxBytes: 10,
        lookup: publicLookup,
        fetchImpl,
        maxRedirects: 2,
      })
    ).rejects.toMatchObject({ code: 'BLOCKED_URL' })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('rejects a declared content-length over the limit', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('x', {
          headers: { 'content-type': 'image/png', 'content-length': '999' },
        })
    )
    await expect(
      fetchPublicImage('https://public.test/a.png', {
        maxBytes: 10,
        lookup: publicLookup,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: 'TOO_LARGE' })
  })

  it('rejects non-image responses', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('<html>', { headers: { 'content-type': 'text/html' } })
    )
    await expect(
      fetchPublicImage('https://public.test/a.png', {
        maxBytes: 10,
        lookup: publicLookup,
        fetchImpl,
      })
    ).rejects.toMatchObject({ code: 'NOT_IMAGE' })
  })

  it('returns the body stream and content type for a public image', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('png', {
          headers: {
            'content-type': 'image/png; charset=binary',
            'content-length': '3',
          },
        })
    )
    const result = await fetchPublicImage('https://public.test/a.png', {
      maxBytes: 10,
      lookup: publicLookup,
      fetchImpl,
    })
    expect(result.contentType).toBe('image/png')
    expect(result.contentLength).toBe(3)
    expect(result.body).toBeInstanceOf(ReadableStream)
  })
})
