/**
 * DB를 지우거나 시드하는 스크립트(Playwright e2e 초기화, `pnpm db:seed`)의 안전장치.
 *
 * 2026-09-25에 e2e 초기화가 운영 DB를 TRUNCATE한 사고가 있었다. Playwright 프로세스가 운영을 가리키는
 * `.env`를 읽었고, `TRUNCATE` 전에 대상을 확인하는 곳이 없었다. 이제 파괴적인 스크립트는 모두 첫 쿼리
 * 전에 `assertDisposableDatabase`를 호출하므로, 원격 DB는 누군가 명시적으로 지정했을 때만 건드린다.
 */

/** 이 컴퓨터나 로컬 compose 네트워크를 가리키는 호스트 이름. */
export const LOCAL_DATABASE_HOSTS: readonly string[] = [
  'localhost',
  '127.0.0.1',
  '[::1]',
  '0.0.0.0',
  'db',
  'postgres',
]

/**
 * 지워도 되는 원격 DB 하나를 명시적으로 허용한다(예: 일회용 CI 인스턴스). `AUTH_DRIZZLE_URL`과 정확히
 * 같아야 하므로, 한 DB를 허용해도 같은 호스트의 다른 DB까지 허용되지는 않는다.
 */
export const DISPOSABLE_DATABASE_URL_ENV = 'E2E_DISPOSABLE_DATABASE_URL'

type Env = Readonly<Record<string, string | undefined>>

/** 오류 메시지용 `user@host:port/database`(비밀번호 제외). */
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

/**
 * `url`이 지워도 되는 DB인지. 로컬 호스트이거나, 명시적 허용 환경 변수 값과 정확히 같으면 true.
 * URL로 해석할 수 없으면 false(안전한 쪽으로 판단).
 */
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
 * `url`이 일회용 DB를 가리키지 않으면 예외를 던진다. `purpose`는 오류 메시지에 들어갈 호출자 이름
 * (예: "e2e database reset").
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
