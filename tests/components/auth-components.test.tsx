import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { mockedRouterReplace } = vi.hoisted(() => ({
  mockedRouterReplace: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { passkey: vi.fn() },
    passkey: { addPasskey: vi.fn() },
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockedRouterReplace }),
}))

vi.mock('@/app/components/auth/sign-out-button/actions', () => ({
  signOutAction: vi.fn(),
}))

import { authClient } from '@/lib/auth-client'
import RegisterPasskeyButton from '@/app/components/auth/register-passkey-button'
import { SignOutButton } from '@/app/components/auth/sign-out-button'
import PasskeySignInButton from '@/app/(admin)/auth/sign-in/sign-in-options/passkey'
import SocialSubmitButton from '@/app/(admin)/auth/sign-in/sign-in-options/social-submit-button'

const mockedAddPasskey = vi.mocked(authClient.passkey.addPasskey)
const mockedPasskeySignIn = vi.mocked(authClient.signIn.passkey)

describe('auth components', () => {
  beforeEach(() => {
    mockedAddPasskey.mockReset()
    mockedPasskeySignIn.mockReset()
    mockedRouterReplace.mockReset()
    vi.mocked(globalThis.alert).mockClear()
  })

  it('calls signIn and shows success alert on passkey registration', async () => {
    mockedAddPasskey.mockResolvedValue({ data: {}, error: null } as never)

    const user = userEvent.setup()
    render(<RegisterPasskeyButton />)

    await user.click(screen.getByRole('button', { name: 'Register Passkey' }))

    await waitFor(() => {
      expect(mockedAddPasskey).toHaveBeenCalledWith()
      expect(globalThis.alert).toHaveBeenCalledWith(
        'The passkey has been registered.'
      )
    })
  })

  it('shows fail alert when passkey registration returns an error', async () => {
    mockedAddPasskey.mockResolvedValue({
      data: null,
      error: {
        code: 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED',
        message: 'already registered',
      },
    } as never)

    const user = userEvent.setup()
    render(<RegisterPasskeyButton />)

    await user.click(screen.getByRole('button', { name: 'Register Passkey' }))

    await waitFor(() => {
      expect(globalThis.alert).toHaveBeenCalledWith(
        'The passkey is already registered.'
      )
    })
  })

  it('shows a generic alert for non-duplicate passkey errors', async () => {
    mockedAddPasskey.mockResolvedValue({
      data: null,
      error: { code: 'UNKNOWN_ERROR', message: 'registration failed' },
    } as never)

    const user = userEvent.setup()
    render(<RegisterPasskeyButton />)

    await user.click(screen.getByRole('button', { name: 'Register Passkey' }))

    await waitFor(() => {
      expect(globalThis.alert).toHaveBeenCalledWith(
        'The passkey could not be registered. Please retry.'
      )
    })
  })

  it('restores the passkey sign-in button after an authentication error', async () => {
    mockedPasskeySignIn.mockResolvedValue({
      data: null,
      error: { message: 'authentication cancelled' },
    } as never)

    const user = userEvent.setup()
    render(<PasskeySignInButton callbackURL={'/admin'} />)

    const button = screen.getByRole('button', {
      name: /Sign in with Passkey/i,
    })
    await user.click(button)

    await waitFor(() => {
      expect(mockedPasskeySignIn).toHaveBeenCalledWith()
      expect(button).toBeEnabled()
    })
  })

  it('does a full navigation to resume an MCP OAuth request after passkey sign-in', async () => {
    mockedPasskeySignIn.mockResolvedValue({
      data: {},
      error: null,
    } as never)
    const assign = vi.fn()
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    })

    const user = userEvent.setup()
    render(
      <PasskeySignInButton
        callbackURL={'/api/auth/oauth2/authorize?client_id=c&sig=s'}
      />
    )
    await user.click(
      screen.getByRole('button', { name: /Sign in with Passkey/i })
    )

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(
        '/api/auth/oauth2/authorize?client_id=c&sig=s'
      )
    })
    expect(mockedRouterReplace).not.toHaveBeenCalled()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('uses App Router navigation after successful passkey authentication', async () => {
    mockedPasskeySignIn.mockResolvedValue({
      data: {},
      error: null,
    } as never)

    const user = userEvent.setup()
    render(<PasskeySignInButton callbackURL={'/admin'} />)
    await user.click(
      screen.getByRole('button', { name: /Sign in with Passkey/i })
    )

    await waitFor(() => {
      expect(mockedRouterReplace).toHaveBeenCalledWith('/admin')
    })
  })

  it('renders sign out button', () => {
    render(<SignOutButton />)

    expect(
      screen.getByRole('button', { name: /Sign Out/i })
    ).toBeInTheDocument()
  })

  it('keeps github sign-in button enabled when submit is prevented', async () => {
    const user = userEvent.setup()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <SocialSubmitButton provider="github" />
      </form>
    )

    const button = screen.getByRole('button', { name: /Sign in with Github/i })
    await user.click(button)

    expect(button).toBeEnabled()
  })

  it('keeps google sign-in button enabled when submit is prevented', async () => {
    const user = userEvent.setup()
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <SocialSubmitButton provider="google" />
      </form>
    )

    const button = screen.getByRole('button', { name: /Sign in with Google/i })
    await user.click(button)

    expect(button).toBeEnabled()
  })
})
