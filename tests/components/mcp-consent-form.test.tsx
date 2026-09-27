import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { consent } = vi.hoisted(() => ({ consent: vi.fn() }))

vi.mock('@/lib/auth-client', () => ({
  authClient: { oauth2: { consent } },
}))

import ConsentForm from '@/app/(admin)/auth/mcp-consent/consent-form'

const assign = vi.fn()

describe('MCP consent form', () => {
  beforeEach(() => {
    consent.mockReset()
    assign.mockReset()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign },
    })
  })

  it('offers only the requested scopes the role can use', () => {
    render(
      <ConsentForm
        clientName={'Claude'}
        redirectHost={'claude.ai'}
        requestedScopes={['offline_access', 'gyms:read', 'gyms:write', 'gyms:admin']}
        selectableScopes={['gyms:read', 'gyms:write']}
      />
    )

    expect(screen.getByRole('checkbox', { name: /gyms:read/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /gyms:write/ })).toBeChecked()
    expect(screen.queryByRole('checkbox', { name: /gyms:admin/ })).toBeNull()
    expect(screen.getByText('claude.ai')).toBeInTheDocument()
  })

  it('approves the selected scopes and keeps offline_access', async () => {
    consent.mockResolvedValue({ data: { redirect_uri: 'https://claude.ai/cb?code=1' }, error: null })
    const user = userEvent.setup()
    render(
      <ConsentForm
        clientName={'Claude'}
        redirectHost={'claude.ai'}
        requestedScopes={['offline_access', 'gyms:read', 'gyms:write']}
        selectableScopes={['gyms:read', 'gyms:write']}
      />
    )

    await user.click(screen.getByRole('checkbox', { name: /gyms:write/ }))
    await user.click(screen.getByRole('button', { name: 'Allow' }))

    await waitFor(() => {
      expect(consent).toHaveBeenCalledWith({
        accept: true,
        scope: 'gyms:read offline_access',
      })
      expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?code=1')
    })
  })

  it('denies the request', async () => {
    consent.mockResolvedValue({ data: { redirect_uri: 'https://claude.ai/cb?error=access_denied' }, error: null })
    const user = userEvent.setup()
    render(
      <ConsentForm
        clientName={'Claude'}
        redirectHost={'claude.ai'}
        requestedScopes={['gyms:read']}
        selectableScopes={['gyms:read']}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Deny' }))

    await waitFor(() => {
      expect(consent).toHaveBeenCalledWith({ accept: false })
      expect(assign).toHaveBeenCalledWith('https://claude.ai/cb?error=access_denied')
    })
  })

  it('cannot approve with no scope selected', async () => {
    const user = userEvent.setup()
    render(
      <ConsentForm
        clientName={'Claude'}
        redirectHost={'claude.ai'}
        requestedScopes={['gyms:read']}
        selectableScopes={['gyms:read']}
      />
    )
    await user.click(screen.getByRole('checkbox', { name: /gyms:read/ }))
    expect(screen.getByRole('button', { name: 'Allow' })).toBeDisabled()
  })
})
