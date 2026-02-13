import { afterEach, describe, expect, it, vi } from 'vitest'
import waitTime from '@/lib/wait-time'

afterEach(() => {
  vi.useRealTimers()
})

describe('waitTime', () => {
  it('resolves after the given milliseconds', async () => {
    vi.useFakeTimers()

    let resolved = false
    const promise = waitTime(1000).then(() => {
      resolved = true
    })

    await vi.advanceTimersByTimeAsync(999)
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await promise
    expect(resolved).toBe(true)
  })
})
