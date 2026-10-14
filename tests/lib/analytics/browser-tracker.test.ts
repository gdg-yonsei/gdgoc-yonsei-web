import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readBrowserStorage,
  sendBeaconOrFetch,
} from '@/lib/analytics/tracker/browser'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('readBrowserStorage', () => {
  it('uses localStorage when it works', () => {
    expect(readBrowserStorage().persistent).toBe(true)
  })

  it('falls back to memory storage when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const { storage, persistent } = readBrowserStorage()
    expect(persistent).toBe(false)
    storage.setItem('k', 'v')
    expect(storage.getItem('k')).toBe('v')
  })
})

describe('sendBeaconOrFetch', () => {
  it('prefers sendBeacon and falls back to keepalive fetch', () => {
    const sendBeacon = vi.fn(() => false)
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })

    sendBeaconOrFetch('{"events":[]}')
    expect(sendBeacon).toHaveBeenCalledWith('/api/pulse', expect.any(Blob))
    expect(fetchMock).toHaveBeenCalledWith('/api/pulse', {
      method: 'POST',
      body: '{"events":[]}',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    })
  })
})
