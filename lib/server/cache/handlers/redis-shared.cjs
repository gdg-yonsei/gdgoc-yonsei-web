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

/**
 * 태그들의 만료 시각(ms). Cache Components의 `getExpiration`에 쓴다.
 * Next 기본 핸들러처럼 expired만 본다. stale은 다시 쓸 수 있는 값이라 버림 기준이 아니다.
 */
async function getLatestTagTimestamp(tags) {
  const states = await readTagStates(tags)

  return states.reduce(
    (maxTimestamp, state) => Math.max(maxTimestamp, state?.expired ?? 0),
    0
  )
}

/**
 * `timestamp`에 만든 항목에 대한 태그 상태. Next 기본 핸들러(tags-manifest)와 같은 규칙이다.
 * - 'expired': 만료 시각이 이미 지났고 항목을 만든 뒤다. 캐시 미스로 처리한다.
 *   revalidateTag(tag, 'max')가 남긴 미래 만료 시각은 그때가 오기 전까지 만료가 아니다.
 * - 'stale': 항목을 만든 뒤 stale로 표시됐다. 값을 쓰되 백그라운드에서 다시 만든다.
 * - 'fresh': 둘 다 아니다.
 */
function tagStateStatus(states, timestamp, now) {
  let status = 'fresh'

  for (const state of states) {
    if (!state) {
      continue
    }

    const { expired, stale } = state
    if (typeof expired === 'number' && expired <= now && expired > timestamp) {
      return 'expired'
    }

    if (typeof stale === 'number' && stale > timestamp) {
      status = 'stale'
    }
  }

  return status
}

async function getTagStateStatus(tags, timestamp) {
  return tagStateStatus(await readTagStates(tags), timestamp, Date.now())
}

/** `timestamp`에 만든 항목을 그대로 쓸 수 없는지(만료 또는 stale). ISR 핸들러가 쓴다. */
async function isTagStateInvalid(tags, timestamp) {
  return (await getTagStateStatus(tags, timestamp)) !== 'fresh'
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

/**
 * 캐시 항목의 무효화를 판단할 태그. 항목 자체 태그(`cacheTag`)와 요청 경로의 soft tag를 모두 본다.
 * 경로 태그만 보면 updateTag(project:list 등)로 만료한 항목이 경로가 안 바뀐 요청에서 계속 나간다.
 */
function entryInvalidationTags(softTags, entryTags) {
  return [...new Set([...(entryTags ?? []), ...(softTags ?? [])])].filter(
    Boolean
  )
}

module.exports = {
  decodeFromJson,
  encodeForJson,
  entryInvalidationTags,
  expireToSetOptions,
  getLatestTagTimestamp,
  getRedisClient,
  getTagStateStatus,
  hasRedis,
  isTagStateInvalid,
  tagStateStatus,
  writeTagStates,
}
