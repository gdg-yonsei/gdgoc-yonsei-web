/**
 * Cache Components용 `remote` 캐시 핸들러(`'use cache: remote'`).
 *
 * `REDIS_URL`이 있으면 항목을 Redis에 저장해 여러 서버 인스턴스가 캐시를 공유하고,
 * 없으면 Next.js 기본 메모리 핸들러(50MB)를 쓴다. `next.config.ts`의 `cacheHandlers`에 등록된다.
 * 같은 키를 저장하는 중에 들어온 읽기는 저장이 끝날 때까지 기다린다(`pendingSets`).
 */
/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const {
  createDefaultCacheHandler,
} = require('next/dist/server/lib/cache-handlers/default')
const {
  expireToSetOptions,
  getLatestTagTimestamp,
  getRedisClient,
  hasRedis,
  isTagStateInvalid,
  writeTagStates,
} = require('./redis-shared.cjs')

const ENTRY_PREFIX = 'gdgoc:next:use-cache:entry:'
const FALLBACK_HANDLER = createDefaultCacheHandler(50 * 1024 * 1024)
const pendingSets = new Map()

/** 캐시 값 스트림을 끝까지 읽어 Redis에 저장할 base64 문자열로 바꾼다. */
async function streamToBase64(stream) {
  const reader = stream.getReader()
  const chunks = []

  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    chunks.push(Buffer.from(value))
  }

  return Buffer.concat(chunks).toString('base64')
}

/** Redis에 저장한 base64 값을 Next.js가 기대하는 스트림으로 되돌린다. */
function base64ToStream(base64Value) {
  const buffer = Buffer.from(base64Value, 'base64')

  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer))
      controller.close()
    },
  })
}

/** 캐시 항목을 읽는다. 태그 무효화 이후에 만든 항목이 아니면 없는 것으로 본다. */
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
  const relevantTags = softTags.length > 0 ? softTags : (payload.tags ?? [])

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

/** 캐시 항목을 저장한다. 항목의 `expire`만큼 Redis TTL을 둔다. */
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
      }),
      expireToSetOptions(entry.expire)
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
