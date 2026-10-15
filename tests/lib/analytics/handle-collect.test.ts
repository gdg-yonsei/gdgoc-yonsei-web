import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { pruneExpiredAnalytics } = vi.hoisted(() => ({
  pruneExpiredAnalytics: vi.fn(async () => 0),
}))

vi.mock('@/lib/server/admin-route-exists', () => ({
  hasApprovedSession: vi.fn(async () => false),
}))
vi.mock('@/lib/server/analytics/collect/retention', () => ({
  claimPruneSlot: vi.fn(() => true),
  pruneExpiredAnalytics,
}))

import {
  handleCollectRequest,
  type CollectDependencies,
} from '@/lib/server/analytics/collect/handle-collect'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

const batch = {
  events: [
    {
      type: 'page_view',
      ageMs: 0,
      pageViewId: '9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33',
      sessionId: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
      visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22',
      isNewVisitor: true,
      isSessionStart: true,
      sequence: 1,
      path: '/ko',
      isNotFound: false,
    },
  ],
}

function request(
  body: string = JSON.stringify(batch),
  headers: Record<string, string> = {}
) {
  return new NextRequest('https://gdgoc.yonsei.ac.kr/api/pulse', {
    method: 'POST',
    body,
    headers: {
      origin: 'https://gdgoc.yonsei.ac.kr',
      'user-agent': CHROME,
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      ...headers,
    },
  })
}

function dependencies(
  overrides: Partial<CollectDependencies> = {}
): CollectDependencies {
  return {
    store: vi.fn(async () => {}),
    rateLimiter: { consume: vi.fn(() => true) },
    isInternal: vi.fn(async () => false),
    now: () => new Date('2026-10-14T05:00:00.000Z'),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleCollectRequest', () => {
  it('stores a valid same-origin batch and answers 204', async () => {
    const deps = dependencies()
    const response = await handleCollectRequest(request(), deps)

    expect(response.status).toBe(204)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(deps.rateLimiter.consume).toHaveBeenCalledWith('203.0.113.7', 1)
    expect(deps.store).toHaveBeenCalledWith(
      batch.events,
      expect.objectContaining({
        siteHost: 'gdgoc.yonsei.ac.kr',
        userAgent: { deviceType: 'desktop', browser: 'Chrome', os: 'Windows' },
      })
    )
    expect(pruneExpiredAnalytics).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'a foreign origin',
      request(undefined, { origin: 'https://evil.example' }),
    ],
    ['a bot user agent', request(undefined, { 'user-agent': 'curl/8.9.1' })],
    ['invalid JSON', request('{not json')],
    ['a schema violation', request(JSON.stringify({ events: [] }))],
    [
      'an oversized body',
      request(JSON.stringify({ ...batch, pad: 'x'.repeat(17_000) })),
    ],
  ])('drops %s with 204', async (_label, incoming) => {
    const deps = dependencies()
    const response = await handleCollectRequest(incoming, deps)
    expect(response.status).toBe(204)
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('accepts a missing Origin only for same-origin fetch metadata', async () => {
    const deps = dependencies()
    await handleCollectRequest(
      request(undefined, { origin: '', 'sec-fetch-site': 'same-origin' }),
      deps
    )
    expect(deps.store).toHaveBeenCalledTimes(1)
  })

  it('drops the batch when the rate limit is exceeded', async () => {
    const deps = dependencies({ rateLimiter: { consume: vi.fn(() => false) } })
    await handleCollectRequest(request(), deps)
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('resolves the internal flag lazily and once', async () => {
    const isInternal = vi.fn(async () => true)
    const store = vi.fn<CollectDependencies['store']>(
      async (_events, context) => {
        await expect(context.resolveIsInternal()).resolves.toBe(true)
        await expect(context.resolveIsInternal()).resolves.toBe(true)
      }
    )
    await handleCollectRequest(request(), dependencies({ isInternal, store }))
    expect(isInternal).toHaveBeenCalledTimes(1)
  })

  it('treats a failing internal check as external traffic', async () => {
    const store = vi.fn<CollectDependencies['store']>(
      async (_events, context) => {
        await expect(context.resolveIsInternal()).resolves.toBe(false)
      }
    )
    await handleCollectRequest(
      request(),
      dependencies({
        isInternal: vi.fn(async () => Promise.reject(new Error('db down'))),
        store,
      })
    )
    expect(store).toHaveBeenCalledTimes(1)
  })

  it('answers 204 even when storing fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleCollectRequest(
      request(),
      dependencies({
        store: vi.fn(async () => Promise.reject(new Error('db down'))),
      })
    )
    expect(response.status).toBe(204)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
