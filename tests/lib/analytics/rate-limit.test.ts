import { describe, expect, it } from 'vitest'
import { createMemoryRateLimiter } from '@/lib/server/analytics/collect/rate-limit'

describe('createMemoryRateLimiter', () => {
  it('allows up to the limit per window and resets after it', () => {
    let now = 0
    const limiter = createMemoryRateLimiter({
      limit: 120,
      windowMs: 60_000,
      now: () => now,
    })

    expect(limiter.consume('1.2.3.4', 100)).toBe(true)
    expect(limiter.consume('1.2.3.4', 20)).toBe(true)
    expect(limiter.consume('1.2.3.4', 1)).toBe(false)
    expect(limiter.consume('5.6.7.8', 1)).toBe(true)

    now = 60_000
    expect(limiter.consume('1.2.3.4', 1)).toBe(true)
  })
})
