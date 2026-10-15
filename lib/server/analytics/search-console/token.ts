/**
 * Google 서비스 계정 JWT bearer 흐름(RFC 7523). 의존성을 늘리지 않으려고 RS256 서명을 node:crypto로 직접 한다.
 * 토큰은 프로세스 메모리에 만료 60초 전까지 보관한다.
 */
import 'server-only'

import { createSign } from 'node:crypto'
import { SearchConsoleError } from '@/lib/server/analytics/search-console/errors'
import type { SearchConsoleEnv } from '@/lib/server/env'

export const SEARCH_CONSOLE_SCOPE =
  'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ASSERTION_LIFETIME_SECONDS = 3600
const EXPIRY_MARGIN_MS = 60_000

let cached: { token: string; expiresAt: number; clientEmail: string } | null =
  null

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

export function createAssertion(
  env: SearchConsoleEnv,
  nowSeconds: number
): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: env.clientEmail,
      scope: SEARCH_CONSOLE_SCOPE,
      aud: TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + ASSERTION_LIFETIME_SECONDS,
    })
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  return `${header}.${claims}.${base64url(signer.sign(env.privateKey))}`
}

/** 테스트와 자격 증명 교체 뒤에 쓴다. */
export function clearAccessTokenCache(): void {
  cached = null
}

export async function getAccessToken(
  env: SearchConsoleEnv,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now
): Promise<string> {
  if (
    cached &&
    cached.clientEmail === env.clientEmail &&
    cached.expiresAt - EXPIRY_MARGIN_MS > now()
  ) {
    return cached.token
  }
  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createAssertion(env, Math.floor(now() / 1000)),
    }),
  })
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    error?: string
  }
  if (!response.ok || !body.access_token) {
    throw new SearchConsoleError(
      response.status,
      body.error ?? 'Failed to get a Search Console access token'
    )
  }
  cached = {
    token: body.access_token,
    expiresAt: now() + (body.expires_in ?? ASSERTION_LIFETIME_SECONDS) * 1000,
    clientEmail: env.clientEmail,
  }
  return cached.token
}
