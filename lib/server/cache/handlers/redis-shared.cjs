// Next가 require로 로드하므로 CJS를 쓰며 TS 별칭·logger 대신 console.error로 오류를 남긴다.
// 태그 무효화 시각을 Redis에 공유해 모든 인스턴스가 그 이전 항목을 거절한다.
/* eslint-disable @typescript-eslint/no-require-imports */
'use strict'

const { createClient } = require('redis')

const SHARED_TAG_PREFIX = 'gdgoc:next:tag:'

let clientPromise

function hasRedis() {
  return Boolean(process.env.REDIS_URL)
}

/** 프로세스당 하나인 Redis 클라이언트. 연결이 끊기면 최대 5초 간격으로 재시도한다. */
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

// expire에 맞춰 Redis TTL을 설정해 쓸모없는 키를 지운다. 만료가 없거나 잘못된 값은 TTL도 없다.
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

/** Buffer와 Map처럼 JSON이 표현하지 못하는 값을 태그가 붙은 객체로 바꾼다. */
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

/** 태그들의 가장 최근 무효화 시각(ms). Cache Components의 `getExpiration`에 쓴다. */
async function getLatestTagTimestamp(tags) {
  const states = await readTagStates(tags)

  return states.reduce((maxTimestamp, state) => {
    if (!state) {
      return maxTimestamp
    }

    return Math.max(maxTimestamp, state.stale ?? 0, state.expired ?? 0)
  }, 0)
}

/** `timestamp`에 만든 캐시 항목이 태그 무효화 이후라 더는 쓸 수 없는지. */
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

// durations가 있으면 stale·선택적 expire를 기록하고, 없으면 expired로 즉시 만료한다.
// 태그 상태가 무효화 대상보다 먼저 사라지면 안 돼 TTL을 두지 않는다.
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
