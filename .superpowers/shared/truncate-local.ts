import { sql } from 'drizzle-orm'
import db from '../../db'

// Perf baselines were measured on dev-seed data only; the e2e run leaves its
// fixtures behind. Refuse to touch anything but the disposable local DB.
async function main() {
  if (!(process.env.AUTH_DRIZZLE_URL ?? '').includes('@localhost:5439/')) {
    throw new Error('refusing to truncate: AUTH_DRIZZLE_URL is not the local embedded Postgres')
  }
  await db.execute(
    sql.raw(`TRUNCATE TABLE "userToSession", "external_participants", "users_to_projects",
      "projects_to_tags", "users_to_parts", "sessions", "projects", "parts", "generations",
      "account", "authenticator", "session", "verificationToken", "user", "tags"
      RESTART IDENTITY CASCADE`)
  )
  console.log('truncated local DB')
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  }
)
