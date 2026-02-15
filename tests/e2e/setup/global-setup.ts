import fs from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { URL } from 'node:url'
import type { FullConfig } from '@playwright/test'
import {
  ADMIN_STORAGE_STATE,
  AUTH_DIR,
  SEEDED_DATA_FILE,
  SeededE2EData,
} from './constants'
import {
  getSeededAdminSessionToken,
  resetAndSeedE2EDatabase,
} from './seed-db'

async function writeAuthState(baseURL: string) {
  const token = getSeededAdminSessionToken()
  const parsedBaseURL = new URL(baseURL)
  const isSecure = parsedBaseURL.protocol === 'https:'
  const domain = parsedBaseURL.hostname

  const cookieNames = isSecure
    ? ['__Secure-authjs.session-token', '__Secure-next-auth.session-token']
    : ['authjs.session-token', 'next-auth.session-token']

  const cookies = cookieNames.map((name) => ({
    name,
    value: token,
    domain,
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax' as const,
    expires: Math.floor(new Date('2099-01-01').getTime() / 1000),
  }))

  await fs.writeFile(
    ADMIN_STORAGE_STATE,
    JSON.stringify({ cookies, origins: [] }, null, 2)
  )
}

async function writeSeedInfo(seeded: SeededE2EData) {
  await fs.writeFile(SEEDED_DATA_FILE, JSON.stringify(seeded, null, 2))
}

export default async function globalSetup(config: FullConfig) {
  mkdirSync(AUTH_DIR, { recursive: true })

  const seeded = await resetAndSeedE2EDatabase()
  await writeSeedInfo(seeded)

  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:3000'
  await writeAuthState(baseURL)
}
