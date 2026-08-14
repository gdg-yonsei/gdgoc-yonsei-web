import 'server-only'

import { betterAuth } from 'better-auth/minimal'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { passkey } from '@better-auth/passkey'
import { headers } from 'next/headers'
import { cache } from 'react'
import db from '@/db'
import { verification } from '@/db/schema/verification-tokens'
import { authSessions } from '@/db/schema/auth-sessions'
import { accounts } from '@/db/schema/accounts'
import { users } from '@/db/schema/users'
import { passkeys } from '@/db/schema/authenticators'
import { getAuthEnv } from '@/lib/server/env-core'

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
    },
  }),
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
    // Must remain last so Better Auth response cookies are copied into Next.js
    // Server Actions as well as Route Handler responses.
    nextCookies(),
  ],
})

export type AuthSession = typeof auth.$Infer.Session

/** Resolve, validate, and deduplicate the current session within one request. */
export const getAuthSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() })
})
