import { describe, expect, it, vi } from 'vitest'

vi.mock('@/db', () => ({ db: {} }))

import { getAdminRouteIdentity } from '@/lib/server/admin-route-exists'

describe('getAdminRouteIdentity', () => {
  it('recognizes detail, edit and register screens', () => {
    expect(getAdminRouteIdentity('/admin/projects/abc')).toEqual({
      resource: 'projects',
      id: 'abc',
    })
    expect(getAdminRouteIdentity('/admin/parts/3/edit')).toEqual({
      resource: 'parts',
      id: '3',
    })
    expect(getAdminRouteIdentity('/admin/sessions/s-1/register')).toEqual({
      resource: 'sessions',
      id: 's-1',
    })
  })

  it('ignores lists, create screens and unknown paths', () => {
    for (const path of [
      '/admin',
      '/admin/projects',
      '/admin/projects/create',
      '/admin/members/accept',
      '/admin/profile/edit',
      '/admin/projects/abc/unknown',
      '/admin/projects/abc/edit/extra',
      '/en/project/25-26/abc',
    ]) {
      expect(getAdminRouteIdentity(path), path).toBeNull()
    }
  })
})
