// Auth.js 테이블 이름을 유지하므로 Better Auth 모델과 Drizzle 테이블을 schema에서 직접 연결한다.
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
    // Better Auth 훅은 Promise를 돌려줘야 해서 await가 없어도 async로 둔다.
    // eslint-disable-next-line @typescript-eslint/require-await
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/oauth2/register') return
      const body = withLoopbackApplicationType<unknown>(ctx.body)
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

export type AuthSession = typeof auth.$Infer.Session

// 로그인 세션 조회는 같은 요청의 React cache로 합친다.
export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() })
})
