/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const { createClient } = require('redis')

const SHARED_TAG_PREFIX = 'gdgoc:next:tag:'

let clientPromise

function hasRedis() {
  return Boolean(process.env.REDIS_URL)
}

async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!clientPromise) {
    const client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy(retries) {
          return Math.min(retries * 100, 5_000)
        },
      },
    })

    client.on('error', (error) => {
      console.error('[cache:redis] client error', error)
    })

    clientPromise = client.connect().then(() => client)
  }

  return clientPromise
}

/** Next.js가 "만료 없음"을 나타낼 때 쓰는 값(INFINITE_CACHE) 이상은 TTL을 두지 않는다. */
const INFINITE_CACHE_SECONDS = 0xfffffffe

/**
 * 캐시 항목의 `expire`(초)를 Redis `SET`의 `EX` 옵션으로 바꾼다.
 * 항목이 만료되면 Next.js가 어차피 쓰지 않으므로, 같은 시점에 Redis에서도 지워
 * 쓸모없는 키가 쌓이지 않게 한다. 만료가 없거나 잘못된 값이면 옵션을 두지 않는다.
 */
function expireToSetOptions(expireSeconds) {
  if (
    typeof expireSeconds !== 'number' ||
    !Number.isFinite(expireSeconds) ||
    expireSeconds <= 0 ||
    expireSeconds >= INFINITE_CACHE_SECONDS
  ) {
    return undefined
  }

  return { EX: Math.ceil(expireSeconds) }
}

function encodeForJson(value) {
  if (Buffer.isBuffer(value)) {
    return {
      __type: 'Buffer',
      data: value.toString('base64'),
    }
  }

  if (value instanceof Map) {
    return {
      __type: 'Map',
      entries: [...value.entries()].map(([key, entryValue]) => [
        key,
        encodeForJson(entryValue),
      ]),
    }
  }

  if (Array.isArray(value)) {
    return value.map((entry) => encodeForJson(entry))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        encodeForJson(entryValue),
      ])
    )
  }

  return value
}

function decodeFromJson(value) {
  if (!value || typeof value !== 'object') {
    return value
  }

  if (value.__type === 'Buffer') {
    return Buffer.from(value.data, 'base64')
  }

  if (value.__type === 'Map') {
    return new Map(
      value.entries.map(([key, entryValue]) => [
        key,
        decodeFromJson(entryValue),
      ])
    )
  }

  if (Array.isArray(value)) {
    return value.map((entry) => decodeFromJson(entry))
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      decodeFromJson(entryValue),
    ])
  )
}

function parseTagState(rawValue) {
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

async function readTagStates(tags) {
  const normalizedTags = [...new Set(tags)].filter(Boolean)
  if (normalizedTags.length === 0) {
    return []
  }

  const redis = await getRedisClient()
  if (!redis) {
    return []
  }

  const values = await redis.mGet(
    normalizedTags.map((tag) => `${SHARED_TAG_PREFIX}${tag}`)
  )

  return values.map((value) => parseTagState(value))
}

async function getLatestTagTimestamp(tags) {
  const states = await readTagStates(tags)

  return states.reduce((maxTimestamp, state) => {
    if (!state) {
      return maxTimestamp
    }

    return Math.max(maxTimestamp, state.stale ?? 0, state.expired ?? 0)
  }, 0)
}

async function isTagStateInvalid(tags, timestamp) {
  const states = await readTagStates(tags)

  for (const state of states) {
    if (!state) {
      continue
    }

    if (typeof state.expired === 'number' && state.expired >= timestamp) {
      return true
    }

    if (typeof state.stale === 'number' && state.stale >= timestamp) {
      return true
    }
  }

  return false
}

async function writeTagStates(tags, durations) {
  const normalizedTags = [...new Set(typeof tags === 'string' ? [tags] : tags)]
  if (normalizedTags.length === 0) {
    return
  }

  const redis = await getRedisClient()
  if (!redis) {
    return
  }

  const now = Date.now()

  await Promise.all(
    normalizedTags.map(async (tag) => {
      const existingState = parseTagState(
        await redis.get(`${SHARED_TAG_PREFIX}${tag}`)
      )

      if (durations) {
        const nextState = {
          ...(existingState ?? {}),
          stale: now,
          ...(durations.expire !== undefined
            ? { expired: now + durations.expire * 1000 }
            : {}),
        }

        await redis.set(`${SHARED_TAG_PREFIX}${tag}`, JSON.stringify(nextState))
        return
      }

      const nextState = {
        ...(existingState ?? {}),
        expired: now,
      }

      await redis.set(`${SHARED_TAG_PREFIX}${tag}`, JSON.stringify(nextState))
    })
  )
}

module.exports = {
  decodeFromJson,
  encodeForJson,
  expireToSetOptions,
  getLatestTagTimestamp,
  getRedisClient,
  hasRedis,
  isTagStateInvalid,
  writeTagStates,
}
