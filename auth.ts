/**
 * Better Auth 설정(로그인, 세션, 패스키, MCP용 OAuth 인가 서버).
 *
 * - 로그인: GitHub·Google 소셜 로그인과 패스키
 * - 세션: DB 세션 + 쿠키. 서버에서는 `getAuthSession()`으로 읽는다
 * - MCP: `jwt()` + `mcp()` + `cimd()` 플러그인으로 OAuth 2.1 인가 서버가 되어
 *   `/api/mcp`에 쓸 액세스 토큰을 발급한다(`docs/architecture/mcp.md`)
 *
 * 라우트는 `app/api/auth/[...all]/route.ts`가 노출한다. DB 테이블 이름은 Auth.js 시절 이름을
 * 유지하므로 Better Auth 모델과 Drizzle 테이블을 `schema`에서 직접 연결한다.
 */
import 'server-only'

import { betterAuth } from 'better-auth/minimal'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { createAuthMiddleware } from 'better-auth/api'
import { passkey } from '@better-auth/passkey'
import { jwt } from 'better-auth/plugins/jwt'
import { mcp } from '@better-auth/mcp'
import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { headers } from 'next/headers'
import { cache } from 'react'
import { db } from '@/db'
import { verification } from '@/db/schema/verification-tokens'
import { authSessions } from '@/db/schema/auth-sessions'
import { accounts } from '@/db/schema/accounts'
import { users } from '@/db/schema/users'
import { passkeys } from '@/db/schema/authenticators'
import {
  jwks,
  oauthAccessToken,
  oauthClient,
  oauthClientAssertion,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthResource,
} from '@/db/schema/oauth'
import { getAuthEnv } from '@/lib/server/env-core'
import { withLoopbackApplicationType } from '@/lib/mcp/registration'
import {
  MCP_ACCESS_TOKEN_TTL,
  MCP_ADMIN_ACCESS_TOKEN_TTL,
  MCP_REFRESH_TOKEN_TTL,
  MCP_SCOPES,
  getMcpResourceUrl,
} from '@/lib/mcp/config'

const authEnv = getAuthEnv()
const authOrigin = new URL(authEnv.BETTER_AUTH_URL).origin

/** Better Auth 서버 인스턴스. */
export const auth = betterAuth({
  appName: 'GDGoC Yonsei',
  baseURL: authOrigin,
  secret: authEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: authSessions,
      account: accounts,
      verification,
      passkey: passkeys,
      jwks,
      oauthClient,
      oauthResource,
      oauthClientResource,
      oauthRefreshToken,
      oauthAccessToken,
      oauthConsent,
      oauthClientAssertion,
    },
  }),
  hooks: {
    // MCP 클라이언트 동적 등록 요청을 보정한다(`lib/mcp/registration.ts`).
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/oauth2/register') return
      const body = withLoopbackApplicationType(ctx.body)
      if (body !== ctx.body) {
        return { context: { ...ctx, body } }
      }
    }),
  },
  socialProviders: {
    github: {
      clientId: authEnv.GITHUB_CLIENT_ID,
      clientSecret: authEnv.GITHUB_CLIENT_SECRET,
    },
    google: {
      clientId: authEnv.GOOGLE_CLIENT_ID,
      clientSecret: authEnv.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    passkey({
      rpID: new URL(authOrigin).hostname,
      rpName: 'GDGoC Yonsei',
      origin: authOrigin,
    }),
    // GYMS MCP 인가 서버. access 토큰은 JWT(JWKS 검증), 역할은 MCP 요청마다
    // DB 에서 다시 읽는다. 등록은 CIMD(MCP 2026-07-28)와 DCR(2025 세대) 둘 다 받는다.
    jwt(),
    mcp({
      resource: getMcpResourceUrl(),
      loginPage: '/auth/sign-in',
      consentPage: '/auth/mcp-consent',
      scopes: ['offline_access', ...MCP_SCOPES],
      clientRegistrationDefaultScopes: ['offline_access', ...MCP_SCOPES],
      clientRegistrationAllowedScopes: ['offline_access', ...MCP_SCOPES],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      accessTokenExpiresIn: MCP_ACCESS_TOKEN_TTL,
      refreshTokenExpiresIn: MCP_REFRESH_TOKEN_TTL,
      scopeExpirations: { 'gyms:admin': MCP_ADMIN_ACCESS_TOKEN_TTL },
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: 'mcp-2026-07-28',
    }),
    // 반드시 마지막에 둔다. 그래야 Better Auth가 설정한 응답 쿠키가 Route Handler뿐 아니라
    // Next.js Server Action 응답에도 복사된다.
    nextCookies(),
  ],
})

/** 로그인 세션(사용자 정보 포함) 타입. */
export type AuthSession = typeof auth.$Infer.Session

/** 현재 요청의 로그인 세션을 읽는다. 요청 안에서 여러 번 불러도 한 번만 조회한다(React `cache`). */
export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() })
})
