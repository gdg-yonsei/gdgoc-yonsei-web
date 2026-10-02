import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

describe('Next.js 16.3 custom cache handler contracts', () => {
  it('loads the incremental Redis handler against the installed Next version', () => {
    const IncrementalRedisCacheHandler = require('../../../lib/server/cache/handlers/incremental-redis-cache-handler.cjs')

    expect(typeof IncrementalRedisCacheHandler).toBe('function')
    expect(typeof IncrementalRedisCacheHandler.prototype.get).toBe('function')
    expect(typeof IncrementalRedisCacheHandler.prototype.set).toBe('function')
    expect(typeof IncrementalRedisCacheHandler.prototype.revalidateTag).toBe(
      'function'
    )
  })

  it('loads the Cache Components remote handler contract', () => {
    const remoteCacheHandler = require('../../../lib/server/cache/handlers/remote-cache-handler.cjs')

    for (const method of [
      'get',
      'set',
      'refreshTags',
      'getExpiration',
      'updateTags',
    ]) {
      expect(typeof remoteCacheHandler[method], method).toBe('function')
    }
  })
})

describe('Redis entry expiry', () => {
  const {
    expireToSetOptions,
  } = require('../../../lib/server/cache/handlers/redis-shared.cjs')

  it('turns a cache life expire into a Redis EX option', () => {
    expect(expireToSetOptions(7200)).toEqual({ EX: 7200 })
    expect(expireToSetOptions(1.2)).toEqual({ EX: 2 })
  })

  it('keeps entries without a usable expire forever', () => {
    expect(expireToSetOptions(undefined)).toBeUndefined()
    expect(expireToSetOptions(0)).toBeUndefined()
    expect(expireToSetOptions(Number.POSITIVE_INFINITY)).toBeUndefined()
    expect(expireToSetOptions(0xfffffffe)).toBeUndefined()
  })
})
