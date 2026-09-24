import fs from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { createHmac } from 'node:crypto'
import { URL } from 'node:url'
import type { FullConfig } from '@playwright/test'
import {
  ADMIN_STORAGE_STATE,
  AUTH_DIR,
  PASSKEY_STORAGE_STATE,
  SEEDED_DATA_FILE,
  SeededE2EData,
  UNVERIFIED_STORAGE_STATE,
} from './constants'
import {
  getSeededAdminSessionToken,
  getSeededPasskeySessionToken,
  getSeededUnverifiedSessionToken,
  resetAndSeedE2EDatabase,
} from './seed-db'

async function writeAuthState(
  baseURL: string,
  token: string,
  storageStatePath: string
) {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error(
      'BETTER_AUTH_SECRET is required for authenticated E2E tests'
    )
  }

  const signedToken = `${token}.${createHmac('sha256', secret)
    .update(token)
    .digest('base64')}`
  const parsedBaseURL = new URL(baseURL)
  const isSecure = parsedBaseURL.protocol === 'https:'
  const domain = parsedBaseURL.hostname

  const cookies = [
    {
      name: `${isSecure ? '__Secure-' : ''}better-auth.session_token`,
      value: signedToken,
      domain,
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: 'Lax' as const,
      expires: Math.floor(new Date('2099-01-01').getTime() / 1000),
    },
  ]

  await fs.writeFile(
    storageStatePath,
    JSON.stringify({ cookies, origins: [] }, null, 2)
  )
}

async function writeSeedInfo(seeded: SeededE2EData) {
  await fs.writeFile(SEEDED_DATA_FILE, JSON.stringify(seeded, null, 2))
}

export async function prepareE2EData(baseURL: string) {
  mkdirSync(AUTH_DIR, { recursive: true })

  const seeded = await resetAndSeedE2EDatabase()
  await writeSeedInfo(seeded)
  await writeAuthState(
    baseURL,
    getSeededAdminSessionToken(),
    ADMIN_STORAGE_STATE
  )
  await writeAuthState(
    baseURL,
    getSeededPasskeySessionToken(),
    PASSKEY_STORAGE_STATE
  )
  await writeAuthState(
    baseURL,
    getSeededUnverifiedSessionToken(),
    UNVERIFIED_STORAGE_STATE
  )
}

export default async function globalSetup(config: FullConfig) {
  if (process.env.E2E_SEEDED_BEFORE_BUILD === '1') {
    return
  }

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:3000'
  await prepareE2EData(baseURL)
}
