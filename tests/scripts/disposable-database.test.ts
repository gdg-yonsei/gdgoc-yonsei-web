import { describe, expect, it } from 'vitest'
import {
  assertDisposableDatabase,
  describeDatabaseTarget,
  DISPOSABLE_DATABASE_URL_ENV,
  isDisposableDatabaseUrl,
} from '@/scripts/lib/disposable-database'

const REMOTE = 'postgresql://postgres:s3cret@129.154.50.184:5434/postgres'

describe('isDisposableDatabaseUrl', () => {
  it.each([
    'postgres://postgres:postgres@localhost:5439/gdgoc',
    'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    'postgres://postgres:postgres@[::1]:5432/test',
    'postgres://postgres:postgres@db:5432/app',
  ])('accepts the local database %s', (url) => {
    expect(isDisposableDatabaseUrl(url, {})).toBe(true)
  })

  it('rejects a remote database', () => {
    expect(isDisposableDatabaseUrl(REMOTE, {})).toBe(false)
  })

  it('rejects a remote database named "localhost" only in its path', () => {
    expect(
      isDisposableDatabaseUrl(
        'postgres://u:p@db.example.com:5432/localhost',
        {}
      )
    ).toBe(false)
  })

  it('accepts a remote database only when opted in with its exact URL', () => {
    expect(
      isDisposableDatabaseUrl(REMOTE, { [DISPOSABLE_DATABASE_URL_ENV]: REMOTE })
    ).toBe(true)
    expect(
      isDisposableDatabaseUrl(REMOTE, {
        [DISPOSABLE_DATABASE_URL_ENV]: REMOTE.replace(':5434/', ':5435/'),
      })
    ).toBe(false)
  })

  it('rejects an unparseable URL', () => {
    expect(isDisposableDatabaseUrl('not a url', {})).toBe(false)
  })
})

describe('assertDisposableDatabase', () => {
  it('passes for a local database', () => {
    expect(() =>
      assertDisposableDatabase(
        'postgres://postgres:postgres@localhost:5439/gdgoc',
        'test',
        {}
      )
    ).not.toThrow()
  })

  it('refuses a missing URL', () => {
    expect(() => assertDisposableDatabase(undefined, 'e2e reset', {})).toThrow(
      /e2e reset: AUTH_DRIZZLE_URL is not set/
    )
  })

  it('refuses a remote database without leaking the password', () => {
    let message = ''
    try {
      assertDisposableDatabase(REMOTE, 'e2e reset', {})
    } catch (error) {
      message = (error as Error).message
    }

    expect(message).toContain(
      'e2e reset: refusing to touch postgres@129.154.50.184:5434/postgres'
    )
    expect(message).toContain(DISPOSABLE_DATABASE_URL_ENV)
    expect(message).not.toContain('s3cret')
  })
})

describe('describeDatabaseTarget', () => {
  it('drops the password', () => {
    expect(describeDatabaseTarget(REMOTE)).toBe(
      'postgres@129.154.50.184:5434/postgres'
    )
  })
})
