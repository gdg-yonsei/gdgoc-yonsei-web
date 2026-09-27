import { describe, expect, it } from 'vitest'
import {
  canConnectMcp,
  oauthQueryString,
  postLoginPath,
  selectableScopesFor,
} from '@/lib/mcp/consent'

describe('selectableScopesFor', () => {
  it.each([
    ['LEAD', ['gyms:read', 'gyms:write', 'gyms:admin']],
    ['CORE', ['gyms:read', 'gyms:write', 'gyms:admin']],
    ['MEMBER', ['gyms:read', 'gyms:write']],
    ['ALUMNUS', ['gyms:read', 'gyms:write']],
    ['UNVERIFIED', []],
  ] as const)('%s → %j', (role, scopes) => {
    expect(selectableScopesFor(role)).toEqual(scopes)
  })
})

describe('canConnectMcp', () => {
  it('rejects only UNVERIFIED', () => {
    expect(canConnectMcp('UNVERIFIED')).toBe(false)
    expect(canConnectMcp('ALUMNUS')).toBe(true)
  })
})

describe('oauthQueryString', () => {
  it('serialises repeated and single params in order', () => {
    expect(
      oauthQueryString({ client_id: 'c', scope: 'a b', sig: ['x'], empty: undefined })
    ).toBe('client_id=c&scope=a+b&sig=x')
  })
})

describe('postLoginPath', () => {
  it('resumes the OAuth authorize request for a signed authorization query', () => {
    expect(postLoginPath('client_id=c&sig=s&exp=1')).toBe(
      '/api/auth/oauth2/authorize?client_id=c&sig=s&exp=1'
    )
  })

  it('falls back to the admin home otherwise', () => {
    expect(postLoginPath('client_id=c')).toBe('/admin')
    expect(postLoginPath('sig=s')).toBe('/admin')
    expect(postLoginPath('')).toBe('/admin')
    expect(postLoginPath('error=Unable')).toBe('/admin')
  })
})
