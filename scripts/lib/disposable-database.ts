/**
 * Guard for scripts that wipe or seed a database: the Playwright e2e reset
 * and `pnpm db:seed`.
 *
 * On 2026-09-25 the e2e reset truncated the production database. The
 * Playwright process loaded `.env`, which pointed at production, and nothing
 * checked the target before `TRUNCATE`. Every destructive script calls
 * `assertDisposableDatabase` before its first query, so a remote database is
 * only touched when someone names it explicitly.
 */

/** Hostnames that resolve to this machine or to a local compose network. */
export const LOCAL_DATABASE_HOSTS: readonly string[] = [
  'localhost',
  '127.0.0.1',
  '[::1]',
  '0.0.0.0',
  'db',
  'postgres',
]

/**
 * Opt-in for one remote database that may be wiped, such as a throwaway CI
 * instance. It must equal `AUTH_DRIZZLE_URL` exactly, so allowing one
 * database never allows another on the same host.
 */
export const DISPOSABLE_DATABASE_URL_ENV = 'E2E_DISPOSABLE_DATABASE_URL'

type Env = Readonly<Record<string, string | undefined>>

/** `user@host:port/database`, without the password, for error messages. */
export function describeDatabaseTarget(url: string): string {
  try {
    const parsed = new URL(url)
    const user = parsed.username
      ? `${decodeURIComponent(parsed.username)}@`
      : ''
    const port = parsed.port ? `:${parsed.port}` : ''
    return `${user}${parsed.hostname}${port}${parsed.pathname}`
  } catch {
    return '<unparseable database URL>'
  }
}

export function isDisposableDatabaseUrl(
  url: string,
  env: Env = process.env
): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return false
  }

  if (LOCAL_DATABASE_HOSTS.includes(hostname)) {
    return true
  }

  const optIn = env[DISPOSABLE_DATABASE_URL_ENV]
  return Boolean(optIn) && optIn === url
}

/**
 * Throws unless `url` points at a disposable database. `purpose` names the
 * caller in the error, for example "e2e database reset".
 */
export function assertDisposableDatabase(
  url: string | undefined,
  purpose: string,
  env: Env = process.env
): asserts url is string {
  if (!url) {
    throw new Error(
      `${purpose}: AUTH_DRIZZLE_URL is not set. Point it at a disposable ` +
        'local Postgres, for example ' +
        'postgres://postgres:postgres@localhost:5439/gdgoc.'
    )
  }

  if (!isDisposableDatabaseUrl(url, env)) {
    throw new Error(
      `${purpose}: refusing to touch ${describeDatabaseTarget(url)}. ` +
        'This command deletes data, so it only runs against a local ' +
        `database (${LOCAL_DATABASE_HOSTS.join(', ')}). To allow one ` +
        `specific remote database, set ${DISPOSABLE_DATABASE_URL_ENV} to ` +
        'its exact URL.'
    )
  }
}
