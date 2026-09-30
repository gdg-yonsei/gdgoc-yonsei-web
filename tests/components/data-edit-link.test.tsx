import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { handlePermission } = vi.hoisted(() => ({ handlePermission: vi.fn() }))

vi.mock('@/lib/server/permission/handle-permission', () => ({
  default: handlePermission,
}))
vi.mock('@/lib/admin-i18n/server', () => ({
  getAdminLocale: async () => 'en',
  getAdminMessages: () => ({ edit: 'Edit' }),
  localizeAdminHref: (href: string) => href,
}))

import DataEditLink from '@/app/components/admin/data-edit-link'

const session = { user: { id: 'core' } } as never

describe('DataEditLink', () => {
  beforeEach(() => {
    handlePermission.mockReset()
    handlePermission.mockResolvedValue(true)
  })

  it('falls back to the role matrix when no decision is given', async () => {
    render(
      await DataEditLink({
        session,
        dataType: 'members',
        href: '/admin/members/x/edit',
      })
    )
    expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument()
  })

  it('hides the link when the caller already decided the user cannot edit', async () => {
    render(
      await DataEditLink({
        session,
        dataType: 'members',
        href: '/admin/members/x/edit',
        allowed: false,
      })
    )
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull()
    expect(handlePermission).not.toHaveBeenCalled()
  })
})
