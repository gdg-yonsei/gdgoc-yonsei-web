import { afterEach, describe, expect, it } from 'vitest'
import { getSearchConsoleEnv } from '@/lib/server/env-core'

const KEYS = ['GSC_CLIENT_EMAIL', 'GSC_PRIVATE_KEY', 'GSC_SITE_URL'] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('getSearchConsoleEnv', () => {
  it('is null unless all three values are set', () => {
    expect(getSearchConsoleEnv()).toBeNull()
    process.env.GSC_CLIENT_EMAIL = 'gyms@project.iam.gserviceaccount.com'
    process.env.GSC_SITE_URL = 'https://gdgoc.yonsei.ac.kr/'
    expect(getSearchConsoleEnv()).toBeNull()
  })

  it('turns escaped newlines in the private key into real ones', () => {
    process.env.GSC_CLIENT_EMAIL = 'gyms@project.iam.gserviceaccount.com'
    process.env.GSC_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n'
    process.env.GSC_SITE_URL = 'sc-domain:gdgoc.yonsei.ac.kr'
    expect(getSearchConsoleEnv()).toEqual({
      clientEmail: 'gyms@project.iam.gserviceaccount.com',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      siteUrl: 'sc-domain:gdgoc.yonsei.ac.kr',
    })
  })
})
