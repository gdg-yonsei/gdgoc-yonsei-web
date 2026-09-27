import { describe, expect, it } from 'vitest'
import { withLoopbackApplicationType } from '@/lib/mcp/registration'

describe('withLoopbackApplicationType (SEP-837 default)', () => {
  it('marks loopback-only registrations as native', () => {
    expect(
      withLoopbackApplicationType({
        redirect_uris: ['http://localhost:9999/callback', 'http://127.0.0.1:1/cb'],
      })
    ).toMatchObject({ application_type: 'native' })
  })

  it('keeps an explicit application_type', () => {
    expect(
      withLoopbackApplicationType({
        redirect_uris: ['http://localhost:9999/callback'],
        application_type: 'web',
      })
    ).toMatchObject({ application_type: 'web' })
  })

  it('leaves https web clients alone', () => {
    const body = { redirect_uris: ['https://claude.ai/api/mcp/auth_callback'] }
    expect(withLoopbackApplicationType(body)).toBe(body)
  })

  it('does not treat mixed redirect sets as native', () => {
    const body = {
      redirect_uris: ['http://localhost:1/cb', 'https://example.com/cb'],
    }
    expect(withLoopbackApplicationType(body)).toBe(body)
  })

  it('ignores malformed bodies', () => {
    expect(withLoopbackApplicationType(null)).toBeNull()
    expect(withLoopbackApplicationType({ redirect_uris: 'x' })).toEqual({
      redirect_uris: 'x',
    })
  })
})
