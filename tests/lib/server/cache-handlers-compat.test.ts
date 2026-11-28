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

describe('Redis entry invalidation tags', () => {
  const {
    entryInvalidationTags,
  } = require('../../../lib/server/cache/handlers/redis-shared.cjs')

  it('checks entry tags even when the request carries path soft tags', () => {
    // updateTag('project:list:en')가 경로 태그가 붙은 요청에서도 항목을 만료시켜야 한다.
    expect(
      entryInvalidationTags(
        ['_N_T_/en/project/6th'],
        ['project:list:en', 'project:generation:6th:en']
      )
    ).toEqual([
      'project:list:en',
      'project:generation:6th:en',
      '_N_T_/en/project/6th',
    ])
  })

  it('handles missing tag lists and drops duplicates and blanks', () => {
    expect(entryInvalidationTags([], undefined)).toEqual([])
    expect(entryInvalidationTags(undefined, ['a', 'a', ''])).toEqual(['a'])
    expect(entryInvalidationTags(['a', 'b'], ['b'])).toEqual(['b', 'a'])
  })
})

describe('Redis tag state status (matches Next tags-manifest rules)', () => {
  const {
    tagStateStatus,
  } = require('../../../lib/server/cache/handlers/redis-shared.cjs')
  const now = 1_000_000

  it('expires only when the deadline has passed after the entry was built', () => {
    expect(tagStateStatus([{ expired: now - 10 }], now - 20, now)).toBe(
      'expired'
    )
    // 항목이 만료 이후에 만들어졌으면 만료가 아니다.
    expect(tagStateStatus([{ expired: now - 10 }], now - 5, now)).toBe('fresh')
  })

  it('does not treat a future expire from revalidateTag(..., "max") as expired', () => {
    const backgroundRevalidation = {
      stale: now - 10,
      expired: now + 31_536_000,
    }
    expect(tagStateStatus([backgroundRevalidation], now - 20, now)).toBe(
      'stale'
    )
    expect(tagStateStatus([backgroundRevalidation], now - 5, now)).toBe('fresh')
  })

  it('prefers expired over stale across tags and ignores missing states', () => {
    expect(
      tagStateStatus(
        [null, { stale: now - 1 }, { expired: now }],
        now - 20,
        now
      )
    ).toBe('expired')
    expect(tagStateStatus([null, undefined], now - 20, now)).toBe('fresh')
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
