/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const { createDefaultCacheHandler } = require('next/dist/server/lib/cache-handlers/default')
const {
  getLatestTagTimestamp,
  getRedisClient,
  hasRedis,
  isTagStateInvalid,
  writeTagStates,
} = require('./redis-shared.cjs')

const ENTRY_PREFIX = 'gdgoc:next:use-cache:entry:'
const FALLBACK_HANDLER = createDefaultCacheHandler(50 * 1024 * 1024)
const pendingSets = new Map()

function streamToBase64(stream) {
  return new Promise(async (resolve, reject) => {
    try {
      const reader = stream.getReader()
      const chunks = []

      for (;;) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        chunks.push(Buffer.from(value))
      }

      resolve(Buffer.concat(chunks).toString('base64'))
    } catch (error) {
      reject(error)
    }
  })
}

function base64ToStream(base64Value) {
  const buffer = Buffer.from(base64Value, 'base64')

  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer))
      controller.close()
    },
  })
}

async function getEntry(cacheKey, softTags) {
  const pendingEntry = pendingSets.get(cacheKey)
  if (pendingEntry) {
    await pendingEntry
  }

  const redis = await getRedisClient()
  if (!redis) {
    return undefined
  }

  const rawPayload = await redis.get(`${ENTRY_PREFIX}${cacheKey}`)
  if (!rawPayload) {
    return undefined
  }

  const payload = JSON.parse(rawPayload)
  const relevantTags =
    softTags.length > 0 ? softTags : payload.tags ?? []

  if (await isTagStateInvalid(relevantTags, payload.timestamp)) {
    return undefined
  }

  return {
    expire: payload.expire,
    revalidate: payload.revalidate,
    stale: payload.stale,
    tags: payload.tags ?? [],
    timestamp: payload.timestamp,
    value: base64ToStream(payload.valueBase64),
  }
}

async function setEntry(cacheKey, pendingEntry) {
  const redis = await getRedisClient()
  if (!redis) {
    return
  }

  let resolvePending = () => {}
  const pendingPromise = new Promise((resolve) => {
    resolvePending = resolve
  })

  pendingSets.set(cacheKey, pendingPromise)

  try {
    const entry = await pendingEntry
    const valueBase64 = await streamToBase64(entry.value)

    await redis.set(
      `${ENTRY_PREFIX}${cacheKey}`,
      JSON.stringify({
        expire: entry.expire,
        revalidate: entry.revalidate,
        stale: entry.stale,
        tags: entry.tags,
        timestamp: entry.timestamp,
        valueBase64,
      })
    )
  } finally {
    resolvePending()
    pendingSets.delete(cacheKey)
  }
}

module.exports = hasRedis()
  ? {
      async get(cacheKey, softTags) {
        return getEntry(cacheKey, softTags)
      },
      async set(cacheKey, pendingEntry) {
        return setEntry(cacheKey, pendingEntry)
      },
      async refreshTags() {},
      async getExpiration(tags) {
        return getLatestTagTimestamp(tags)
      },
      async updateTags(tags, durations) {
        return writeTagStates(tags, durations)
      },
    }
  : FALLBACK_HANDLER
