// 파괴적인 스크립트는 첫 쿼리 전에 assertDisposableDatabase를 호출해야 한다. 원격 DB는 명시적 허용이 필요하다.

/** 이 컴퓨터나 로컬 compose 네트워크를 가리키는 호스트 이름. */
export const LOCAL_DATABASE_HOSTS: readonly string[] = [
  'localhost',
  '127.0.0.1',
  '[::1]',
  '0.0.0.0',
  'db',
  'postgres',
]

// 원격 허용값은 AUTH_DRIZZLE_URL과 정확히 같아야 한다. 같은 호스트의 다른 DB는 허용되지 않는다.
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

// 로컬 또는 명시적 허용 URL과 정확히 같은 DB만 일회용으로 본다. URL 해석 실패는 거절한다.
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

// 일회용 DB가 아니면 예외를 던진다. purpose는 오류에 표시할 호출자 이름이다.
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
