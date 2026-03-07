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
      value.entries.map(([key, entryValue]) => [key, decodeFromJson(entryValue)])
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

    return Math.max(
      maxTimestamp,
      state.stale ?? 0,
      state.expired ?? 0
    )
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
  getLatestTagTimestamp,
  getRedisClient,
  hasRedis,
  isTagStateInvalid,
  writeTagStates,
}
