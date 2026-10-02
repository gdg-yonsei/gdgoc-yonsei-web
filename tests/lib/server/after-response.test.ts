import { describe, expect, it, vi } from 'vitest'

const { mockLoggerError } = vi.hoisted(() => ({ mockLoggerError: vi.fn() }))

vi.mock('@/lib/server/logger', () => ({
  logger: { error: mockLoggerError },
}))

import { runAfterResponse } from '@/lib/server/after-response'

describe('runAfterResponse', () => {
  it('runs the task and logs a failure instead of throwing', async () => {
    const error = new Error('mail down')

    expect(() =>
      runAfterResponse('test.scope', () => Promise.reject(error), {
        sessionId: 's1',
      })
    ).not.toThrow()

    await vi.waitFor(() =>
      expect(mockLoggerError).toHaveBeenCalledWith('test.scope', error, {
        sessionId: 's1',
      })
    )
  })
})
