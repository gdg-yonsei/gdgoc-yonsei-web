import { createRequire } from 'node:module'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// 실제 Redis 없이 Redis 원격 캐시 핸들러의 전체 흐름(저장 → 태그 무효화 → 읽기)을 검증한다.
// 핸들러는 CJS이고 모듈 로드 시점에 REDIS_URL을 읽으므로, require 캐시에 가짜 redis를 넣고 불러온다.
const require = createRequire(import.meta.url)
const handlersDir = path.resolve(
  __dirname,
  '../../../lib/server/cache/handlers'
)
const handlerPath = path.join(handlersDir, 'remote-cache-handler.cjs')
const sharedPath = path.join(handlersDir, 'redis-shared.cjs')

const store = new Map<string, string>()
const fakeClient = {
  on: () => fakeClient,
  connect: () => Promise.resolve(),
  get: (key: string) => Promise.resolve(store.get(key) ?? null),
  set: (key: string, value: string) => {
    store.set(key, value)
    return Promise.resolve('OK')
  },
  mGet: (keys: string[]) =>
    Promise.resolve(keys.map((key) => store.get(key) ?? null)),
}

type CacheEntry = {
  value: ReadableStream<Uint8Array>
  tags: string[]
  stale: number
  timestamp: number
  expire: number
  revalidate: number
}

type RemoteHandler = {
  get(key: string, softTags: string[]): Promise<CacheEntry | undefined>
  set(key: string, entry: Promise<CacheEntry>): Promise<void>
  getExpiration(tags: string[]): Promise<number>
  updateTags(tags: string[], durations?: { expire?: number }): Promise<void>
}

let handler: RemoteHandler
let previousRedisUrl: string | undefined

function entry(timestamp: number, tags: string[]): CacheEntry {
  return {
    value: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('cached'))
        controller.close()
      },
    }),
    tags,
    stale: 300,
    timestamp,
    expire: 3600,
    revalidate: 900,
  }
}

beforeAll(() => {
  previousRedisUrl = process.env.REDIS_URL
  process.env.REDIS_URL = 'redis://fake:6379'
  const redisPath = require.resolve('redis', { paths: [handlersDir] })
  require.cache[redisPath] = {
    id: redisPath,
    filename: redisPath,
    loaded: true,
    exports: { createClient: () => fakeClient },
  } as unknown as NodeJS.Module
  delete require.cache[sharedPath]
  delete require.cache[handlerPath]
  handler = require(handlerPath) as RemoteHandler
})

afterAll(() => {
  if (previousRedisUrl === undefined) delete process.env.REDIS_URL
  else process.env.REDIS_URL = previousRedisUrl
  delete require.cache[sharedPath]
  delete require.cache[handlerPath]
})

beforeEach(() => {
  store.clear()
})

describe('Redis remote cache handler', () => {
  const tags = ['project:list:en']
  const softTags = ['_N_T_/en/project/6th']

  it('uses the Redis handler when REDIS_URL is set', () => {
    expect(typeof handler.updateTags).toBe('function')
    expect(handler.constructor.name).toBe('Object')
  })

  it('serves a stored entry while no tag has changed', async () => {
    await handler.set('k', Promise.resolve(entry(Date.now(), tags)))
    const cached = await handler.get('k', softTags)
    expect(cached?.revalidate).toBe(900)
    expect(await new Response(cached?.value).text()).toBe('cached')
  })

  it('misses after updateTag expires an entry tag, even with path soft tags present', async () => {
    await handler.set('k', Promise.resolve(entry(Date.now() - 1_000, tags)))
    await handler.updateTags(tags)
    expect(await handler.get('k', softTags)).toBeUndefined()
  })

  it('keeps serving after a background revalidateTag(..., "max") and asks for a refresh', async () => {
    // 'max'는 stale을 지금으로, expired를 먼 미래로 남긴다. 미래 만료 시각 때문에 미스가 나면 안 된다.
    await handler.set('k', Promise.resolve(entry(Date.now() - 1_000, tags)))
    await handler.updateTags(tags, { expire: 31_536_000 })
    const cached = await handler.get('k', softTags)
    expect(cached).toBeDefined()
    expect(cached?.revalidate).toBe(-1)
  })

  it('treats an entry rebuilt after a background revalidation as fresh', async () => {
    await handler.updateTags(tags, { expire: 31_536_000 })
    await handler.set('k', Promise.resolve(entry(Date.now() + 1_000, tags)))
    const cached = await handler.get('k', softTags)
    expect(cached?.revalidate).toBe(900)
  })

  it('reports expirations to Next but ignores stale-only marks, like the default handler', async () => {
    // stale만 남긴 무효화는 버림 기준이 아니다.
    await handler.updateTags(['stale-only'], {})
    expect(await handler.getExpiration(['stale-only'])).toBe(0)

    const before = Date.now()
    await handler.updateTags(['expired-now'])
    const expiredAt = await handler.getExpiration(['expired-now'])
    expect(expiredAt).toBeGreaterThanOrEqual(before)
    expect(expiredAt).toBeLessThanOrEqual(Date.now())
  })
})
