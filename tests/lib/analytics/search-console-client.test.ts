import { createVerify, generateKeyPairSync } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SearchConsoleError,
  querySearchAnalytics,
} from '@/lib/server/analytics/search-console/client'
import {
  clearAccessTokenCache,
  createAssertion,
  getAccessToken,
} from '@/lib/server/analytics/search-console/token'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const env = {
  clientEmail: 'gyms@project.iam.gserviceaccount.com',
  privateKey,
  siteUrl: 'https://gdgoc.yonsei.ac.kr/',
}

function decode(part: string) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<
    string,
    unknown
  >
}

beforeEach(() => {
  clearAccessTokenCache()
})

describe('createAssertion', () => {
  it('signs a read-only JWT bearer assertion with RS256', () => {
    const jwt = createAssertion(env, 1_800_000_000)
    const [header, claims, signature] = jwt.split('.')
    expect(decode(header!)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(decode(claims!)).toEqual({
      iss: env.clientEmail,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    })
    const verifier = createVerify('RSA-SHA256')
    verifier.update(`${header}.${claims}`)
    expect(
      verifier.verify(publicKey, Buffer.from(signature!, 'base64url'))
    ).toBe(true)
  })
})

describe('getAccessToken', () => {
  it('exchanges the assertion once and reuses the token until it nearly expires', async () => {
    let now = 1_800_000_000_000
    const fetchImpl = vi.fn(async () =>
      Response.json({ access_token: 'token-1', expires_in: 3600 })
    )

    await expect(getAccessToken(env, fetchImpl, () => now)).resolves.toBe(
      'token-1'
    )
    await expect(getAccessToken(env, fetchImpl, () => now)).resolves.toBe(
      'token-1'
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe('https://oauth2.googleapis.com/token')
    expect(String(init.body)).toContain(
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer'
    )

    now += 3_550_000
    await getAccessToken(env, fetchImpl, () => now)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('reports a rejected key as a SearchConsoleError', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: 'invalid_grant' }, { status: 400 })
    )
    await expect(getAccessToken(env, fetchImpl)).rejects.toMatchObject({
      status: 400,
    })
  })
})

describe('querySearchAnalytics', () => {
  it('posts the query with filters and maps rows', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? Response.json({ access_token: 'token-1', expires_in: 3600 })
        : Response.json({
            rows: [
              {
                keys: ['gdgoc yonsei'],
                clicks: 3,
                impressions: 40,
                ctr: 0.075,
                position: 2.4,
              },
            ],
          })
    )
    const rows = await querySearchAnalytics(
      env,
      {
        startDate: '2026-09-16',
        endDate: '2026-10-13',
        dimensions: ['query'],
        rowLimit: 100,
        device: 'MOBILE',
        pageContains: '/ko/session',
      },
      fetchImpl
    )
    expect(rows).toEqual([
      {
        keys: ['gdgoc yonsei'],
        clicks: 3,
        impressions: 40,
        ctr: 0.075,
        position: 2.4,
      },
    ])

    const [url, init] = fetchImpl.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe(
      'https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fgdgoc.yonsei.ac.kr%2F/searchAnalytics/query'
    )
    expect(init.headers).toMatchObject({ Authorization: 'Bearer token-1' })
    expect(JSON.parse(String(init.body))).toEqual({
      startDate: '2026-09-16',
      endDate: '2026-10-13',
      dimensions: ['query'],
      rowLimit: 100,
      type: 'web',
      dataState: 'all',
      dimensionFilterGroups: [
        {
          groupType: 'and',
          filters: [
            { dimension: 'device', operator: 'equals', expression: 'MOBILE' },
            {
              dimension: 'page',
              operator: 'contains',
              expression: '/ko/session',
            },
          ],
        },
      ],
    })
  })

  it('returns an empty list when the API has no rows and throws on errors', async () => {
    const empty = vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? Response.json({ access_token: 't', expires_in: 3600 })
        : Response.json({})
    )
    await expect(
      querySearchAnalytics(
        env,
        {
          startDate: '2026-10-01',
          endDate: '2026-10-02',
          dimensions: [],
          rowLimit: 1,
        },
        empty
      )
    ).resolves.toEqual([])

    clearAccessTokenCache()
    const denied = vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? Response.json({ access_token: 't', expires_in: 3600 })
        : Response.json(
            { error: { message: 'User does not have sufficient permission' } },
            { status: 403 }
          )
    )
    const error = await querySearchAnalytics(
      env,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        dimensions: [],
        rowLimit: 1,
      },
      denied
    ).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(SearchConsoleError)
    expect(error).toMatchObject({ status: 403 })
  })
})
