import { afterEach, describe, expect, it, vi } from 'vitest'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import { fail, ok } from '@/lib/server/services/admin/types'

describe('withDbErrors', () => {
  afterEach(() => vi.restoreAllMocks())

  it('passes successful and failed service results through', async () => {
    await expect(withDbErrors('test', async () => ok(1))).resolves.toEqual(
      ok(1)
    )
    await expect(
      withDbErrors('test', async () => fail('NOT_FOUND', 'missing'))
    ).resolves.toEqual(fail('NOT_FOUND', 'missing'))
  })

  it('logs a thrown error and turns it into an INTERNAL failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await withDbErrors(
      'admin.test',
      async () => {
        throw new Error('connection lost')
      },
      { id: 7 },
      'DB Delete Error'
    )

    expect(result).toEqual(fail('INTERNAL', 'DB Delete Error'))
    expect(consoleError).toHaveBeenCalledWith(
      '[admin.test] connection lost {"id":7}',
      expect.any(Error)
    )
  })
})
