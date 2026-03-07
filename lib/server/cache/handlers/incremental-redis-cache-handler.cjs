/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const { CacheHandler } = require('next/dist/server/lib/incremental-cache')
const { NEXT_CACHE_TAGS_HEADER } = require('next/dist/lib/constants')
const {
  decodeFromJson,
  encodeForJson,
  getRedisClient,
  isTagStateInvalid,
  writeTagStates,
} = require('./redis-shared.cjs')

const ENTRY_PREFIX = 'gdgoc:next:incremental-cache:entry:'

class RedisIncrementalCacheHandler extends CacheHandler {
  constructor(ctx) {
    super(ctx)
    this.revalidatedTags = ctx.revalidatedTags ?? []
    this.pendingSets = new Map()
  }

  resetRequestCache() {}

  async revalidateTag(tags, durations) {
    await writeTagStates(tags, durations)
  }

  async get(cacheKey, ctx) {
    const pendingEntry = this.pendingSets.get(cacheKey)
    if (pendingEntry) {
      await pendingEntry
    }

    const redis = await getRedisClient()
    if (!redis) {
      return null
    }

    const rawPayload = await redis.get(`${ENTRY_PREFIX}${cacheKey}`)
    if (!rawPayload) {
      return null
    }

    const payload = decodeFromJson(JSON.parse(rawPayload))
    const value = payload.value

    if (!value) {
      return payload
    }

    if (ctx.kind === 'FETCH') {
      const relevantTags = [...(ctx.tags ?? []), ...(ctx.softTags ?? [])]

      if (relevantTags.some((tag) => this.revalidatedTags.includes(tag))) {
        return null
      }

      if (await isTagStateInvalid(relevantTags, payload.lastModified)) {
        return null
      }

      return payload
    }

    const tagsHeader = value.headers?.[NEXT_CACHE_TAGS_HEADER]
    if (typeof tagsHeader === 'string') {
      const relevantTags = tagsHeader.split(',').filter(Boolean)

      if (await isTagStateInvalid(relevantTags, payload.lastModified)) {
        return null
      }
    }

    return payload
  }

  async set(cacheKey, data) {
    const redis = await getRedisClient()
    if (!redis) {
      return
    }

    let resolvePending = () => {}
    const pendingPromise = new Promise((resolve) => {
      resolvePending = resolve
    })

    this.pendingSets.set(cacheKey, pendingPromise)

    try {
      await redis.set(
        `${ENTRY_PREFIX}${cacheKey}`,
        JSON.stringify(
          encodeForJson({
            lastModified: Date.now(),
            value: data,
          })
        )
      )
    } finally {
      resolvePending()
      this.pendingSets.delete(cacheKey)
    }
  }
}

module.exports = RedisIncrementalCacheHandler
