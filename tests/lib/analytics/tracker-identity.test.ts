import { describe, expect, it } from 'vitest'
import {
  isTrackingAllowed,
  optIn,
  optOut,
  startPageView,
  touchSession,
  type KeyValueStorage,
} from '@/lib/analytics/tracker/identity'

function memoryStorage(
  initial: Record<string, string> = {}
): KeyValueStorage & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

const ids = () => {
  let n = 0
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`
}

const MINUTE = 60_000

describe('startPageView', () => {
  it('creates a visitor and a session on the first visit', () => {
    const storage = memoryStorage()
    const visit = startPageView(storage, 0, ids(), true)
    expect(visit).toEqual({
      visitorId: '00000000-0000-4000-8000-000000000001',
      sessionId: '00000000-0000-4000-8000-000000000002',
      isNewVisitor: true,
      isSessionStart: true,
      sequence: 1,
    })
  })

  it('continues the session within 30 minutes and keeps the new-visitor flag', () => {
    const storage = memoryStorage()
    const createId = ids()
    const first = startPageView(storage, 0, createId, true)
    const second = startPageView(storage, 29 * MINUTE, createId, true)
    expect(second).toEqual({ ...first, isSessionStart: false, sequence: 2 })
  })

  it('starts a returning-visitor session after 30 minutes of inactivity', () => {
    const storage = memoryStorage()
    const createId = ids()
    const first = startPageView(storage, 0, createId, true)
    const later = startPageView(storage, 31 * MINUTE, createId, true)
    expect(later.visitorId).toBe(first.visitorId)
    expect(later.sessionId).not.toBe(first.sessionId)
    expect(later).toMatchObject({
      isNewVisitor: false,
      isSessionStart: true,
      sequence: 1,
    })
  })

  it('extends the session when activity is touched', () => {
    const storage = memoryStorage()
    const createId = ids()
    const first = startPageView(storage, 0, createId, true)
    touchSession(storage, 25 * MINUTE)
    expect(startPageView(storage, 50 * MINUTE, createId, true).sessionId).toBe(
      first.sessionId
    )
  })

  it('replaces a corrupted visitor id and session', () => {
    const storage = memoryStorage({ gyms_vid: 'tampered', gyms_sid: '{broken' })
    const visit = startPageView(storage, 0, ids(), true)
    expect(visit.visitorId).toBe('00000000-0000-4000-8000-000000000001')
    expect(visit.isSessionStart).toBe(true)
  })

  it('never reports a new visitor without persistent storage', () => {
    expect(startPageView(memoryStorage(), 0, ids(), false).isNewVisitor).toBe(
      false
    )
  })
})

describe('isTrackingAllowed', () => {
  const nav = (extra: object = {}) =>
    ({ webdriver: false, ...extra }) as unknown as Navigator

  it('honours GPC, webdriver and the opt-out flag', () => {
    expect(isTrackingAllowed(nav(), memoryStorage())).toBe(true)
    expect(
      isTrackingAllowed(nav({ globalPrivacyControl: true }), memoryStorage())
    ).toBe(false)
    expect(isTrackingAllowed(nav({ webdriver: true }), memoryStorage())).toBe(
      false
    )
    expect(isTrackingAllowed(nav(), memoryStorage({ gyms_optout: '1' }))).toBe(
      false
    )
  })

  it('opting out removes identifiers and opting in clears the flag', () => {
    const storage = memoryStorage()
    startPageView(storage, 0, ids(), true)
    optOut(storage)
    expect(storage.data).toEqual({ gyms_optout: '1' })
    optIn(storage)
    expect(storage.data).toEqual({})
  })
})
