// REDIS_URL이 없으면 기본 메모리 캐시(50MB), 있으면 인스턴스 간 공유 Redis를 쓴다.
// 같은 키를 저장 중인 읽기는 pendingSets가 끝날 때까지 기다린다.
/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const {
  createDefaultCacheHandler,
} = require('next/dist/server/lib/cache-handlers/default')
const {
  entryInvalidationTags,
  expireToSetOptions,
  getLatestTagTimestamp,
  getRedisClient,
  getTagStateStatus,
  hasRedis,
  writeTagStates,
} = require('./redis-shared.cjs')

const ENTRY_PREFIX = 'gdgoc:next:use-cache:entry:'
const FALLBACK_HANDLER = createDefaultCacheHandler(50 * 1024 * 1024)
const pendingSets = new Map()

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

function base64ToStream(base64Value) {
  const buffer = Buffer.from(base64Value, 'base64')

  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer))
      controller.close()
    },
  })
}

/**
 * 캐시 항목을 읽는다. 항목 태그나 경로 태그가 항목을 만든 뒤 만료됐으면 없는 것으로 보고,
 * stale로만 표시됐으면 Next 기본 핸들러처럼 값을 주되 revalidate -1로 백그라운드 갱신을 요청한다.
 */
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
  const relevantTags = entryInvalidationTags(softTags, payload.tags)

  const status = await getTagStateStatus(relevantTags, payload.timestamp)
  if (status === 'expired') {
    return undefined
  }

  return {
    expire: payload.expire,
    revalidate: status === 'stale' ? -1 : payload.revalidate,
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
