import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import { getDatabaseEnv } from './lib/server/env-core'

const databaseEnv = getDatabaseEnv()

export default defineConfig({
  out: './drizzle',
  schema: './db/schema',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseEnv.AUTH_DRIZZLE_URL,
  },
})
